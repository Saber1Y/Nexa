import { useCallback, useRef, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, keccak256, parseAbi, toBytes, type Address } from "viem";
import {
  BOT_CHAIN,
  BOT_CHAIN_NAME,
  BOT_GATEWAY_ADDRESS,
  BOT_RPC_URL,
  BOT_USDT_ADDRESS,
  DEFAULT_APPROVAL_BUDGET,
  ensureBotChain,
  formatUsdtAmount,
  getInjectedProvider,
  type InjectedEthereumProvider,
} from "@/utils/botChain";

const erc20Abi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

const gatewayAbi = parseAbi([
  "function pay(bytes32 serviceId, bytes32 requestHash) returns (bytes32 paymentId)",
  "event ServicePaid(bytes32 indexed paymentId, bytes32 indexed serviceId, address indexed payer, uint256 amount, bytes32 requestHash)",
]);

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function serviceIdBytes32(value: string): `0x${string}` {
  return keccak256(toBytes(value));
}

export function paymentRequestHash(body: Record<string, unknown>): `0x${string}` {
  return keccak256(toBytes(stableStringify(body)));
}

export interface GatewayAuditResponse {
  success: boolean;
  payment: { transaction: string; network: string; payer: string; amount: string; paymentId: string };
  results: Record<string, unknown>;
  receipt?: { recorded: boolean; tx?: string; resultHash?: string; reason?: string };
  execution?: { tx?: string };
  screeningId?: string;
}

export type GatewayPayStage = "chain" | "balance" | "approve" | "pay" | "confirm" | "audit";

interface PendingPayment {
  tx: `0x${string}`;
  requestHash: `0x${string}`;
  payer: string;
}

export function useGatewayPay() {
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [stage, setStage] = useState<GatewayPayStage | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<string | null>(null);
  const pendingRef = useRef<PendingPayment | null>(null);

  const runAudit = useCallback(async (
    url: string,
    account: string,
    body: Record<string, unknown>,
    amountAtomic: bigint,
  ): Promise<GatewayAuditResponse> => {
    if (!account) throw new Error("Connect an EVM wallet before paying.");
    if (!BOT_GATEWAY_ADDRESS) throw new Error("Direct-payment gateway is not configured for this build.");
    const provider: InjectedEthereumProvider | null = getInjectedProvider();
    if (!provider) throw new Error("No injected EVM wallet detected. Install or unlock your wallet.");

    const bodyHash = paymentRequestHash(body);
    setIsPaying(true);
    setPendingTransaction(null);
    try {
      setStage("chain");
      setStatus(`Switching wallet to ${BOT_CHAIN_NAME}...`);
      await ensureBotChain(provider);

      const publicClient = createPublicClient({ chain: BOT_CHAIN, transport: http(BOT_RPC_URL) });
      const wallet = createWalletClient({ account: account as Address, chain: BOT_CHAIN, transport: custom(provider) });
      let txHash: `0x${string}`;
      const pending = pendingRef.current;

      if (pending && pending.payer.toLowerCase() === account.toLowerCase() && pending.requestHash === bodyHash) {
        txHash = pending.tx;
        setPendingTransaction(txHash);
        setStatus("Reusing your already-confirmed payment to retry the audit request...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== "success") throw new Error(`The saved payment transaction failed: ${txHash}`);
      } else {
        setStage("balance");
        setStatus("Checking USDT balance and gateway allowance...");
        const [balance, allowance] = await Promise.all([
          publicClient.readContract({ address: BOT_USDT_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [account as Address] }),
          publicClient.readContract({ address: BOT_USDT_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [account as Address, BOT_GATEWAY_ADDRESS] }),
        ]);
        if (balance < amountAtomic) throw new Error(`Insufficient USDT. This audit costs ${formatUsdtAmount(amountAtomic)} USDT.`);

        if (allowance < amountAtomic) {
          setStage("approve");
          setStatus(`Approve USDT for the Nexa gateway (up to ${formatUsdtAmount(DEFAULT_APPROVAL_BUDGET)} USDT)...`);
          const approvalHash = await wallet.writeContract({
            address: BOT_USDT_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [BOT_GATEWAY_ADDRESS, DEFAULT_APPROVAL_BUDGET > amountAtomic ? DEFAULT_APPROVAL_BUDGET : amountAtomic],
          });
          setStatus("USDT approval submitted. Waiting for confirmation...");
          const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
          if (approvalReceipt.status !== "success") throw new Error("USDT approval failed on-chain.");
        }

        setStage("pay");
        setStatus(`Confirm the ${formatUsdtAmount(amountAtomic)} USDT payment in your wallet...`);
        txHash = await wallet.writeContract({
          address: BOT_GATEWAY_ADDRESS,
          abi: gatewayAbi,
          functionName: "pay",
          args: [serviceIdBytes32("resume-intelligence-v1"), bodyHash],
        });
        pendingRef.current = { tx: txHash, requestHash: bodyHash, payer: account };
        setPendingTransaction(txHash);
        setStatus("Payment submitted by your wallet. Waiting for on-chain confirmation...");
        const paymentReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (paymentReceipt.status !== "success") throw new Error(`Payment transaction failed: ${txHash}`);
      }

      setStage("audit");
      setStatus("Payment confirmed from your wallet. Requesting the AI audit...");
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...body, paymentTx: txHash }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = payload && typeof payload === "object" ? (payload as { detail?: string; error?: string }) : {};
        throw new Error(error.detail || error.error || `Audit request failed (${response.status}). Your confirmed payment is retained so retrying the same request will not pay again.`);
      }
      const data = payload as GatewayAuditResponse | null;
      if (!data?.results) throw new Error("Payment confirmed, but the audit response was malformed. Retry this same request to reuse the payment.");

      pendingRef.current = null;
      setPendingTransaction(null);
      setStatus("Direct payment confirmed. AI audit complete.");
      return data;
    } finally {
      setIsPaying(false);
      setStage(null);
    }
  }, []);

  return { runAudit, isPaying, status, setStatus, stage, pendingTransaction };
}
