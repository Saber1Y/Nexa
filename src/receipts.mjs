import "dotenv/config";
import {createPublicClient, createWalletClient, http, keccak256, toBytes} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {BOT_CHAIN_ID, BOT_RPC_URL, BOT_RECEIPT_REGISTRY, AUDIT_SERVICE_ID} from "./botConfig.mjs";

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
}];

export function serviceIdBytes32() {
  return keccak256(toBytes(AUDIT_SERVICE_ID));
}

export async function recordReceiptOnChain({paymentId, payer, provider, asset, amount, resultHash}) {
  const key = process.env.NEXA_RECEIPT_SIGNER_PRIVATE_KEY;
  if (!key) return {recorded: false, reason: "NEXA_RECEIPT_SIGNER_PRIVATE_KEY not configured"};
  if (!BOT_RECEIPT_REGISTRY) return {recorded: false, reason: "NEXA_RECEIPT_REGISTRY_ADDRESS not configured"};
  const account = privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);
  const chain = {id: BOT_CHAIN_ID, name: "BOT Chain Bohr Testnet", nativeCurrency: {name: "tBOT", symbol: "tBOT", decimals: 18}, rpcUrls: {default: {http: [BOT_RPC_URL]}}};
  const publicClient = createPublicClient({chain, transport: http(BOT_RPC_URL)});
  const wallet = createWalletClient({account, chain, transport: http(BOT_RPC_URL)});
  const hash = await wallet.writeContract({
    address: BOT_RECEIPT_REGISTRY,
    abi,
    functionName: "recordReceipt",
    args: [paymentId, serviceIdBytes32(), payer, provider, asset, BigInt(amount), resultHash],
  });
  const receipt = await publicClient.waitForTransactionReceipt({hash});
  if (receipt.status !== "success") throw new Error(`receipt tx failed: ${hash}`);
  return {recorded: true, tx: hash, registry: BOT_RECEIPT_REGISTRY, signer: account.address};
}
