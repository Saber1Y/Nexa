import "dotenv/config";
import {createPublicClient, http, keccak256, toBytes} from "viem";
import {BOT_CHAIN, BOT_RPC_URL} from "./botConfig.mjs";

const gatewayAbi = [
  {
    type: "event",
    name: "ServicePaid",
    anonymous: false,
    inputs: [
      {name: "paymentId", type: "bytes32", indexed: true},
      {name: "serviceId", type: "bytes32", indexed: true},
      {name: "payer", type: "address", indexed: true},
      {name: "amount", type: "uint256", indexed: false},
      {name: "requestHash", type: "bytes32", indexed: false},
    ],
  },
  {type: "function", name: "getPaymentId", stateMutability: "pure", inputs: [
    {name: "payer", type: "address"},
    {name: "serviceId", type: "bytes32"},
    {name: "requestHash", type: "bytes32"},
    {name: "n", type: "uint256"},
  ], outputs: [{type: "bytes32"}]},
  {type: "function", name: "paid", stateMutability: "view", inputs: [{name: "paymentId", type: "bytes32"}], outputs: [{type: "bool"}]},
];

export function serviceIdBytes32(value) {
  return keccak256(toBytes(value));
}

export async function verifyGatewayPayment({gateway, txHash, expectedServiceId, expectedAmount, expectedPayer, requestHash, nonce}) {
  const publicClient = createPublicClient({chain: BOT_CHAIN, transport: http(BOT_RPC_URL)});
  const receipt = await publicClient.getTransactionReceipt({hash: txHash});
  if (receipt.status !== "success") throw new Error("transaction not successful");
  const logs = await publicClient.getContractEvents({
    address: gateway,
    abi: gatewayAbi,
    eventName: "ServicePaid",
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });
  const match = logs.find((l) => l.transactionHash.toLowerCase() === txHash.toLowerCase());
  if (!match) throw new Error("ServicePaid event not found in tx");
  if (expectedPayer && match.args.payer.toLowerCase() !== expectedPayer.toLowerCase()) throw new Error("payer mismatch");
  if (expectedServiceId) {
    const sid = typeof expectedServiceId === "string" && expectedServiceId.startsWith("0x") ? expectedServiceId : serviceIdBytes32(expectedServiceId);
    if (match.args.serviceId !== sid) throw new Error("serviceId mismatch");
  }
  if (expectedAmount && BigInt(match.args.amount) !== BigInt(expectedAmount)) throw new Error("amount mismatch");
  const pid = match.args.paymentId;
  const isPaid = await publicClient.readContract({address: gateway, abi: gatewayAbi, functionName: "paid", args: [pid]});
  if (!isPaid) throw new Error("payment not marked paid");
  return {ok: true, paymentId: pid, payer: match.args.payer, serviceId: match.args.serviceId, amount: match.args.amount.toString(), tx: txHash, block: receipt.blockNumber.toString()};
}
