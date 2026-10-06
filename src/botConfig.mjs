import "dotenv/config";
import {isAddress} from "viem";

export const BOT_CHAIN_ID = 968;
export const BOT_NETWORK = "eip155:968";
export const BOT_RPC_URL = process.env.BOT_RPC_URL || "https://rpc.bohr.life";
export const BOT_EXPLORER_URL = process.env.BOT_EXPLORER_URL || "https://scan.bohr.life";
export const BOT_USDT_ADDRESS = process.env.BOT_USDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3";
export const BOT_USDT_DECIMALS = 6;
export const BOT_PERMIT2_ADDRESS = process.env.BOT_PERMIT2_ADDRESS || "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const BOT_EXACT_PERMIT2_PROXY = process.env.BOT_EXACT_PERMIT2_PROXY || "0x402085c248EeA27D92E8b30b2C58ed07f9E20001";
export const BOT_PAY_TO = process.env.NEXA_PAY_TO_ADDRESS || "";
export const BOT_SERVICE_REGISTRY = process.env.NEXA_SERVICE_REGISTRY_ADDRESS || "0x6A2C234080Da1329b0418E4d5Dc34b2004D464bF";
export const BOT_RECEIPT_REGISTRY = process.env.NEXA_RECEIPT_REGISTRY_ADDRESS || "0xC37C0a8988BB174f2a9b199b8B8f0Fb51f5c848D";
export const BOT_FACILITATOR_KEY = process.env.NEXA_FACILITATOR_PRIVATE_KEY || "";

export const AUDIT_PRICE_ATOMIC = process.env.NEXA_AUDIT_PRICE_ATOMIC || "100000"; // 0.10 USDT
export const AUDIT_SERVICE_ID = (process.env.NEXA_SERVICE_ID || process.env.NEXA_AUDIT_SERVICE_ID || "resume-intelligence-v1");
export const AUDIT_SERVICE_VERSION = "1";

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
