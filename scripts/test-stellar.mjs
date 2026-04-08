/**
 * test-stellar.mjs
 * ---
 * "Hello World" smoke-test for the Stellar Testnet.
 * Loads the collection account from .env and prints its balances.
 */

import "dotenv/config";
import { Keypair, Horizon } from "@stellar/stellar-sdk";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";

async function main() {
  const secret = process.env.STELLAR_SECRET_KEY;
  if (!secret) {
    console.error("❌  STELLAR_SECRET_KEY not found in .env");
    console.error("   Run:  npm run generate:wallet\n");
    process.exit(1);
  }

  const pair = Keypair.fromSecret(secret);
  const publicKey = pair.publicKey();

  console.log("\n🌐  Nexa — Stellar Testnet Connection Check");
  console.log("─".repeat(48));
  console.log(`  Account : ${publicKey}`);
  console.log(`  Network : Testnet (Horizon)`);
  console.log(`  Server  : ${HORIZON_TESTNET}\n`);

  const server = new Horizon.Server(HORIZON_TESTNET);

  try {
    const account = await server.loadAccount(publicKey);

    console.log("💰  Balances:");
    for (const bal of account.balances) {
      const asset =
        bal.asset_type === "native"
          ? "XLM (native)"
          : `${bal.asset_code} (${bal.asset_issuer.slice(0, 8)}…)`;
      console.log(`     ${asset.padEnd(28)} ${bal.balance}`);
    }

    console.log("\n✅  Stellar connection verified! Nexa is ready.\n");
  } catch (error) {
    if (error?.response?.status === 404) {
      console.error("❌  Account not found on chain.");
      console.error("   Run:  npm run generate:wallet  (to fund via Friendbot)\n");
    } else {
      console.error("❌  Horizon error:", error.message);
    }
    process.exit(1);
  }
}

main();
