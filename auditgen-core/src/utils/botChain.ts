import type { Address } from "viem";

// ── BOT Chain (Bohr Testnet) configuration ─────────────────────────────────
export const BOT_CHAIN_ID = 968;
export const BOT_CHAIN_HEX = "0x3c8";
export const BOT_CHAIN_NAME = "BOT Chain Bohr Testnet";
export const BOT_NETWORK = "eip155:968";
export const BOT_RPC_URL = "https://rpc.bohr.life";
export const BOT_EXPLORER_URL = "https://scan.bohr.life";
export const BOT_USDT_ADDRESS: Address = "0x75edC9335175Fc0552D51D48439F229c10420fe3";
export const BOT_USDT_DECIMALS = 6;
export const BOT_PERMIT2_ADDRESS: Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const BOT_EXACT_PERMIT2_PROXY: Address = "0x402085c248EeA27D92E8b30b2C58ed07f9E20001";

// One-time ERC-20 approval budget: 10 tUSDT (many audits before re-approving).
export const DEFAULT_APPROVAL_BUDGET = 10_000_000n;

export const BOT_CHAIN = {
  id: BOT_CHAIN_ID,
  name: BOT_CHAIN_NAME,
  nativeCurrency: { name: "tBOT", symbol: "tBOT", decimals: 18 },
  rpcUrls: { default: { http: [BOT_RPC_URL] } },
  blockExplorers: { default: { name: "BOT Scan", url: BOT_EXPLORER_URL } },
} as const;

export const explorerTxUrl = (hash: string): string => `${BOT_EXPLORER_URL}/tx/${hash}`;

export function formatUsdtAmount(atomic: bigint | string): string {
  const value = typeof atomic === "bigint" ? atomic : BigInt(atomic);
  return (Number(value) / 10 ** BOT_USDT_DECIMALS).toFixed(2);
}

// ── Injected EIP-1193 provider (MetaMask / browser wallets) ────────────────
export interface InjectedEthereumProvider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, listener: (...args: never[]) => void) => void;
  removeListener?: (event: string, listener: (...args: never[]) => void) => void;
  isMetaMask?: boolean;
  providers?: InjectedEthereumProvider[];
}

interface WindowWithEthereum {
  ethereum?: InjectedEthereumProvider;
}

export function getInjectedProvider(): InjectedEthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as WindowWithEthereum).ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    return eth.providers.find((p) => p.isMetaMask) || eth.providers[0];
  }
  return eth;
}

const ADD_ETHEREUM_CHAIN_PARAMS = {
  chainId: BOT_CHAIN_HEX,
  chainName: BOT_CHAIN_NAME,
  nativeCurrency: { name: "tBOT", symbol: "tBOT", decimals: 18 },
  rpcUrls: [BOT_RPC_URL],
  blockExplorerUrls: [BOT_EXPLORER_URL],
};

export async function getWalletChainId(provider: InjectedEthereumProvider): Promise<number | null> {
  try {
    const hex = await provider.request({ method: "eth_chainId" });
    if (typeof hex === "string") return Number.parseInt(hex, 16);
    return null;
  } catch {
    return null;
  }
}

export async function getSilentAccounts(provider: InjectedEthereumProvider): Promise<string[]> {
  try {
    const accounts = await provider.request({ method: "eth_accounts" });
    return Array.isArray(accounts) ? accounts.map(String) : [];
  } catch {
    return [];
  }
}

export async function requestAccounts(provider: InjectedEthereumProvider): Promise<string[]> {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error("No account returned by the wallet");
  }
  return accounts.map(String);
}

export async function ensureBotChain(provider: InjectedEthereumProvider): Promise<void> {
  const current = await getWalletChainId(provider);
  if (current === BOT_CHAIN_ID) return;

  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BOT_CHAIN_HEX }] });
  } catch (switchError) {
    const code = (switchError as { code?: number } | null)?.code;
    if (code === 4001) {
      throw new Error("Switching the wallet to BOT Chain was rejected.");
    }
    //4902 = chain unknown to the wallet; other wallets use -32603/32602.
    // Try to register the chain, then fall through to the final check below.
    try {
      await provider.request({ method: "wallet_addEthereumChain", params: [ADD_ETHEREUM_CHAIN_PARAMS] });
    } catch {
      // Handled by the final chain check.
    }
  }

  const after = await getWalletChainId(provider);
  if (after !== BOT_CHAIN_ID) {
    throw new Error(`Wallet is not on ${BOT_CHAIN_NAME} (chain ${BOT_CHAIN_ID}). Switch network manually and retry.`);
  }
}
