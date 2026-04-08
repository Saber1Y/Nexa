/**
 * generate-wallet.mjs
 * ---
 * One-time script: Generates a new Stellar Testnet keypair,
 * funds it via Friendbot, and writes the keys to .env
 */

import { Keypair } from "@stellar/stellar-sdk";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

async function main() {
  console.log("\n🔑  Generating a new Stellar Testnet keypair...\n");

  const pair = Keypair.random();
  const publicKey = pair.publicKey();
  const secretKey = pair.secret();

  console.log("  Public Key :", publicKey);
  console.log("  Secret Key :", secretKey);

  // ── Fund via Friendbot ──────────────────────────────────
  console.log("\n💸  Requesting Testnet XLM from Friendbot...");
  try {
    const res = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err, null, 2));
    }
    console.log("  ✅ Account funded successfully!\n");
  } catch (error) {
    console.error("  ❌ Friendbot error:", error.message);
    console.error("  (You can manually fund at https://laboratory.stellar.org/#account-creator?network=test)\n");
  }

  // ── Write to .env ───────────────────────────────────────
  const envBlock = [
    "# ─── Stellar Testnet Collection Account ───",
    `STELLAR_SECRET_KEY=${secretKey}`,
    `STELLAR_PUBLIC_KEY=${publicKey}`,
    "",
    "# ─── GenLayer ───",
    "GENLAYER_RPC_URL=https://studio.genlayer.com/api",
    "GENLAYER_CONTRACT_ADDRESS=0x9CE0d2626753e4C7729C70feeB41eAaB8Ecc189b",
    "",
    "# ─── Server ───",
    "PORT=3402",
    "",
  ].join("\n");

  if (existsSync(envPath)) {
    const existing = readFileSync(envPath, "utf-8");
    if (existing.includes("STELLAR_SECRET_KEY=S")) {
      console.log("  ⚠️  .env already contains a Stellar key. Skipping write.");
      console.log("     Delete .env first if you want to regenerate.\n");
      return;
    }
  }

  writeFileSync(envPath, envBlock, "utf-8");
  console.log(`  📁 Keys saved to ${envPath}`);
  console.log("  🔒 NEVER commit .env to version control!\n");
}

main().catch(console.error);
