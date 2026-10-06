import "dotenv/config";
import {createPublicClient, createWalletClient, http, parseAbi, recoverTypedDataAddress} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {randomBytes} from "node:crypto";

const KEY = process.env.NEXA_UPSTREAM_PRIVATE_KEY;
if (!KEY) throw new Error("NEXA_UPSTREAM_PRIVATE_KEY missing");
const URL_ = "https://agentdata-api.sander-van-aard.workers.dev/llm/chat";
const b64 = (v) => Buffer.from(JSON.stringify(v, (k, x) => typeof x === "bigint" ? x.toString() : x)).toString("base64url");
const fromB64 = (v) => JSON.parse(Buffer.from(v, "base64url").toString("utf8"));

const account = privateKeyToAccount(KEY.startsWith("0x") ? KEY : `0x${KEY}`);
const chain = {id: 8453, name: "Base", nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18}, rpcUrls: {default: {http: ["https://mainnet.base.org"]}}};
const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const pub = createPublicClient({chain, transport: http("https://mainnet.base.org")});
const bal = await pub.readContract({address: usdc, abi: parseAbi(["function balanceOf(address) view returns (uint256)"]), functionName: "balanceOf", args: [account.address]});
console.log("payer", account.address, "usdc", bal.toString());

const body = {model: "fast", messages: [{role: "user", content: "Reply with the single word: ok"}], max_tokens: 16};
const first = await fetch(URL_, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
if (first.status !== 402) throw new Error(`expected 402 got ${first.status}`);
const req = fromB64(first.headers.get("payment-required"));
const acc = req.accepts[0];
console.log("requires", acc.amount, acc.asset, acc.network, "name", acc.extra.name, acc.extra.version);

const now = Math.floor(Date.now() / 1000);
const authorization = {
  from: account.address,
  to: acc.payTo,
  value: BigInt(acc.amount),
  validAfter: 0n,
  validBefore: BigInt(now + acc.maxTimeoutSeconds),
  nonce: `0x${randomBytes(16).toString("hex")}00000000000000000000000000000000`,
};
const domain = {name: acc.extra.name, version: acc.extra.version, chainId: 8453, verifyingContract: acc.asset};
const types = {TransferWithAuthorization: [
  {name: "from", type: "address"}, {name: "to", type: "address"}, {name: "value", type: "uint256"},
  {name: "validAfter", type: "uint256"}, {name: "validBefore", type: "uint256"}, {name: "nonce", type: "bytes32"},
]};
const signature = await account.signTypedData({domain, types, primaryType: "TransferWithAuthorization", message: authorization});
const recovered = await recoverTypedDataAddress({domain, types, primaryType: "TransferWithAuthorization", message: authorization, signature});
if (recovered.toLowerCase() !== account.address.toLowerCase()) throw new Error("recovery mismatch");

const payload = {x402Version: 2, resource: req.resource, accepted: acc, payload: {authorization, signature}, extensions: {}};
const paid = await fetch(URL_, {method: "POST", headers: {"content-type": "application/json", "payment-signature": b64(payload)}, body: JSON.stringify(body)});
console.log("paid status", paid.status, "payment-response", paid.headers.get("payment-response")?.slice(0, 120));
console.log(JSON.stringify(await paid.json()).slice(0, 400));
