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
  const server = new Horizon.Server(HORIZON_TESTNET);
  const targetWallet = process.argv[2] || "GCMM53NM7FG6S353V7Z7DO7EHBDB7JRC47U4ADHOAJJWJWROFFWESQP6";

  console.log(`Checking ${targetWallet}...`);

  try {
    const targetAccount = await server.loadAccount(targetWallet);
    const hasTrustline = targetAccount.balances.some(
      (bal) => bal.asset_code === USDC_CODE && bal.asset_issuer === USDC_ISSUER
    );

    console.log("Trustline exists:", hasTrustline);
    console.log("Balances:", targetAccount.balances.map(b => `${b.balance} ${b.asset_code || 'XLM'}`));

    if (!hasTrustline) {
       console.log("❌ The target wallet DOES NOT have a trustline for USDC. Cannot send USDC.");
       return;
    }

    console.log(`\n💸 Sending 5 USDC from app wallet to ${targetWallet}...`);
    const sourceAccount = await server.loadAccount(pair.publicKey());
    
    const usdcAsset = new Asset(USDC_CODE, USDC_ISSUER);
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: targetWallet,
          asset: usdcAsset,
          amount: "5.0000000"
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(pair);
    const response = await server.submitTransaction(transaction);
    console.log("✅ Success! Hash:", response.hash);

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data.extras.result_codes, null, 2));
    }
  }
}

main();
