import "dotenv/config";
import {createPublicClient, createWalletClient, http, keccak256, toBytes} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {BOT_CHAIN, BOT_CHAIN_ID, BOT_RPC_URL, BOT_RECEIPT_REGISTRY, AUDIT_SERVICE_ID} from "./botConfig.mjs";

const abi = [{
  type: "function",
  name: "recordReceipt",
  stateMutability: "nonpayable",
  inputs: [
    {name: "paymentId", type: "bytes32"},
    {name: "serviceId", type: "bytes32"},
    {name: "payer", type: "address"},
    {name: "provider", type: "address"},
    {name: "asset", type: "address"},
    {name: "amount", type: "uint256"},
    {name: "resultHash", type: "bytes32"},
  ],
  outputs: [],
},
{type: "function", name: "recorded", stateMutability: "view", inputs: [{name: "", type: "bytes32"}], outputs: [{type: "bool"}]},
{type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{type: "address"}]}];

export function serviceIdBytes32(value = AUDIT_SERVICE_ID) {
  return keccak256(toBytes(value));
}

export async function recordReceiptOnChain({paymentId, payer, provider, asset, amount, resultHash, serviceId}) {
  const key = process.env.NEXA_RECEIPT_SIGNER_PRIVATE_KEY;
  if (!key) return {recorded: false, reason: "NEXA_RECEIPT_SIGNER_PRIVATE_KEY not configured"};
  if (!BOT_RECEIPT_REGISTRY) return {recorded: false, reason: "NEXA_RECEIPT_REGISTRY_ADDRESS not configured"};
  const account = privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);
  const chain = BOT_CHAIN;
  const publicClient = createPublicClient({chain, transport: http(BOT_RPC_URL)});
  const wallet = createWalletClient({account, chain, transport: http(BOT_RPC_URL)});
  const hash = await wallet.writeContract({
    address: BOT_RECEIPT_REGISTRY,
    abi,
    functionName: "recordReceipt",
    args: [paymentId, serviceIdBytes32(serviceId || AUDIT_SERVICE_ID), payer, provider, asset, BigInt(amount), resultHash],
  });
  const receipt = await publicClient.waitForTransactionReceipt({hash});
  if (receipt.status !== "success") throw new Error(`receipt tx failed: ${hash}`);
  return {recorded: true, tx: hash, registry: BOT_RECEIPT_REGISTRY, signer: account.address};
}

const defaultRegistryStartBlock = BOT_CHAIN_ID === 677 ? "25875770" : "25883956";
const REGISTRY_START_BLOCK = BigInt(process.env.NEXA_RECEIPT_REGISTRY_START_BLOCK || defaultRegistryStartBlock);

const eventAbi = [{
  type: "event",
  name: "PaymentReceiptRecorded",
  anonymous: false,
  inputs: [
    {name: "paymentId", type: "bytes32", indexed: true},
    {name: "serviceId", type: "bytes32", indexed: true},
    {name: "payer", type: "address", indexed: true},
    {name: "provider", type: "address", indexed: false},
    {name: "asset", type: "address", indexed: false},
    {name: "amount", type: "uint256", indexed: false},
    {name: "resultHash", type: "bytes32", indexed: false},
  ],
}];

export async function getReceiptOnChain(paymentId) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(paymentId)) throw new Error("paymentId must be a 32-byte hex string");
  const publicClient = createPublicClient({chain: BOT_CHAIN, transport: http(BOT_RPC_URL)});
  const recorded = await publicClient.readContract({address: BOT_RECEIPT_REGISTRY, abi, functionName: "recorded", args: [paymentId]});
  const logs = await publicClient.getContractEvents({address: BOT_RECEIPT_REGISTRY, abi: eventAbi, eventName: "PaymentReceiptRecorded", args: {paymentId}, fromBlock: REGISTRY_START_BLOCK, toBlock: "latest"});
  const entry = logs.at(-1);
  return {
    found: Boolean(entry),
    recorded: Boolean(recorded),
    registry: BOT_RECEIPT_REGISTRY,
    paymentId,
    serviceId: entry?.args?.serviceId,
    payer: entry?.args?.payer,
    provider: entry?.args?.provider,
    asset: entry?.args?.asset,
    amount: entry?.args?.amount?.toString(),
    resultHash: entry?.args?.resultHash,
    tx: entry?.transactionHash,
    blockNumber: entry?.blockNumber?.toString(),
    explorerUrl: entry?.transactionHash ? `${process.env.BOT_EXPLORER_URL || "https://scan.bohr.life"}/tx/${entry.transactionHash}` : null,
  };
}
