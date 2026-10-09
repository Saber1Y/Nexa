import "dotenv/config";
import {createPublicClient, createWalletClient, http, parseAbi, keccak256, toBytes} from "viem";
import {generatePrivateKey, privateKeyToAccount} from "viem/accounts";
import {BOT_CHAIN, BOT_CHAIN_ID, BOT_EXPLORER_URL, BOT_GATEWAY_ADDRESS, BOT_RPC_URL, BOT_USDT_ADDRESS} from "../src/botConfig.mjs";
import {verifyGatewayPayment} from "../src/gatewayVerifier.mjs";

if (BOT_CHAIN_ID !== 968) throw new Error(`Refusing test run on chain ${BOT_CHAIN_ID}; set BOT_CHAIN_ID=968`);
if (!BOT_GATEWAY_ADDRESS) throw new Error("Set NEXA_GATEWAY_ADDRESS to the Bohr testnet gateway");
const funderKey = process.env.NEXA_TEST_FUNDER_PRIVATE_KEY;
if (!funderKey) throw new Error("Set NEXA_TEST_FUNDER_PRIVATE_KEY to a Bohr testnet faucet/funder key");

const tokenAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
]);
const gatewayAbi = parseAbi(["function pay(bytes32,bytes32) returns (bytes32)"]);
const chain = BOT_CHAIN;
const client = createPublicClient({chain, transport: http(BOT_RPC_URL)});
if (await client.getChainId() !== 968) throw new Error("RPC is not BOT Chain Bohr testnet");

const funder = privateKeyToAccount(funderKey.startsWith("0x") ? funderKey : `0x${funderKey}`);
const funderWallet = createWalletClient({account: funder, chain, transport: http(BOT_RPC_URL)});
const payer = privateKeyToAccount(generatePrivateKey());
const payerWallet = createWalletClient({account: payer, chain, transport: http(BOT_RPC_URL)});

const nativeFundingHash = await funderWallet.sendTransaction({to: payer.address, value: 10_000_000_000_000_000n});
await client.waitForTransactionReceipt({hash: nativeFundingHash});
const tokenFundingHash = await funderWallet.writeContract({address: BOT_USDT_ADDRESS, abi: tokenAbi, functionName: "transfer", args: [payer.address, 200_000n]});
await client.waitForTransactionReceipt({hash: tokenFundingHash});

const request = {
  jobTitle: "Testnet QA Engineer",
  jobDescription: "Validates payment and audit request flow.",
  mustHaveSkills: "testing, automation",
  resumeText: "QA engineer with experience in test automation, TypeScript, and CI pipelines.",
};
const stringify = (value) => Array.isArray(value)
  ? `[${value.map(stringify).join(",")}]`
  : value && typeof value === "object"
    ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stringify(value[key])}`).join(",")}}`
    : JSON.stringify(value) ?? "null";
const requestHash = keccak256(toBytes(stringify(request)));
const serviceId = keccak256(toBytes("resume-intelligence-v1"));

const approvalHash = await payerWallet.writeContract({address: BOT_USDT_ADDRESS, abi: tokenAbi, functionName: "approve", args: [BOT_GATEWAY_ADDRESS, 100_000n]});
await client.waitForTransactionReceipt({hash: approvalHash});
const paymentHash = await payerWallet.writeContract({address: BOT_GATEWAY_ADDRESS, abi: gatewayAbi, functionName: "pay", args: [serviceId, requestHash]});
const paymentReceipt = await client.waitForTransactionReceipt({hash: paymentHash});
if (paymentReceipt.status !== "success") throw new Error("testnet gateway payment failed");

const verified = await verifyGatewayPayment({txHash: paymentHash, expectedServiceId: "resume-intelligence-v1", expectedAmount: "100000", expectedRequestHash: requestHash});
console.log(JSON.stringify({
  network: "BOT Chain Bohr Testnet (968)",
  payer: payer.address,
  amountAtomic: verified.amount,
  paymentId: verified.paymentId,
  paymentTx: paymentHash,
  payerExplorer: `${BOT_EXPLORER_URL}/address/${payer.address}`,
  paymentExplorer: `${BOT_EXPLORER_URL}/tx/${paymentHash}`,
  gateway: BOT_GATEWAY_ADDRESS,
  fundingTransactions: [nativeFundingHash, tokenFundingHash],
  approvalTx: approvalHash,
  apiMode: process.argv.includes("--api") ? "requested" : "skipped",
}, null, 2));

if (process.argv.includes("--api")) {
  const apiUrl = process.env.NEXA_TEST_API_URL || "http://localhost:3403/api/audit";
  const response = await fetch(apiUrl, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({...request, paymentTx: paymentHash})});
  const payload = await response.json();
  if (!response.ok) throw new Error(`API returned ${response.status}: ${JSON.stringify(payload)}`);
  console.log(JSON.stringify({apiStatus: response.status, result: payload.results, receiptTx: payload.receipt?.tx}, null, 2));
}
