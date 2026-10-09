import "dotenv/config";
import {createPublicClient, createWalletClient, http} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {BOT_CHAIN, BOT_RPC_URL, BOT_USDT_ADDRESS, BOT_SERVICE_REGISTRY, BOT_PAY_TO} from "../src/botConfig.mjs";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactPath = join(__dirname, "..", "out", "NexaGateway.sol", "NexaGateway.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;
const bytecode = artifact.bytecode.object;

const key = process.env.NEXA_DEPLOYER_PRIVATE_KEY || process.env.NEXA_RECEIPT_SIGNER_PRIVATE_KEY || "";
if (!key) throw new Error("Need NEXA_DEPLOYER_PRIVATE_KEY (or NEXA_RECEIPT_SIGNER_PRIVATE_KEY) in .env");
const account = privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);
const client = createPublicClient({chain: BOT_CHAIN, transport: http(BOT_RPC_URL)});
const wallet = createWalletClient({account, chain: BOT_CHAIN, transport: http(BOT_RPC_URL)});
const confirmedChainId = Number(process.env.DEPLOY_CONFIRM_CHAIN_ID || 0);
if (!confirmedChainId) throw new Error("Set DEPLOY_CONFIRM_CHAIN_ID explicitly before deploying");
const actualChainId = await client.getChainId();
if (actualChainId !== confirmedChainId || actualChainId !== BOT_CHAIN.id) {
  throw new Error(`Refusing deployment: configured chain ${BOT_CHAIN.id}, confirmed chain ${confirmedChainId}, RPC chain ${actualChainId}`);
}
if (!BOT_USDT_ADDRESS || !BOT_PAY_TO || !BOT_SERVICE_REGISTRY) throw new Error("USDT, treasury, and service registry addresses are required");

console.log(`Deploying NexaGateway to ${BOT_CHAIN.name} (chain ${actualChainId})`);

const tx = await wallet.deployContract({
  abi,
  bytecode,
  args: [BOT_USDT_ADDRESS, BOT_PAY_TO, BOT_SERVICE_REGISTRY, account.address],
});
const rcpt = await client.waitForTransactionReceipt({hash: tx});
if (rcpt.status !== "success") throw new Error("deploy failed");
console.log(JSON.stringify({deployed: rcpt.contractAddress, tx, block: rcpt.blockNumber.toString()}));
