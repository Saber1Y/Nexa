"use client";

import { useCallback, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { parseAbi, keccak256, toBytes } from "viem";
import {
  BOT_CHAIN,
  BOT_CHAIN_ID,
  BOT_RPC_URL,
  BOT_USDT_ADDRESS,
  ensureBotChain,
  formatUsdtAmount,
  getInjectedProvider,
  type InjectedEthereumProvider,
} from "@/utils/botChain";

const erc20Abi = parseAbi([
  "function allowance(address,address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
]);

const gatewayAbi = parseAbi([
  "function pay(bytes32 serviceId, bytes32 requestHash) external returns (bytes32)",
  "event ServicePaid(bytes32 indexed paymentId, bytes32 indexed serviceId, address indexed payer, uint256 amount, bytes32 requestHash)",
]);

export function serviceIdBytes32(value: string): `0x${string}` {
  return keccak256(toBytes(value)) as `0x${string}`;
}

export function requestHash(body: Record<string, unknown>): `0x${string}` {
  return keccak256(toBytes(JSON.stringify(body))) as `0x${string}`;
}

export interface AuditSuccessResponse {
  success: boolean;
  payment: { transaction: string; payer: string; amount: string; paymentId: string; [k: string]: unknown };
  results: Record<string, unknown>;
  [k: string]: unknown;
}

export interface GatewayPayOptions {
  gateway: Address;
  serviceId: string;
  amountAtomic: bigint;
  priceLabel: string;
  apiUrl: string;
  body: Record<string, unknown>;
}

export function useGatewayPay() {
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  const run = useCallback(async (opts: GatewayPayOptions, account: string): Promise<AuditSuccessResponse> => {
    if (!account) throw new Error("Connect wallet");
    setIsPaying(true);
    const provider: InjectedEthereumProvider | null = getInjectedProvider();
    if (!provider) throw new Error("No injected wallet");
    try {
      setStage("chain");
      setStatus("Switching to BOT Chain...");
      await ensureBotChain(provider);
      const publicClient = createPublicClient({ chain: BOT_CHAIN, transport: http(BOT_RPC_URL) });
      setStage("balance");
      setStatus("Checking balance/allowance...");
      const [balance, allowance] = await Promise.all([
        publicClient.readContract({ address: BOT_USDT_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [account as Address] }),
        publicClient.readContract({ address: BOT_USDT_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [account as Address, opts.gateway] }),
      ]);
      if (balance < opts.amountAtomic) throw new Error(`Insufficient USDT: need ${opts.priceLabel}`);
      const wallet = createWalletClient({ account: account as Address, chain: BOT_CHAIN, transport: custom(provider) });
      if (allowance < opts.amountAtomic) {
        setStage("approve");
        setStatus("Approving USDT...");
        const h = await wallet.writeContract({ address: BOT_USDT_ADDRESS, abi: erc20Abi, functionName: "approve", args: [opts.gateway, opts.amountAtomic * 100n] });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }
      setStage("pay");
      setStatus("Signing payment...");
      const sid = serviceIdBytes32(opts.serviceId);
      const reqh = requestHash(opts.body);
      const tx = await wallet.writeContract({ address: opts.gateway, abi: gatewayAbi, functionName: "pay", args: [sid, reqh] });
      setStatus("Waiting for confirmation...");
      const rcpt = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (rcpt.status !== "success") throw new Error("Payment tx failed");
      setStage("audit");
      setStatus("Payment confirmed, requesting audit...");
      const res = await fetch(opts.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...opts.body, paymentTx: tx }),
      });
      const bodyRes: any = await res.json().catch(() => null);
      if (!res.ok) throw new Error(bodyRes?.error || "Request failed");
      setStatus("Done");
      return bodyRes as AuditSuccessResponse;
    } finally {
      setIsPaying(false);
      setStage(null);
    }
  }, []);

  return { run, isPaying, status, stage };
}
