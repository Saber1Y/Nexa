import "dotenv/config";
import {createPublicClient, createWalletClient, http, parseAbi, verifyTypedData} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {randomBytes} from "node:crypto";

const RPC = process.env.BOT_RPC_URL || "https://rpc.bohr.life";
const CHAIN_ID = 968;
const NETWORK = "eip155:968";
const TOKEN = process.env.BOT_USDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3";
const PERMIT2 = process.env.BOT_PERMIT2_ADDRESS || "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const PROXY = process.env.BOT_EXACT_PERMIT2_PROXY || "0x402085c248EeA27D92E8b30b2C58ed07f9E20001";
const BASE = (process.env.NEXA_BASE_URL || "http://localhost:3402").replace(/\/$/, "");
const AMOUNT = process.env.NEXA_AUDIT_PRICE_ATOMIC || "100000";
const PRIVATE_KEY = process.env.NEXA_AGENT_PRIVATE_KEY;
const chain = {id: CHAIN_ID, name: "BOT Chain Bohr Testnet", nativeCurrency: {name: "tBOT", symbol: "tBOT", decimals: 18}, rpcUrls: {default: {http: [RPC]}}};

if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) throw new Error("NEXA_AGENT_PRIVATE_KEY must be set to a 32-byte EVM key");

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({chain, transport: http(RPC)});
const wallet = createWalletClient({account, chain, transport: http(RPC)});
const erc20Abi = parseAbi(["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"]);
const permitTypes = {
  TokenPermissions: [{name: "token", type: "address"}, {name: "amount", type: "uint256"}],
  PermitWitnessTransferFrom: [
    {name: "permitted", type: "TokenPermissions"}, {name: "spender", type: "address"},
    {name: "nonce", type: "uint256"}, {name: "deadline", type: "uint256"}, {name: "witness", type: "Witness"},
  ],
  Witness: [{name: "to", type: "address"}, {name: "validAfter", type: "uint256"}],
};
const domain = {name: "Permit2", chainId: CHAIN_ID, verifyingContract: PERMIT2};
const b64 = (v) => Buffer.from(JSON.stringify(v, (k, x) => (typeof x === "bigint" ? x.toString() : x))).toString("base64url");
const fromB64 = (v) => JSON.parse(Buffer.from(v, "base64url").toString("utf8"));

async function main() {
  console.log("NEXA AGENT\n──────────");
  console.log(`Agent: ${account.address}`);
  console.log(`Service: Resume Intelligence`);
  console.log(`Price: ${(Number(AMOUNT) / 1e6).toFixed(6)} tUSDT`);
  console.log(`Network: ${NETWORK}`);

  const allowance = await publicClient.readContract({address: TOKEN, abi: erc20Abi, functionName: "allowance", args: [account.address, PERMIT2]});
  const budget = BigInt(process.env.NEXA_AGENT_APPROVAL_ATOMIC || "10000000");
  if (allowance < budget) {
    console.log(`Permit2 approval: submitting token approval for budget ${budget}...`);
    const hash = await wallet.writeContract({address: TOKEN, abi: erc20Abi, functionName: "approve", args: [PERMIT2, budget]});
    await publicClient.waitForTransactionReceipt({hash});
    console.log(`Approval: ${hash}`);
  } else console.log("Permit2 approval: already sufficient");

  const body = {jobTitle: "BOT Chain Engineer", jobDescription: "Build reliable EVM payment infrastructure", mustHaveSkills: "viem, EVM, x402", resumeText: "Five years building payment systems and machine-native APIs."};
  const first = await fetch(`${BASE}/api/audit`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
  if (first.status !== 402) throw new Error(`Expected 402, got ${first.status}: ${await first.text()}`);
  console.log("Request: 402 Payment Required");
  const required = fromB64(first.headers.get("PAYMENT-REQUIRED"));
  const accepted = required.accepts.find((x) => x.network === NETWORK && x.asset.toLowerCase() === TOKEN.toLowerCase());
  if (!accepted) throw new Error("No BOT tUSDT payment requirement returned");

  const now = BigInt(Math.floor(Date.now() / 1000));
  const auth = {
    permitted: {token: TOKEN, amount: BigInt(accepted.amount)},
    spender: PROXY,
    nonce: BigInt(`0x${randomBytes(32).toString("hex")}`),
    deadline: now + BigInt(accepted.maxTimeoutSeconds),
    witness: {to: accepted.payTo, validAfter: now - 5n},
  };
  const signature = await account.signTypedData({domain, types: permitTypes, primaryType: "PermitWitnessTransferFrom", message: auth});
  const payload = {x402Version: 2, resource: required.resource, accepted, payload: {signature, permit2Authorization: {...auth, from: account.address}}, extensions: {}};
  console.log("Payment: authorization signed");
  const paid = await fetch(`${BASE}/api/audit`, {method: "POST", headers: {"content-type": "application/json", "PAYMENT-SIGNATURE": b64(payload)}, body: JSON.stringify(body)});
  const paymentResponse = paid.headers.get("PAYMENT-RESPONSE");
  if (paymentResponse) console.log("Settlement:", fromB64(paymentResponse));
  const result = await paid.json();
  console.log(`HTTP result: ${paid.status}`);
  if (!paid.ok) throw new Error(JSON.stringify(result));
  console.log("Result:", JSON.stringify(result.results));
  console.log("Receipt:", JSON.stringify(result.receipt));
}

main().catch((error) => {
  console.error("NEXA AGENT FAILED:", error.message);
  process.exitCode = 1;
});
