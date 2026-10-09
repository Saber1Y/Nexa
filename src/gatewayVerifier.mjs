import "dotenv/config";
import {createPublicClient, decodeEventLog, decodeFunctionData, http, keccak256, toBytes} from "viem";
import {BOT_CHAIN, BOT_GATEWAY_ADDRESS, BOT_RPC_URL} from "./botConfig.mjs";

const gatewayAbi = [
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [{name: "serviceId", type: "bytes32"}, {name: "requestHash", type: "bytes32"}],
    outputs: [{name: "paymentId", type: "bytes32"}],
  },
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
  {type: "function", name: "paid", stateMutability: "view", inputs: [{name: "paymentId", type: "bytes32"}], outputs: [{type: "bool"}]},
];

export function serviceIdBytes32(value) {
  return keccak256(toBytes(value));
}

export async function verifyGatewayPayment({
  txHash,
  expectedServiceId,
  expectedAmount,
  expectedRequestHash,
  gateway = BOT_GATEWAY_ADDRESS,
}) {
  if (!gateway) throw new Error("NEXA_GATEWAY_ADDRESS is not configured");
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash || "")) throw new Error("paymentTx must be a transaction hash");

  const client = createPublicClient({chain: BOT_CHAIN, transport: http(BOT_RPC_URL)});
  const [receipt, tx] = await Promise.all([
    client.getTransactionReceipt({hash: txHash}),
    client.getTransaction({hash: txHash}),
  ]);
  if (receipt.status !== "success") throw new Error("payment transaction was not successful");
  if (tx.to?.toLowerCase() !== gateway.toLowerCase()) throw new Error("transaction was not sent to the Nexa gateway");

  const call = decodeFunctionData({abi: gatewayAbi, data: tx.input});
  if (call.functionName !== "pay") throw new Error("transaction did not call gateway.pay");
  const [callServiceId, callRequestHash] = call.args;
  const expectedSid = expectedServiceId.startsWith("0x") ? expectedServiceId : serviceIdBytes32(expectedServiceId);
  if (callServiceId.toLowerCase() !== expectedSid.toLowerCase()) throw new Error("serviceId mismatch");
  if (callRequestHash.toLowerCase() !== expectedRequestHash.toLowerCase()) throw new Error("request does not match the paid request");

  const eventLogs = receipt.logs.filter((log) => log.address.toLowerCase() === gateway.toLowerCase());
  const decoded = eventLogs.flatMap((log) => {
    try {
      const event = decodeEventLog({abi: gatewayAbi, data: log.data, topics: log.topics});
      return event.eventName === "ServicePaid" ? [event.args] : [];
    } catch {
      return [];
    }
  });
  if (decoded.length !== 1) throw new Error("expected exactly one ServicePaid event in transaction");
  const event = decoded[0];

  if (tx.from.toLowerCase() !== event.payer.toLowerCase()) throw new Error("transaction sender does not match event payer");
  if (event.serviceId.toLowerCase() !== expectedSid.toLowerCase()) throw new Error("event serviceId mismatch");
  if (event.requestHash.toLowerCase() !== expectedRequestHash.toLowerCase()) throw new Error("event requestHash mismatch");
  if (BigInt(event.amount) !== BigInt(expectedAmount)) throw new Error("payment amount mismatch");
  const isPaid = await client.readContract({address: gateway, abi: gatewayAbi, functionName: "paid", args: [event.paymentId]});
  if (!isPaid) throw new Error("payment is not marked paid by the gateway");

  return {
    ok: true,
    paymentId: event.paymentId,
    payer: event.payer,
    serviceId: event.serviceId,
    amount: event.amount.toString(),
    requestHash: event.requestHash,
    tx: txHash,
    block: receipt.blockNumber.toString(),
  };
}
