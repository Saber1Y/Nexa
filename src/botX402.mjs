import {createPublicClient, createWalletClient, encodeFunctionData, http, parseAbi, verifyTypedData} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {
  BOT_CHAIN,
  BOT_CHAIN_ID,
  BOT_EXACT_PERMIT2_PROXY,
  BOT_FACILITATOR_KEY,
  BOT_NETWORK,
  BOT_PAY_TO,
  BOT_PERMIT2_ADDRESS,
  BOT_RPC_URL,
  BOT_USDT_ADDRESS,
  AUDIT_PRICE_ATOMIC,
  AUDIT_SERVICE_ID,
} from "./botConfig.mjs";

export const publicClient = createPublicClient({chain: BOT_CHAIN, transport: http(BOT_RPC_URL)});
const facilitator = privateKeyToAccount(BOT_FACILITATOR_KEY);
export const walletClient = createWalletClient({account: facilitator, chain: BOT_CHAIN, transport: http(BOT_RPC_URL)});

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
]);
const permit2ProxyAbi = [{
  type: "function",
  name: "settle",
  stateMutability: "nonpayable",
  inputs: [
    {name: "permit", type: "tuple", components: [
      {name: "permitted", type: "tuple", components: [
        {name: "token", type: "address"},
        {name: "amount", type: "uint256"},
      ]},
      {name: "nonce", type: "uint256"},
      {name: "deadline", type: "uint256"},
    ]},
    {name: "owner", type: "address"},
    {name: "witness", type: "tuple", components: [
      {name: "to", type: "address"},
      {name: "validAfter", type: "uint256"},
    ]},
    {name: "signature", type: "bytes"},
  ],
  outputs: [],
}];

const permitTypes = {
  TokenPermissions: [
    {name: "token", type: "address"},
    {name: "amount", type: "uint256"},
  ],
  PermitWitnessTransferFrom: [
    {name: "permitted", type: "TokenPermissions"},
    {name: "spender", type: "address"},
    {name: "nonce", type: "uint256"},
    {name: "deadline", type: "uint256"},
    {name: "witness", type: "Witness"},
  ],
  Witness: [
    {name: "to", type: "address"},
    {name: "validAfter", type: "uint256"},
  ],
};

const permitDomain = {name: "Permit2", chainId: BOT_CHAIN_ID, verifyingContract: BOT_PERMIT2_ADDRESS};

export function encodeBase64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function decodeBase64Url(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

export function paymentRequirements(resourceUrl, serviceId = AUDIT_SERVICE_ID, priceAtomic = AUDIT_PRICE_ATOMIC) {
  return {
    scheme: "exact",
    network: BOT_NETWORK,
    amount: priceAtomic,
    asset: BOT_USDT_ADDRESS,
    payTo: BOT_PAY_TO,
    maxTimeoutSeconds: 300,
    extra: {
      name: "USDT",
      version: "1",
      assetTransferMethod: "permit2",
      permit2: BOT_PERMIT2_ADDRESS,
      proxy: BOT_EXACT_PERMIT2_PROXY,
      serviceId,
    },
    resource: {
      url: resourceUrl,
      description: "Nexa AI resume intelligence audit",
      mimeType: "application/json",
    },
  };
}

export function paymentRequired(resourceUrl, error = "PAYMENT-SIGNATURE header is required", serviceId, priceAtomic) {
  const requirements = paymentRequirements(resourceUrl, serviceId, priceAtomic);
  return {
    x402Version: 2,
    error,
    resource: requirements.resource,
    accepts: [requirements],
    extensions: {},
  };
}

export function parsePaymentSignature(header) {
  if (!header) return null;
  return decodeBase64Url(header);
}

export async function verifyPayment(paymentPayload, resourceUrl, serviceId = AUDIT_SERVICE_ID, priceAtomic = AUDIT_PRICE_ATOMIC) {
  const required = paymentRequirements(resourceUrl, serviceId, priceAtomic);
  if (!paymentPayload || paymentPayload.x402Version !== 2) throw new Error("invalid_x402_version");
  const accepted = paymentPayload.accepted;
  if (!accepted || accepted.scheme !== "exact" || accepted.network !== BOT_NETWORK) throw new Error("invalid_payment_requirements");
  for (const field of ["asset", "payTo", "amount"]) {
    if (String(accepted[field]).toLowerCase() !== String(required[field]).toLowerCase()) throw new Error(`payment_${field}_mismatch`);
  }
  if (accepted.extra?.proxy?.toLowerCase() !== BOT_EXACT_PERMIT2_PROXY.toLowerCase()) throw new Error("invalid_settlement_proxy");
  const auth = paymentPayload.payload?.permit2Authorization;
  const signature = paymentPayload.payload?.signature;
  if (!auth || !signature) throw new Error("invalid_payload");
  if (auth.permitted?.token?.toLowerCase() !== BOT_USDT_ADDRESS.toLowerCase()) throw new Error("invalid_token");
  if (String(auth.permitted.amount) !== String(required.amount)) throw new Error("invalid_amount");
  if (auth.spender?.toLowerCase() !== BOT_EXACT_PERMIT2_PROXY.toLowerCase()) throw new Error("invalid_spender");
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (BigInt(auth.deadline) < now) throw new Error("authorization_expired");
  if (BigInt(auth.witness.validAfter) > now) throw new Error("authorization_not_active");
  if (auth.witness.to?.toLowerCase() !== BOT_PAY_TO.toLowerCase()) throw new Error("invalid_recipient");
  const valid = await verifyTypedData({
    address: auth.from,
    domain: permitDomain,
    types: permitTypes,
    primaryType: "PermitWitnessTransferFrom",
    message: {
      permitted: {token: auth.permitted.token, amount: BigInt(auth.permitted.amount)},
      spender: auth.spender,
      nonce: BigInt(auth.nonce),
      deadline: BigInt(auth.deadline),
      witness: {to: auth.witness.to, validAfter: BigInt(auth.witness.validAfter)},
    },
    signature,
  });
  if (!valid) throw new Error("invalid_exact_evm_payload_signature");
  const [balance, allowance] = await Promise.all([
    publicClient.readContract({address: BOT_USDT_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [auth.from]}),
    publicClient.readContract({address: BOT_USDT_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [auth.from, BOT_PERMIT2_ADDRESS]}),
  ]);
  if (balance < BigInt(required.amount)) throw new Error("insufficient_funds");
  if (allowance < BigInt(required.amount)) throw new Error("PERMIT2_ALLOWANCE_REQUIRED");
  return {payer: auth.from, amount: required.amount, auth, signature, paymentPayload};
}

export async function settlePayment(verified) {
  const permit = {
    permitted: {token: verified.auth.permitted.token, amount: BigInt(verified.auth.permitted.amount)},
    nonce: BigInt(verified.auth.nonce),
    deadline: BigInt(verified.auth.deadline),
  };
  const witness = {to: verified.auth.witness.to, validAfter: BigInt(verified.auth.witness.validAfter)};
  const hash = await walletClient.writeContract({
    address: BOT_EXACT_PERMIT2_PROXY,
    abi: permit2ProxyAbi,
    functionName: "settle",
    args: [permit, verified.payer, witness, verified.signature],
  });
  const receipt = await publicClient.waitForTransactionReceipt({hash});
  if (receipt.status !== "success") throw new Error("invalid_transaction_state");
  return {success: true, transaction: hash, network: BOT_NETWORK, payer: verified.payer, amount: verified.amount};
}

export function paymentResponse(value) {
  return encodeBase64Url(value);
}
