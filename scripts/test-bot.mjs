import {createPublicClient, createWalletClient, http, parseAbi} from "viem";
import {privateKeyToAccount} from "viem/accounts";

const RPC = process.env.BOT_RPC_URL || "https://rpc.bohr.life";
const TOKEN = process.env.BOT_USDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3";
const chain = {id: 968, name: "BOT Chain Bohr Testnet", nativeCurrency: {name: "tBOT", symbol: "tBOT", decimals: 18}, rpcUrls: {default: {http: [RPC]}}};
const abi = parseAbi(["function name() view returns (string)", "function symbol() view returns (string)", "function decimals() view returns (uint8)", "function totalSupply() view returns (uint256)", "function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"]);

const client = createPublicClient({chain, transport: http(RPC)});
const chainId = await client.getChainId();
if (chainId !== 968) throw new Error(`Wrong BOT chain: ${chainId}`);
const [name, symbol, decimals, supply, code] = await Promise.all([
  client.readContract({address: TOKEN, abi, functionName: "name"}),
  client.readContract({address: TOKEN, abi, functionName: "symbol"}),
  client.readContract({address: TOKEN, abi, functionName: "decimals"}),
  client.readContract({address: TOKEN, abi, functionName: "totalSupply"}),
  client.getCode({address: TOKEN}),
]);
if (!code || code === "0x") throw new Error("BOT tUSDT has no deployed code");
console.log({chainId, rpc: RPC, token: TOKEN, name, symbol, decimals: Number(decimals), totalSupply: supply.toString()});

// A real transfer is deliberately opt-in so running the compatibility check cannot spend funds.
if (process.env.BOT_TRANSFER_PRIVATE_KEY && process.env.BOT_TRANSFER_TO) {
  const account = privateKeyToAccount(process.env.BOT_TRANSFER_PRIVATE_KEY);
  const wallet = createWalletClient({account, chain, transport: http(RPC)});
  const amount = BigInt(process.env.BOT_TRANSFER_AMOUNT || "1");
  const hash = await wallet.writeContract({address: TOKEN, abi, functionName: "transfer", args: [process.env.BOT_TRANSFER_TO, amount]});
  const receipt = await client.waitForTransactionReceipt({hash});
  if (receipt.status !== "success") throw new Error(`BOT tUSDT transfer failed: ${hash}`);
  console.log({transfer: hash, amount: amount.toString(), to: process.env.BOT_TRANSFER_TO});
}
