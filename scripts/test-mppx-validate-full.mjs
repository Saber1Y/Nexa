import "dotenv/config";
import { Mppx, stellar } from "@stellar/mpp/charge/server";
import { Horizon, TransactionBuilder, Networks, Asset, Operation, Memo, Keypair } from "@stellar/stellar-sdk";

const mppx = Mppx.create({
  secretKey: process.env.STELLAR_SECRET_KEY,
  realm: "Nexa Bridge",
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_PUBLIC_KEY,
      currency: "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      network: "stellar:testnet",
    }),
  ],
});

async function main() {
  console.log("Mocking a 402 challenge...");
  const webReq = {
    url: "http://localhost:3402/api/audit",
    method: "POST",
    headers: { get: () => null }
  };
  
  const result1 = await mppx.charge({amount: "1", description: "test"})(webReq);
  const wwwAuth = result1.challenge.headers.get("www-authenticate");
  
  const idMatch = wwwAuth.match(/id="([^"]+)"/);
  const reqMatch = wwwAuth.match(/request="([^"]+)"/);
  const paymentId = idMatch[1];
  
  let b64 = reqMatch[1].replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const reqJson = JSON.parse(Buffer.from(b64, 'base64').toString());

  console.log("Building client TX...");
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const testPair = Keypair.random();
  await fetch(`https://friendbot.stellar.org?addr=${testPair.publicKey()}`); // fund
  const account = await server.loadAccount(testPair.publicKey());
  
  const amountToPay = (Number(reqJson.amount) / 10000000).toString();
  
  let idB64 = paymentId.replace(/-/g, "+").replace(/_/g, "/");
  while (idB64.length % 4) idB64 += "=";
  const hexPaymentId = Buffer.from(idB64, 'base64').toString('hex');

  const tx = new TransactionBuilder(account, {
      fee: (await server.fetchBaseFee()).toString(),
      networkPassphrase: Networks.TESTNET
  })
  .addOperation(Operation.payment({
      destination: reqJson.recipient,
      asset: new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
      amount: amountToPay
  }))
  .addMemo(Memo.hash(hexPaymentId))
  .setTimeout(60)
  .build();
  
  tx.sign(testPair);
  const signedXdr = tx.toXDR();
  
  console.log("Submitting back...");
  const webReq2 = {
      url: "http://localhost:3402/api/audit",
      method: "POST",
      headers: { get: (name) => name.toLowerCase() === 'authorization' ? `Payment transaction="${signedXdr}"` : (name.toLowerCase() === 'host' ? 'localhost:3402' : null) }
  };
  
  const result2 = await mppx.charge({amount: "1", description: "test"})(webReq2);
  console.log("Status:", result2.status);
  console.log(JSON.stringify(result2, null, 2));
}

main().catch(console.error);
