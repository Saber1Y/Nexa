import { useState, useCallback } from "react";
import { signTransaction } from "@stellar/freighter-api";

/**
 * useMpp Hook
 * Handles the HTTP 402 (Payment Required) handshake for the Nexa Bridge.
 */
export function useMpp() {
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchWithMpp = useCallback(async (url: string, options: RequestInit = {}) => {
    setIsPaying(false);
    setStatus("Initiating Audit...");
    
    try {
      // 1. Initial Request
      let response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Accept": "application/json",
        },
      });

      // 2. Handle x402 Challenge
      if (response.status === 402) {
        const wwwAuth = response.headers.get("www-authenticate");
        if (!wwwAuth || !wwwAuth.startsWith("Stellar ")) {
          throw new Error("Missing or invalid MPP challenge from server");
        }

        // Parse the challenge (Expected: Stellar { "transaction": "...", ... })
        const challengeJson = wwwAuth.replace("Stellar ", "");
        const challenge = JSON.parse(challengeJson);
        const xdr = challenge.transaction;

        if (!xdr) throw new Error("No transaction XDR provided in challenge");

        // 3. Trigger Freighter for Signing
        setStatus("💳 402 Payment Required. Waiting for Freighter...");
        setIsPaying(true);

        const signedXdr = await signTransaction(xdr, { network: "TESTNET" });
        
        setStatus("⌛ Verifying Payment & Finalizing Audit...");
        setIsPaying(false);

        // 4. Retry Request with Signed XDR (Credential)
        const credential = { type: "transaction", transaction: signedXdr };
        
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            "Authorization": `Stellar ${JSON.stringify(credential)}`,
          }
        });
      }

      // 5. Finalize Result
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
      setStatus(`❌ Error: ${msg}`);
      throw e;
    } finally {
      setIsPaying(false);
    }
  }, []);

  return { fetchWithMpp, isPaying, status, txHash };
}
