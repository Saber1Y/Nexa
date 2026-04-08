import "dotenv/config";
import { Mppx, stellar } from "@stellar/mpp/charge/server";
import { USDC_SAC_TESTNET } from "@stellar/mpp";

const mppx = Mppx.create({
  secretKey: process.env.STELLAR_SECRET_KEY,
  realm: "Nexa Bridge",
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_PUBLIC_KEY,
      currency: USDC_SAC_TESTNET,
      network: "stellar:testnet",
    }),
  ],
});

async function main() {
  console.log("Mocking invalid charge...");
  const webReq = {
    url: "http://localhost:3402/api/audit",
    method: "POST",
    headers: { get: (name) => name.toLowerCase() === 'authorization' ? 'Stellar transaction="invalid"' : null }
  };
  
  const result = await mppx.charge({amount: "1", description: "test"})(webReq);
  console.log("Status:", result.status);
  
  if (result.status === 402) {
      console.log("402 Returned again!");
      console.log(await result.challenge.json());
  } else if (result.status === 400 || result.status === 401 || result.status === 403) {
      console.log("Error status:", result.status);
      console.log("Response:", result);
  }
}
main().catch(console.error);
