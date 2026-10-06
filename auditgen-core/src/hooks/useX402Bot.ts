import { useCallback, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import {
  BOT_CHAIN,
  BOT_CHAIN_ID,
  BOT_NETWORK,
  BOT_PERMIT2_ADDRESS,
  BOT_RPC_URL,
  BOT_USDT_ADDRESS,
  DEFAULT_APPROVAL_BUDGET,
  ensureBotChain,
  formatUsdtAmount,
  getInjectedProvider,
  type InjectedEthereumProvider,
} from "@/utils/botChain";

// ── x402 / BOT payment protocol types ──────────────────────────────────────

export interface PaymentResource {
  url: string;
  description: string;
  mimeType: string;
}

export interface PaymentExtra {
  name: string;
  version: string;
  assetTransferMethod: string;
  permit2: string;
  proxy: string;
  serviceId: string;
}

export interface PaymentAccept {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: PaymentExtra;
  resource: PaymentResource;
}

export interface PaymentRequiredBody {
  x402Version: number;
  error?: string;
  resource: PaymentResource;
  accepts: PaymentAccept[];
  extensions?: Record<string, unknown>;
}

export interface PermitMessage {
  permitted: { token: string; amount: bigint };
  spender: string;
  nonce: bigint;
  deadline: bigint;
  witness: { to: string; validAfter: bigint };
  // Index signature: viem's signTypedData message parameter is Record<string, unknown>.
  [key: string]: unknown;
}

export interface PermitAuthorization {
  permitted: { token: string; amount: string };
  spender: string;
  nonce: string;
  deadline: string;
  witness: { to: string; validAfter: string };
  from: string;
}

export interface PaymentSignaturePayload {
  x402Version: 2;
  resource: PaymentResource;
  accepted: PaymentAccept;
  payload: { signature: string; permit2Authorization: PermitAuthorization };
  extensions: Record<string, unknown>;
}

export interface AuditScreeningResults {
  verdict: string;
  match_score: number;
  seniority: string;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  confidence?: number;
  [key: string]: unknown;
}

export interface AuditSuccessResponse {
  success: boolean;
  payment: {
    transaction: string;
    network: string;
    payer: string;
    amount: string;
    paymentId: string;
  };
  service?: { id?: string; version?: string };
  adapter?: string;
  execution?: {
    type?: string;
    tx?: string;
    upstreamModel?: string;
    upstreamPayment?: unknown;
    note?: string;
  };
  screeningId?: string;
  results: AuditScreeningResults;
  resultHash?: string;
  receipt?: {
    paymentId: string;
    resultHash: string;
    recorded: boolean;
    tx?: string;
    registry?: string;
    signer?: string;
    reason?: string;
  };
}

// ── Pure helpers (unit-tested) ─────────────────────────────────────────────

export function stringifyBigInts(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v));
}

