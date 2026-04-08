import { useState, useCallback } from "react";
import { signTransaction } from "@stellar/freighter-api";
import {
  Contract,
  Address,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  BASE_FEE,
  rpc,
} from "@stellar/stellar-sdk";
import { Challenge, Credential } from "mppx";

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMpp() {
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchWithMpp = useCallback(
    async (url: string, walletAddress: string, options: RequestInit = {}) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      setIsPaying(false);
      setStatus("Initiating Audit...");

      try {
        // ── Step 1: Initial request → triggers 402 ──────────────────────
        let response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Accept: "application/json",
          },
        });

        // ── Step 2: Handle 402 Payment Required ─────────────────────────
        if (response.status === 402) {
          // Use the mppx library to properly parse the challenge.
          // This ensures HMAC-bound IDs and canonical JSON serialization
          // match exactly what the server expects.
          const challenge = Challenge.fromResponse(response);

          console.log("MPP Challenge (parsed via mppx):", challenge);

          const { amount, currency, recipient } = challenge.request as {
            amount: string;
            currency: string;
            recipient: string;
          };
          const humanAmount = (Number(amount) / 1e7).toFixed(2);

          setStatus(
            `💳 402 Payment Required: ${humanAmount} USDC. Building Soroban transaction...`
          );
          setIsPaying(true);

          // ── Step 3: Build Soroban SAC transfer invocation ─────────────
          const sorobanServer = new rpc.Server(
            "https://soroban-testnet.stellar.org"
          );
          const sourceAccount = await sorobanServer.getAccount(walletAddress);

          const contract = new Contract(currency);
          const stellarAmount = BigInt(amount);

          const transferOp = contract.call(
            "transfer",
            new Address(walletAddress).toScVal(),
            new Address(recipient).toScVal(),
            nativeToScVal(stellarAmount, { type: "i128" })
          );

          const tx = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
          })
            .addOperation(transferOp)
            .setTimeout(180)
            .build();

          // ── Step 4: Simulate & prepare (adds Soroban resource data) ───
          setStatus("💳 Simulating transaction on Soroban RPC...");
          const prepared = await sorobanServer.prepareTransaction(tx);

          // ── Step 5: Sign with Freighter ────────────────────────────────
          setStatus("💳 Please sign in Freighter wallet...");
          const preparedXdr = prepared.toXDR();
          const signResult = await signTransaction(preparedXdr, {
            networkPassphrase: Networks.TESTNET,
          });
          const signedXdr = signResult.signedTxXdr;

          setStatus("⌛ Verifying payment & finalizing audit...");
          setIsPaying(false);

          // ── Step 6: Build the credential using mppx library ───────────
          // Credential.serialize() ensures:
          // 1. Canonical JSON serialization via Json.canonicalize (ox)
          // 2. Proper base64url encoding matching server expectations
          // 3. Correct HMAC verification on the server side
          const authHeader = Credential.serialize({
            challenge,
            payload: {
              type: "transaction" as const,
              transaction: signedXdr,
            },
            source: `did:pkh:stellar:testnet:${walletAddress}`,
          });

          console.log("Authorization header (via mppx Credential.serialize)");

          // ── Step 7: Retry with credential ─────────────────────────────
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: authHeader,
            },
          });

          if (response.status === 402) {
            // Extract server error details if available
            let detail = "";
            try {
              const errBody = await response.json();
              detail = errBody?.error || errBody?.message || errBody?.detail || "";
              if (typeof detail === "object") detail = JSON.stringify(detail);
            } catch { /* ignore */ }
            throw new Error(
              `Payment transaction was rejected by the server.${detail ? " " + detail : ""}`
            );
          }
        }

        // ── Step 8: Process result ──────────────────────────────────────
        const data = await response.json();
        if (data.success) {
          setStatus("✅ Audit Complete!");
          if (data.results?.txHash) setTxHash(data.results.txHash);
        } else if (data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (e: unknown) {
        const msg = (e as Error).message || "Process failed";
        console.error(e);
        setStatus(`❌ Error: ${msg}`);
        throw e;
      } finally {
        setIsPaying(false);
      }
    },
    []
  );

  return { fetchWithMpp, isPaying, status, txHash };
}
