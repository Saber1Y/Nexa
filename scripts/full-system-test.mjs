import { Horizon, TransactionBuilder, Networks, Asset, Operation, Memo, Keypair } from "@stellar/stellar-sdk";

async function main() {
  console.log("Mocking a 402 challenge against the running backend server...");
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobTitle: "Dev",
      jobDescription: "",
      mustHaveSkills: "",
      resumeText: "resume txt"
    })
  };
  
  let response = await fetch("http://localhost:3402/api/audit", options);
  console.log("Initial response status:", response.status);
  
  if (response.status === 402) {
      const wwwAuth = response.headers.get("www-authenticate");
      console.log("Got 402 WWW-Authenticate Header:", wwwAuth);

      const schemeMatch = wwwAuth.match(/^([a-zA-Z]+)\s+/);
      const scheme = schemeMatch ? schemeMatch[1] : "Payment";
      const idMatch = wwwAuth.match(/id="([^"]+)"/);
      const reqMatch = wwwAuth.match(/request="([^"]+)"/);
      const paymentId = idMatch[1];
      
      let b64 = reqMatch[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const reqJson = JSON.parse(Buffer.from(b64, 'base64').toString());

      console.log("Building client TX...");
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const testPair = Keypair.random();
      console.log("Funding mock wallet...");
      await fetch(`https://friendbot.stellar.org?addr=${testPair.publicKey()}`); // fund
      
      // Need USDC trustline? Yes, if payment is USDC, the destination must have trustline, but the SENDER also needs USDC to send!
      // But the sender only needs it if the transaction were to succeed! Wait! Does mppx locally simulate the transaction to see if it would succeed, or just check the signature?
      // mppx SUBMITS IT to the network!
      // If the sender DOES NOT have USDC, the submission fails with "op_underfunded" or "op_no_trust"!
      // So mppx.charge WILL return an error (400 validation failed) because the transaction is practically REJECTED by Stellar Network!!!
      console.log("Adding trustline and getting mocked USDC for mock wallet...");
      // Let's not fully fund mock USDC, just let's see what mppx returns.
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
      
      console.log("Submitting Authorization back to server...");
      response = await fetch("http://localhost:3402/api/audit", {
          ...options,
          headers: {
            ...options.headers,
            "Authorization": `${scheme} transaction="${signedXdr}"`
          }
      });
      console.log("Final response status:", response.status);
      console.log(await response.text());
  }
}

main().catch(console.error);
