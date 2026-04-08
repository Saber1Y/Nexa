import "dotenv/config";
import { Mppx } from "mppx/client";
import { stellar } from "@stellar/mpp/charge/client";

async function main() {
  console.log("DEBUG: Script started");
  console.log("\n🕵️  Autonomous Customer Agent — Demo Launch");
  console.log("────────────────────────────────────────────────");

  // 1. Initialize the MPP Client
  // This client is "payment-aware". It will automatically detect 402 challenges
  // and sign Stellar transactions using the provided secret key.
  const mpp = Mppx.create({
    methods: [
      stellar.charge({
        secretKey: "SCB4Y7YWI4OEFKJKY4VVJ7VSPCMKBBDHQBZKNOIE36ZLSTH3HCTVSAX7", // Separate Demo Agent Wallet
        // mode: 'pull' is default (sends signed XDR to the bridge for submission)
      }),
    ],
    // Event logger to see the autonomous magic in action
    onChallenge: (response) => {
      console.log("💳 402 Payment Required detected!");
      console.log("   Auto-signing 1.00 USDC transfer on Stellar...");
    }
  });

  const url = "http://localhost:3402/api/audit";
  const auditData = {
    jobTitle: "Senior AI Engineer",
    jobDescription: "Looking for experts in LLMs and agentic workflows.",
    mustHaveSkills: "Python, PyTorch, LangChain, Stellar SDK",
    resumeText: "Experienced AI researcher with a focus on autonomous agents and decentralised finance..."
  };

  console.log("🔍 Requesting resume audit from Nexa Bridge...");

  try {
    // 2. Call the Bridge
    // Note: mpp.fetch handles the 402, signing, and retry COMPLETELY automatically.
    const response = await mpp.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(auditData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bridge Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    // 3. Display Results
    console.log("\n✅ Audit Finalized Successfully!");
    console.log("────────────────────────────────────────────────");
    console.log(`🤖 Screening ID: ${result.screeningId}`);
    
    if (result.results) {
      console.log("\n📊 AI Assessment:");
      console.log(`   Match Score: ${result.results.match_score}/10`);
      console.log(`   Verdict: ${result.results.verdict}`);
      console.log(`   Summary: ${result.results.explanation}`);
    } else {
      console.log("\n⚠️ Results pending or not returned in full.");
    }

    console.log("\n🚀 The agent successfully paid and received the audit autonomously!");

  } catch (error) {
    console.error("\n❌ Agent Error:", error.message);
  }
}

main().catch(console.error);
