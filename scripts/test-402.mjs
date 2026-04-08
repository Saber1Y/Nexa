// Quick test: verify the 402 challenge returns two distinct currencies
const res = await fetch("http://localhost:3402/api/audit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ jobTitle: "test" }),
});

console.log("Status:", res.status);

const wwwAuth = res.headers.get("www-authenticate");
const parts = wwwAuth.split("Payment ").filter(Boolean);
console.log("Challenge count:", parts.length);

for (const part of parts) {
  const reqMatch = part.match(/request="([^"]+)"/);
  if (reqMatch) {
    const decoded = JSON.parse(Buffer.from(reqMatch[1], "base64url").toString());
    console.log("Currency:", decoded.currency, "Amount:", decoded.amount);
  }
}
