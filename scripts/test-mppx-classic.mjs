import { Mppx, stellar } from "@stellar/mpp/charge/server";
const mppx = Mppx.create({
  secretKey: "SECRET_KEY_NOT_REAL_JUST_FOR_TESTS__",
  realm: "Nexa",
  methods: [
    stellar.charge({
      recipient: "GBVUF4K3...", // mock
      currency: "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      network: "stellar:testnet",
    }),
  ],
});
console.log("Success");
