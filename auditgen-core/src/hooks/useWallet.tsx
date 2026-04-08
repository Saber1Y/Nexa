import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  isConnected as freighterIsConnected,
  requestAccess,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";

export interface WalletState {
  address: string | null;
  network: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!address;

  // Try to silently reconnect if Freighter already authorized this site
  useEffect(() => {
    (async () => {
      try {
        const connected = await freighterIsConnected();
        if (connected) {
          const result = await getAddress();
          if (result.address) {
            setAddress(result.address);
            try {
              const net = await getNetwork();
              setNetwork(net.network || "TESTNET");
            } catch {
              setNetwork("TESTNET");
            }
          }
        }
      } catch {
        // Extension not installed or denied — no-op on load
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Check if Freighter is installed
      const connected = await freighterIsConnected();
      if (!connected) {
        throw new Error("Freighter extension not detected. Please install it from freighter.app");
      }

      // This triggers the Freighter popup for authorization
      const result = await requestAccess();

      if (result.error) {
        throw new Error(typeof result.error === "string" ? result.error : "Connection rejected");
      }

      if (!result.address) {
        throw new Error("No address returned from Freighter");
      }

      setAddress(result.address);

      try {
        const net = await getNetwork();
        setNetwork(net.network || "TESTNET");
      } catch {
        setNetwork("TESTNET");
      }
    } catch (e: unknown) {
      const msg = (e as Error)?.message || "Failed to connect wallet";
      setError(msg);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, network, isConnected, isConnecting, error, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}