export function encodeBase64Url(value: unknown): string {
  const json = typeof value === "string" ? value : stringifyBigInts(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function randomNonce(): bigint {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  let hex = "0x";
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, "0");
  return BigInt(hex);
}

export function buildPermitTypedData(
  accepted: PaymentAccept,
  options: { nowSec?: number; nonce?: bigint } = {},
): {
  domain: { name: string; chainId: number; verifyingContract: Address };
  types: Record<string, { name: string; type: string }[]>;
  primaryType: "PermitWitnessTransferFrom";
  message: PermitMessage;
} {
  const nowSec = options.nowSec ?? Math.floor(Date.now() / 1000);
  const nonce = options.nonce ?? randomNonce();
  const message: PermitMessage = {
    permitted: { token: accepted.asset, amount: BigInt(accepted.amount) },
    spender: accepted.extra.proxy,
    nonce,
    deadline: BigInt(nowSec + accepted.maxTimeoutSeconds),
    witness: { to: accepted.payTo, validAfter: BigInt(nowSec - 5) },
  };
  return {
    domain: { name: "Permit2", chainId: BOT_CHAIN_ID, verifyingContract: BOT_PERMIT2_ADDRESS },
    types: {
      TokenPermissions: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      Witness: [
        { name: "to", type: "address" },
        { name: "validAfter", type: "uint256" },
      ],
      PermitWitnessTransferFrom: [
        { name: "permitted", type: "TokenPermissions" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "witness", type: "Witness" },
      ],
    },
    primaryType: "PermitWitnessTransferFrom",
    message,
  };
}

export function buildPermitAuthorization(message: PermitMessage, from: string): PermitAuthorization {
  return {
    permitted: { token: message.permitted.token, amount: message.permitted.amount.toString() },
    spender: message.spender,
    nonce: message.nonce.toString(),
    deadline: message.deadline.toString(),
    witness: { to: message.witness.to, validAfter: message.witness.validAfter.toString() },
    from,
  };
}

export function buildPaymentSignaturePayload(
  accepted: PaymentAccept,
  resource: PaymentResource,
  signature: string,
  authorization: PermitAuthorization,
): PaymentSignaturePayload {
  return {
    x402Version: 2,
    resource,
    accepted,
    payload: { signature, permit2Authorization: authorization },
    extensions: {},
  };
}

export function buildPaymentSignatureHeader(args: {
  accepted: PaymentAccept;
  resource: PaymentResource;
  signature: string;
  authorization: PermitAuthorization;
}): string {
  const payload = buildPaymentSignaturePayload(
    args.accepted,
    args.resource,
    args.signature,
    args.authorization,
  );
  return encodeBase64Url(payload);
}

export function extractPaymentRequired(
  headerValue: string | null | undefined,
  body: unknown,
): PaymentRequiredBody {
  if (headerValue) {
    try {
      const parsed = JSON.parse(decodeBase64Url(headerValue)) as PaymentRequiredBody;
      if (parsed && Array.isArray(parsed.accepts) && parsed.accepts.length > 0) return parsed;
    } catch {
      // Malformed header - fall through to the JSON body.
    }
  }
  if (body && typeof body === "object" && Array.isArray((body as PaymentRequiredBody).accepts)) {
    const bodyAsRequired = body as PaymentRequiredBody;
    if (bodyAsRequired.accepts.length > 0) return bodyAsRequired;
  }
  throw new Error("Malformed 402 response: payment requirements missing");
}

export interface PaymentFailure {
  status?: number;
  body?: {
    error?: string;
    detail?: string;
    paymentId?: string;
    refund?: string;
  } | null;
  message?: string;
}

export function describePaymentError(failure: PaymentFailure): string {
  const { status, body } = failure;
  const code = body?.error;
  const detail = body?.detail ? ` ${body.detail}` : "";

  if (status === 409 || code === "duplicate_payment") {
    const id = body?.paymentId ? ` (${body.paymentId.slice(0, 18)}…)` : "";
    return `Duplicate payment${id}: this payment was already settled. Start a new audit to pay again.`;
  }
  if (code === "settlement_failed") {
    return `Payment settlement failed:${detail} No tUSDT was captured - please retry.`;
  }
  if (status === 502 || code === "execution_failed") {
    const refund = body?.refund ? ` ${body.refund}` : "";
    return `AI execution failed after payment.${detail}${refund}`;
  }
  if (code === "insufficient_funds") {
    return "Insufficient tUSDT balance on BOT testnet. Fund your wallet with at least 0.10 tUSDT and retry.";
  }
  if (code === "PERMIT2_ALLOWANCE_REQUIRED") {
    return "Token allowance is still below the payment amount. Approve tUSDT for Permit2 and retry.";
  }
  if (code === "authorization_expired") {
    return "The payment authorization expired before settlement. Please retry.";
  }
  if (code) return `Payment rejected: ${code}.${detail}`;
  if (body?.error) return body.error;
  if (failure.message) return failure.message;
  return status ? `Request failed with status ${status}` : "Network error: could not reach the audit service";
}

export function isUserRejection(error: unknown): boolean {
  const e = error as { name?: string; code?: number; message?: string; shortMessage?: string } | null;
  if (!e) return false;
  return (
    e.name === "UserRejectedRequestError" ||
    e.code === 4001 ||
    /user rejected|user denied/i.test(`${e.shortMessage ?? ""} ${e.message ?? ""}`)
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export type X402Stage = "quote" | "chain" | "balance" | "approve" | "sign" | "settle" | "audit";

const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function useX402Bot() {
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [stage, setStage] = useState<X402Stage | null>(null);

  const runAudit = useCallback(
    async (url: string, account: string, body: Record<string, string>): Promise<AuditSuccessResponse> => {
      if (!account) throw new Error("Connect an EVM wallet before running a paid audit.");
      setIsPaying(true);
      try {
        const provider: InjectedEthereumProvider | null = getInjectedProvider();
        if (!provider) {
          throw new Error("No injected EVM wallet detected. Install MetaMask to continue.");
        }

        // 1. Quote: first POST without a payment signature triggers the 402 challenge.
        setStage("quote");
        setStatus("Requesting audit quote...");
        const first = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (first.status !== 402) {
          const firstBody: unknown = await first.json().catch(() => null);
          if (first.status === 200) return firstBody as AuditSuccessResponse;
          throw new Error(describePaymentError({ status: first.status, body: firstBody as PaymentFailure["body"] }));
        }
        const headerValue = first.headers.get("PAYMENT-REQUIRED");
        const responseBody: unknown = await first.json().catch(() => null);
        const required = extractPaymentRequired(headerValue, responseBody);
        const accepted = required.accepts[0];
        if (accepted.scheme !== "exact" || accepted.network !== BOT_NETWORK) {
          throw new Error(`Unsupported payment requirement: ${accepted.scheme}/${accepted.network}`);
        }
        const amount = BigInt(accepted.amount);
        const priceLabel = formatUsdtAmount(amount);
        setStatus(`Quote received: ${priceLabel} tUSDT on BOT testnet`);

        // 2. Chain: make sure the wallet is on BOT Chain (968).
        setStage("chain");
        setStatus(`Switching wallet to ${BOT_CHAIN.name}...`);
        await ensureBotChain(provider);

        const publicClient = createPublicClient({ chain: BOT_CHAIN, transport: http(BOT_RPC_URL) });

        // 3. Balance + allowance check.
        setStage("balance");
        setStatus("Checking tUSDT balance and Permit2 allowance...");
        let balance: bigint;
        let allowance: bigint;
        try {
          [balance, allowance] = await Promise.all([
            publicClient.readContract({
              address: BOT_USDT_ADDRESS,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [account as Address],
            }),
            publicClient.readContract({
              address: BOT_USDT_ADDRESS,
              abi: erc20Abi,
              functionName: "allowance",
              args: [account as Address, BOT_PERMIT2_ADDRESS],
            }),
          ]);
        } catch (rpcError) {
          throw new Error(
            `Could not reach BOT Chain RPC (${BOT_RPC_URL}). ${
              rpcError instanceof Error ? rpcError.message : "Check your connection and retry."
            }`,
          );
        }
        if (balance < amount) {
          throw new Error(
            `Insufficient tUSDT balance: you have ${formatUsdtAmount(balance)} tUSDT, ` +
              `this audit costs ${priceLabel} tUSDT on BOT testnet.`,
          );
        }

        const wallet = createWalletClient({
          account: account as Address,
          chain: BOT_CHAIN,
          transport: custom(provider),
        });

        // 4. One-time Permit2 allowance approval (only when below the amount).
        if (allowance < amount) {
          setStage("approve");
          setStatus(`Approving tUSDT for Permit2 (one-time ${formatUsdtAmount(DEFAULT_APPROVAL_BUDGET)} tUSDT budget)...`);
          const approvalHash = await wallet.writeContract({
            address: BOT_USDT_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [BOT_PERMIT2_ADDRESS, DEFAULT_APPROVAL_BUDGET],
          });
          setStatus("Approval submitted - waiting for on-chain confirmation...");
          const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
          if (approvalReceipt.status !== "success") {
            throw new Error("tUSDT approval transaction failed on-chain. Please retry.");
          }
          setStatus("Allowance confirmed");
        }

        // 5. Sign the Permit2 EIP-712 PermitWitnessTransferFrom.
        setStage("sign");
        setStatus("Sign the Permit2 payment in your wallet...");
        const typedData = buildPermitTypedData(accepted);
        const signature = await wallet.signTypedData({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

        // 6. Retry the original request with the PAYMENT-SIGNATURE header.
        setStage("settle");
        setStatus("Signature received - submitting payment for settlement...");
        const authorization = buildPermitAuthorization(typedData.message, account);
        const paymentHeader = buildPaymentSignatureHeader({
          accepted,
          resource: required.resource,
          signature,
          authorization,
        });
        const paid = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "PAYMENT-SIGNATURE": paymentHeader,
          },
          body: JSON.stringify(body),
        });
        const paidBody: unknown = await paid.json().catch(() => null);
        if (!paid.ok) {
          throw new Error(describePaymentError({ status: paid.status, body: paidBody as PaymentFailure["body"] }));
        }
        const data = paidBody as AuditSuccessResponse | null;
        if (!data || !data.results) {
          const settlementHeader = paid.headers.get("PAYMENT-RESPONSE");
          throw new Error(
            settlementHeader
              ? "Payment settled but the audit result was malformed. Check your wallet history and retry."
              : "Payment settled but no audit result was returned. Please retry.",
          );
        }

        setStage("audit");
        setStatus("Payment settled - AI audit complete");
        return data;
      } catch (error) {
        if (isUserRejection(error)) {
          throw new Error("Signature request rejected in your wallet. No payment was made.");
        }
        if (error instanceof Error) throw error;
        throw new Error(describePaymentError({ message: String(error) }));
      } finally {
        setIsPaying(false);
        setStage(null);
      }
    },
    [],
  );

  return { runAudit, isPaying, status, setStatus, stage };
}
