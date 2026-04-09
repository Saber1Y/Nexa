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
          // NOTE: The server has feePayer enabled for USDC, but that sponsored
          // path is for programmatic agents only (zero-source tx). Browser wallets
          // like Freighter always use the unsponsored path — the server detects
          // this automatically and handles both cases.
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
              Accept: "text/event-stream",
            },
          });

          if (response.status === 402) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(`Payment rejected: ${errBody.error || "Invalid signature"}`);
          }
        }

        // ── Step 6: Process result (SSE stream or JSON) ─────────────────
        const contentType = response.headers.get("Content-Type") || "";

        if (contentType.includes("text/event-stream") && response.body) {
          // Stream mode — read SSE events for real-time progress
          setStatus("🔗 Payment verified! Submitting to GenLayer...");

          return await new Promise((resolve, reject) => {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            function processEvents(text: string) {
              buffer += text;
              const events = buffer.split("\n\n");
              buffer = events.pop() || ""; // Keep incomplete event in buffer

              for (const block of events) {
                const lines = block.split("\n");
                let eventName = "";
                let eventData = "";

                for (const line of lines) {
                  if (line.startsWith("event: ")) eventName = line.slice(7);
                  if (line.startsWith("data: ")) eventData = line.slice(6);
                }

                if (!eventName || !eventData) continue;

                try {
                  const parsed = JSON.parse(eventData);

                  switch (eventName) {
                    case "submitted":
                      // GenLayer tx hash available — show explorer link immediately
                      if (parsed.genLayerHash) {
                        setTxHash(parsed.genLayerHash);
                        setStatus("🧠 AI Validators reaching consensus...");
                      }
                      break;
                    case "status":
                      setStatus(`⏳ ${parsed.message}`);
                      break;
                    case "complete":
                      setStatus("✅ Complete!");
                      setAvailableChallenges(null);
                      if (parsed.results?.txHash) setTxHash(parsed.results.txHash);
                      resolve(parsed);
                      return;
                    case "error":
                      reject(new Error(parsed.error || parsed.hint || "Audit failed"));
                      return;
                  }
                } catch {
                  // Skip malformed events
                }
              }
            }

            function read() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  // Stream ended without a complete event
                  if (buffer.trim()) processEvents("\n\n");
                  return;
                }
                processEvents(decoder.decode(value, { stream: true }));
                read();
              }).catch(reject);
            }

            read();
          });
        }

        // Non-streaming fallback (standard JSON response)
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
