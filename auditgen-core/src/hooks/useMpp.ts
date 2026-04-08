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
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[] | null>(null);

  const fetchWithMpp = useCallback(
    async (url: string, walletAddress: string, options: RequestInit = {}, selectedChallenge?: Challenge) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      setIsPaying(false);
      setStatus("Initiating Request...");
      setAvailableChallenges(null);

      try {
        // ── Step 1: Request with optional credential ───────────────────
        let response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Accept: "application/json",
          },
        });

        // ── Step 2: Handle 402 Payment Required ─────────────────────────
        if (response.status === 402 && !selectedChallenge) {
          // Detect all available methods (USDC, XLM, etc.)
          const challenges = Challenge.fromResponseList(response);
          console.log("MPP Challenges detected:", challenges);
          
          if (challenges.length > 1) {
            setAvailableChallenges(challenges);
            setStatus("💳 Select Payment Method...");
            return { paymentRequired: true, challenges };
          }
          
          // Default to the first one if only one exists
          selectedChallenge = challenges[0];
        }

        if (selectedChallenge) {
          const { amount, currency } = selectedChallenge.request as {
            amount: string;
            currency: string;
            recipient: string;
          };
          
          const isUsdc = currency === "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
          const assetName = isUsdc ? "USDC" : "XLM";
          const humanAmount = (Number(amount) / 1e7).toFixed(2);

          setStatus(`💳 Paying ${humanAmount} ${assetName}...`);
          setIsPaying(true);

          // ── Step 3: Build Soroban SAC transfer invocation ─────────────
          const sorobanServer = new rpc.Server("https://soroban-testnet.stellar.org");
          const sourceAccount = await sorobanServer.getAccount(walletAddress);
          const contract = new Contract(currency);
          const stellarAmount = BigInt(amount);

          const transferOp = contract.call(
            "transfer",
            new Address(walletAddress).toScVal(),
            new Address(selectedChallenge.request.recipient as string).toScVal(),
            nativeToScVal(stellarAmount, { type: "i128" })
          );

          const tx = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
          })
            .addOperation(transferOp)
            .setTimeout(180)
            .build();

          // ── Step 4: Simulate & sign ───────────────────────────────────
          setStatus(`⌛ Preparing ${assetName} transfer...`);
          const prepared = await sorobanServer.prepareTransaction(tx);
          
          setStatus("💳 Sign with Freighter...");
          const signResult = await signTransaction(prepared.toXDR(), {
            networkPassphrase: Networks.TESTNET,
          });

          setStatus("⌛ Verifying payment...");
          setIsPaying(false);

          // ── Step 5: Build credential and retry ────────────────────────
          const authHeader = Credential.serialize({
            challenge: selectedChallenge,
            payload: {
              type: "transaction" as const,
              transaction: signResult.signedTxXdr,
            },
            source: `did:pkh:stellar:testnet:${walletAddress}`,
          });

          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: authHeader,
              Accept: "application/json",
            },
          });

          if (response.status === 402) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(`Payment rejected: ${errBody.error || "Invalid signature"}`);
          }
        }

        // ── Step 6: Process result ──────────────────────────────────────
        const data = await response.json();
        if (data.success) {
          setStatus("✅ Complete!");
          if (data.results?.txHash) setTxHash(data.results.txHash);
          setAvailableChallenges(null);
        } else if (data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (e: unknown) {
        const msg = (e as Error).message || "Process failed";
        console.error("MPP Error:", e);
        setStatus(`❌ ${msg}`);
        setAvailableChallenges(null);
        throw e;
      } finally {
        setIsPaying(false);
      }
    },
    []
  );

  return { fetchWithMpp, isPaying, status, txHash, availableChallenges, setAvailableChallenges };
}
