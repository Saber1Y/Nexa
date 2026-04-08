// Use native fetch (Node 18+)

async function main() {
  console.log("🔍 Testing Nexa Bridge for 402 challenge...");
  
  const response = await fetch("http://localhost:3402/api/audit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobTitle: "Software Engineer",
      resumeText: "Experienced developer..."
    }),
  });

  console.log(`📡 Status: ${response.status} ${response.statusText}`);
  
  if (response.status === 402) {
    console.log("✅ Received 402 Payment Required challenge!");
    console.log("🔑 WWW-Authenticate Header:", response.headers.get("www-authenticate"));
    const body = await response.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));
  } else {
    const text = await response.text();
    console.error("❌ Unexpected response:", text);
  }
}

main().catch(console.error);
