import "dotenv/config";
import {createPublicClient, http, parseAbi} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {randomBytes} from "node:crypto";

const BASE = (process.env.NEXA_BASE_URL || "http://localhost:3402").replace(/\/$/, "");
const RPC = process.env.BOT_RPC_URL || "https://rpc.bohr.life";
const TOKEN = process.env.BOT_USDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3";
const PERMIT2 = process.env.BOT_PERMIT2_ADDRESS || "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const PROXY = process.env.BOT_EXACT_PERMIT2_PROXY || "0x402085c248EeA27D92E8b30b2C58ed07f9E20001";
const KEY = process.env.NEXA_AGENT_PRIVATE_KEY;
const body = JSON.stringify({jobTitle: "Test Role", jobDescription: "test", mustHaveSkills: "none", resumeText: "test resume for negative-path verification"});
const b64 = (v) => Buffer.from(JSON.stringify(v, (k, x) => (typeof x === "bigint" ? x.toString() : x))).toString("base64url");
const fromB64 = (v) => JSON.parse(Buffer.from(v, "base64url").toString("utf8"));
const permitTypes = {
  TokenPermissions: [{name: "token", type: "address"}, {name: "amount", type: "uint256"}],
  PermitWitnessTransferFrom: [
    {name: "permitted", type: "TokenPermissions"}, {name: "spender", type: "address"},
    {name: "nonce", type: "uint256"}, {name: "deadline", type: "uint256"}, {name: "witness", type: "Witness"},
  ],
  Witness: [{name: "to", type: "address"}, {name: "validAfter", type: "uint256"}],
};
const results = [];
const assert = (name, cond, detail) => { results.push({name, pass: Boolean(cond), detail}); if (!cond) console.error(`FAIL ${name}: ${detail}`); };

const account = privateKeyToAccount(KEY.startsWith("0x") ? KEY : `0x${KEY}`);
const chain = {id: 968, name: "BOT", nativeCurrency: {name: "tBOT", symbol: "tBOT", decimals: 18}, rpcUrls: {default: {http: [RPC]}}};
const pub = createPublicClient({chain, transport: http(RPC)});
const erc20 = parseAbi(["function allowance(address,address) view returns (uint256)"]);

// 1. no payment header -> 402 with requirements
let res = await fetch(`${BASE}/api/audit`, {method: "POST", headers: {"content-type": "application/json"}, body});
const req1 = fromB64(res.headers.get("payment-required"));
assert("unpaid gets 402", res.status === 402 && req1.accepts?.[0]?.network === "eip155:968", `status=${res.status}`);

// 2. tampered amount -> 402 rejection
const accepted = req1.accepts[0];
const allowance = await pub.readContract({address: TOKEN, abi: erc20, functionName: "allowance", args: [account.address, PERMIT2]});
if (allowance < BigInt(accepted.amount)) {
  const {createWalletClient} = await import("viem");
  const wallet = createWalletClient({account, chain, transport: http(RPC)});
  const erc20Approve = parseAbi(["function approve(address,uint256) returns (bool)"]);
  const budget = BigInt(process.env.NEXA_AGENT_APPROVAL_ATOMIC || "10000000");
  const approveHash = await wallet.writeContract({address: TOKEN, abi: erc20Approve, functionName: "approve", args: [PERMIT2, budget]});
  await pub.waitForTransactionReceipt({hash: approveHash});
  console.log(`approved ${budget} for Permit2: ${approveHash}`);
}
const now = BigInt(Math.floor(Date.now() / 1000));
const auth = {
  permitted: {token: TOKEN, amount: BigInt(accepted.amount)},
  spender: PROXY,
  nonce: BigInt(`0x${randomBytes(32).toString("hex")}`),
  deadline: now + 300n,
  witness: {to: accepted.payTo, validAfter: now - 5n},
};
const sig = await account.signTypedData({domain: {name: "Permit2", chainId: 968, verifyingContract: PERMIT2}, types: permitTypes, primaryType: "PermitWitnessTransferFrom", message: auth});
const payload = {x402Version: 2, resource: req1.resource, accepted: {...accepted, amount: "1"}, payload: {signature: sig, permit2Authorization: {...auth, from: account.address}}, extensions: {}};
res = await fetch(`${BASE}/api/audit`, {method: "POST", headers: {"content-type": "application/json", "payment-signature": b64(payload)}, body});
const req2 = res.status === 402 ? fromB64(res.headers.get("payment-required")) : await res.json().catch(() => ({}));
assert("tampered amount rejected", res.status === 402 && /amount/.test(req2.error || ""), `status=${res.status} error=${req2.error}`);

// 3. valid payment -> 200, then replay -> 409 (in-memory) / 402 (nonce consumed)
const good = {x402Version: 2, resource: req1.resource, accepted, payload: {signature: sig, permit2Authorization: {...auth, from: account.address}}, extensions: {}};
res = await fetch(`${BASE}/api/audit`, {method: "POST", headers: {"content-type": "application/json", "payment-signature": b64(good)}, body});
const paid = res.status === 402 ? fromB64(res.headers.get("payment-required")) : await res.json().catch(() => ({}));
assert("valid payment executes", res.status === 200 && paid.success === true, `status=${res.status} error=${paid.error} detail=${paid.detail}`);
if (res.status === 200) {
  const settle = fromB64(res.headers.get("payment-response"));
  assert("settlement has tx", Boolean(settle.transaction), JSON.stringify(settle));
  res = await fetch(`${BASE}/api/audit`, {method: "POST", headers: {"content-type": "application/json", "payment-signature": b64(good)}, body});
  const dup = await res.json().catch(() => ({}));
  assert("replay rejected", res.status === 409 || res.status === 402, `status=${res.status} error=${dup.error}`);
  const {writeFileSync} = await import("node:fs");
  writeFileSync("/tmp/custos/nexa-last-payload.json", JSON.stringify({header: b64(good), body}));
}

console.log(JSON.stringify(results, null, 1));
process.exit(results.every((r) => r.pass) ? 0 : 1);
