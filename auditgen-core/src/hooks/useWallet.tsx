import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getInjectedProvider, getSilentAccounts, getWalletChainId, requestAccounts } from "@/utils/botChain";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<string>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!address;

  // Silently restore an already-authorized session and track wallet events.
  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider) return;

    let cancelled = false;
    getSilentAccounts(provider).then((accounts) => {
      if (cancelled || accounts.length === 0) return;
      setAddress(accounts[0]);
      getWalletChainId(provider).then((id) => {
        if (!cancelled) setChainId(id);
      });
    });

    const onAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts.map(String) : [];
      setAddress(list.length > 0 ? list[0] : null);
      if (list.length === 0) setChainId(null);
    };
    const onChainChanged = (id: unknown) => {
      setChainId(typeof id === "string" ? Number.parseInt(id, 16) : null);
    };

    provider.on?.("accountsChanged", onAccountsChanged as (...args: never[]) => void);
    provider.on?.("chainChanged", onChainChanged as (...args: never[]) => void);
    return () => {
      cancelled = true;
      provider.removeListener?.("accountsChanged", onAccountsChanged as (...args: never[]) => void);
      provider.removeListener?.("chainChanged", onChainChanged as (...args: never[]) => void);
    };
  }, []);

  const connect = useCallback(async (): Promise<string> => {
    setIsConnecting(true);
    setError(null);
    try {
      const provider = getInjectedProvider();
      if (!provider) {
        throw new Error("Injected EVM wallet not detected. Please install MetaMask from metamask.io");
      }
      const accounts = await requestAccounts(provider);
      setAddress(accounts[0]);
      setChainId(await getWalletChainId(provider));
      return accounts[0];
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
    setChainId(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
      }}
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
