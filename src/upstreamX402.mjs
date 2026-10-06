import "dotenv/config";
import {createPublicClient, createWalletClient, http, parseAbi, recoverTypedDataAddress} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {randomBytes} from "node:crypto";

const UPSTREAM_URL = process.env.NEXA_UPSTREAM_LLM_URL || "https://agentdata-api.sander-van-aard.workers.dev/llm/chat";
const KEY = process.env.NEXA_UPSTREAM_PRIVATE_KEY || "";
const BASE_RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const MAX_ATTEMPTS = 3;

const chain = {id: 8453, name: "Base", nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18}, rpcUrls: {default: {http: [BASE_RPC]}}};
const b64 = (v) => Buffer.from(JSON.stringify(v, (k, x) => (typeof x === "bigint" ? x.toString() : x))).toString("base64url");
const fromB64 = (v) => JSON.parse(Buffer.from(v, "base64url").toString("utf8"));
const transferTypes = {
  TransferWithAuthorization: [
    {name: "from", type: "address"},
    {name: "to", type: "address"},
    {name: "value", type: "uint256"},
    {name: "validAfter", type: "uint256"},
    {name: "validBefore", type: "uint256"},
    {name: "nonce", type: "bytes32"},
  ],
};

export function upstreamConfigured() {
  return Boolean(KEY && /^0x[0-9a-fA-F]{64}$/.test(KEY));
}

export async function paidLlmChat(messages, {model = "fast", maxTokens = 700} = {}) {
  if (!upstreamConfigured()) throw new Error("NEXA_UPSTREAM_PRIVATE_KEY is not configured");
  const account = privateKeyToAccount(KEY);
  const body = JSON.stringify({model, messages, max_tokens: maxTokens});

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const first = await fetch(UPSTREAM_URL, {method: "POST", headers: {"content-type": "application/json"}, body});
    if (first.status === 503) {
      lastError = new Error(`upstream_unavailable:${attempt}`);
      await new Promise((r) => setTimeout(r, 800 * attempt));
      continue;
    }
    if (first.status !== 402) throw new Error(`upstream_unexpected_status:${first.status}:${await first.text()}`);

    const required = fromB64(first.headers.get("payment-required"));
    const accepted = required.accepts.find((x) => x.network === "eip155:8453");
    if (!accepted) throw new Error("upstream_no_base_usdc_requirement");
    const now = Math.floor(Date.now() / 1000);
    const authorization = {
      from: account.address,
      to: accepted.payTo,
      value: BigInt(accepted.amount),
      validAfter: 0n,
      validBefore: BigInt(now + accepted.maxTimeoutSeconds),
      nonce: `0x${randomBytes(32).toString("hex")}`,
    };
    const domain = {name: accepted.extra.name, version: accepted.extra.version, chainId: 8453, verifyingContract: accepted.asset};
    const signature = await account.signTypedData({domain, types: transferTypes, primaryType: "TransferWithAuthorization", message: authorization});
    const recovered = await recoverTypedDataAddress({domain, types: transferTypes, primaryType: "TransferWithAuthorization", message: authorization, signature});
    if (recovered.toLowerCase() !== account.address.toLowerCase()) throw new Error("upstream_signature_recovery_failed");

    const payload = {x402Version: 2, resource: required.resource, accepted, payload: {authorization, signature}, extensions: {}};
    const paid = await fetch(UPSTREAM_URL, {method: "POST", headers: {"content-type": "application/json", "payment-signature": b64(payload)}, body});
    const paymentResponse = paid.headers.get("payment-response") ? fromB64(paid.headers.get("payment-response")) : null;
    const json = await paid.json();
    if (!paid.ok) {
      if (paid.status === 503) {
        lastError = new Error(`upstream_unavailable:${attempt}`);
        continue;
      }
      throw new Error(`upstream_error:${paid.status}:${json?.error || "unknown"}`);
    }
    return {result: json, paymentResponse, upstreamAmount: accepted.amount, upstreamAsset: accepted.asset};
  }
  throw lastError || new Error("upstream_failed");
}
