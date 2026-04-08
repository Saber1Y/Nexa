import "dotenv/config";
import { Horizon, Keypair, Asset, TransactionBuilder, Operation, Networks } from "@stellar/stellar-sdk";

const AGENT_SECRET = "SCB4Y7YWI4OEFKJKY4VVJ7VSPCMKBBDHQBZKNOIE36ZLSTH3HCTVSAX7";
const AGENT_PUBLIC = "GAO4BLJWNJ4S4UVIBQK4CMH65FA247C436DVK7USNEA4LUIV2LVRTZJQ";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

async function main() {
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const bridgePair = Keypair.fromSecret(process.env.STELLAR_SECRET_KEY);
  const agentPair = Keypair.fromSecret(AGENT_SECRET);

  console.log(`\n🏗️  Setting up Demo Customer Agent...`);
  console.log(`   Address: ${AGENT_PUBLIC}`);

  // 1. Fund with XLM via Friendbot
  console.log("   - Funding with XLM via Friendbot...");
  try {
    await server.friendbot(AGENT_PUBLIC).call();
  } catch (e) {
    console.log("   - Account already funded or Friendbot busy.");
  }

  // 2. Establish USDC Trustline for Agent
  console.log("   - Establishing USDC Trustline for Agent...");
  const agentAccount = await server.loadAccount(AGENT_PUBLIC);
  const trustTx = new TransactionBuilder(agentAccount, {
    fee: "10000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: new Asset("USDC", USDC_ISSUER),
      })
    )
    .setTimeout(30)
    .build();

  trustTx.sign(agentPair);
  await server.submitTransaction(trustTx);

  // 3. Send 5 USDC from Bridge to Agent
  console.log("   - Sending 5.00 USDC from Bridge to Agent...");
  const bridgeAccount = await server.loadAccount(bridgePair.publicKey());
  const sendTx = new TransactionBuilder(bridgeAccount, {
    fee: "10000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: AGENT_PUBLIC,
        asset: new Asset("USDC", USDC_ISSUER),
        amount: "5.00",
      })
    )
    .setTimeout(30)
    .build();

  sendTx.sign(bridgePair);
  await server.submitTransaction(sendTx);

  console.log("\n✅ Demo Agent is ready with 5.00 USDC!");
}

main().catch(console.error);
