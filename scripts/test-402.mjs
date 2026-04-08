// Verify USDC challenge includes feePayer: true
const res = await fetch("http://localhost:3402/api/audit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ jobTitle: "test" }),
});

const wwwAuth = res.headers.get("www-authenticate");
const parts = wwwAuth.split("Payment ").filter(Boolean);

for (const part of parts) {
  const reqMatch = part.match(/request="([^"]+)"/);
  if (reqMatch) {
    const decoded = JSON.parse(Buffer.from(reqMatch[1], "base64url").toString());
    const isUsdc = decoded.currency === "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
    console.log(`${isUsdc ? "USDC" : "XLM"} →`, JSON.stringify(decoded, null, 2));
  }
}
