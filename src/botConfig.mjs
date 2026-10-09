import "dotenv/config";
import {isAddress} from "viem";

export const BOT_CHAIN_ID = 677;
export const BOT_NETWORK = `eip155:${BOT_CHAIN_ID}`;
export const BOT_CHAIN_NAME = BOT_CHAIN_ID === 968 ? "BOT Chain Bohr Testnet" : BOT_CHAIN_ID === 677 ? "BOT Chain Mainnet" : `BOT Chain (${BOT_CHAIN_ID})`;
export const BOT_NATIVE_CURRENCY = BOT_CHAIN_ID === 968
  ? {name: "tBOT", symbol: "tBOT", decimals: 18}
  : {name: "BOT", symbol: "BOT", decimals: 18};
export const BOT_RPC_URL = process.env.BOT_RPC_URL || "https://rpc.botchain.ai";
export const BOT_EXPLORER_URL = process.env.BOT_EXPLORER_URL || "https://scan.botchain.ai";
export const BOT_CHAIN = {id: BOT_CHAIN_ID, name: BOT_CHAIN_NAME, nativeCurrency: BOT_NATIVE_CURRENCY, rpcUrls: {default: {http: [BOT_RPC_URL]}}};
export const BOT_USDT_ADDRESS = process.env.BOT_USDT_ADDRESS || "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C";
export const BOT_USDT_DECIMALS = 6;
export const BOT_PERMIT2_ADDRESS = process.env.BOT_PERMIT2_ADDRESS || "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const BOT_EXACT_PERMIT2_PROXY = process.env.BOT_EXACT_PERMIT2_PROXY || "0x402085c248EeA27D92E8b30b2C58ed07f9E20001";
export const BOT_PAY_TO = process.env.NEXA_PAY_TO_ADDRESS || "";
export const BOT_SERVICE_REGISTRY = process.env.NEXA_SERVICE_REGISTRY_ADDRESS || "0x4d5845487a11491575aFE5E63554E45D3b553f51";
export const BOT_RECEIPT_REGISTRY = process.env.NEXA_RECEIPT_REGISTRY_ADDRESS || "0x4a29F92A5Bf3F1e242a8bcdc5F7009e67395c5B1";
export const BOT_FACILITATOR_KEY = process.env.NEXA_FACILITATOR_PRIVATE_KEY || "";

export const AUDIT_PRICE_ATOMIC = process.env.NEXA_AUDIT_PRICE_ATOMIC || "100000"; // 0.10 USDT
export const AUDIT_SERVICE_ID = (process.env.NEXA_SERVICE_ID || process.env.NEXA_AUDIT_SERVICE_ID || "resume-intelligence-v1");
export const AUDIT_SERVICE_VERSION = "1";
export const MATCH_PRICE_ATOMIC = process.env.NEXA_MATCH_PRICE_ATOMIC || "50000"; // 0.05 USDT
export const SKILLS_PRICE_ATOMIC = process.env.NEXA_SKILLS_PRICE_ATOMIC || "25000"; // 0.025 USDT
export const MATCH_SERVICE_ID = "jd-resume-match-v1";
export const SKILLS_SERVICE_ID = "skills-extraction-v1";


export function validateBotConfig() {
  const required = [
    ["NEXA_PAY_TO_ADDRESS", BOT_PAY_TO],
    ["NEXA_FACILITATOR_PRIVATE_KEY", BOT_FACILITATOR_KEY],
  ];
  for (const [name, value] of required) {
    if (!value) throw new Error(`${name} is required for BOT settlement`);
  }
  for (const [name, value] of [["BOT_USDT_ADDRESS", BOT_USDT_ADDRESS], ["BOT_PAY_TO_ADDRESS", BOT_PAY_TO], ["BOT_PERMIT2_ADDRESS", BOT_PERMIT2_ADDRESS], ["BOT_EXACT_PERMIT2_PROXY", BOT_EXACT_PERMIT2_PROXY]]) {
    if (!isAddress(value)) throw new Error(`${name} must be an EVM address`);
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(BOT_FACILITATOR_KEY)) {
    throw new Error("NEXA_FACILITATOR_PRIVATE_KEY must be a 32-byte hex key");
  }
}

export const explorerTx = (hash) => `${BOT_EXPLORER_URL.replace(/\/$/, "")}/tx/${hash}`;
export const BOT_GATEWAY_ADDRESS = process.env.NEXA_GATEWAY_ADDRESS || "";
