import "dotenv/config";
import { Keypair, Horizon, Asset, TransactionBuilder, Operation, Networks } from "@stellar/stellar-sdk";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const USDC_CODE = "USDC";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

async function main() {
  const secret = process.env.STELLAR_SECRET_KEY;
  if (!secret) {
    console.error("❌  STELLAR_SECRET_KEY not found in .env");
    process.exit(1);
  }

  const pair = Keypair.fromSecret(secret);
  const publicKey = pair.publicKey();
  const server = new Horizon.Server(HORIZON_TESTNET);

  console.log("\n🏦  Nexa — USDC Trustline Setup");
  console.log("─".repeat(48));
  console.log(`  Account : ${publicKey}`);

  try {
    const account = await server.loadAccount(publicKey);
    const hasTrustline = account.balances.some(
      (bal) => bal.asset_code === USDC_CODE && bal.asset_issuer === USDC_ISSUER
    );

    if (hasTrustline) {
      console.log("  ✅ Trustline already exists. Nothing to do.\n");
      return;
    }

    console.log(`  ➕  Adding trustline for ${USDC_CODE}:${USDC_ISSUER}...`);

    const usdcAsset = new Asset(USDC_CODE, USDC_ISSUER);
    const transaction = new TransactionBuilder(account, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.changeTrust({
          asset: usdcAsset,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(pair);
    const response = await server.submitTransaction(transaction);

    console.log("  ✅ Trustline established successfully!");
    console.log(`  🔗 Transaction Hash: ${response.hash}\n`);
  } catch (error) {
    console.error("  ❌ Error:", error.message);
    if (error.response?.data) {
      console.error("     Details:", JSON.stringify(error.response.data.extras.result_codes, null, 2));
    }
    process.exit(1);
  }
}

main();
