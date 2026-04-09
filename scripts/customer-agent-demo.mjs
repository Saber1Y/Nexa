import "dotenv/config";
import { Mppx } from "mppx/client";
import { stellar } from "@stellar/mpp/charge/client";
import { USDC_SAC_TESTNET } from "@stellar/mpp";

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
        currency: USDC_SAC_TESTNET,
      }),
    ],
    // Event logger to see the autonomous magic in action
    onChallenge: (response) => {
      console.log("💳 402 Payment Required detected!");
      console.log("   Auto-signing 1.00 USDC transfer on Stellar...");
    }
  });

  // Pointing to your LIVE Vercel App
  const url = "https://nexa-ai-bridge.vercel.app/api/audit";
  /* 📂 Change these values to test different scenarios! */
const auditData = {
  jobTitle: "Stellar Developer", // Change to "React Developer", "Accountant", etc.
  jobDescription: "Specializing in Soroban Smart Contracts.",
  mustHaveSkills: "Rust, JavaScript, Stellar SDK, Horizon API",
  resumeText: "I am a Rust expert with 5 years of experience in blockchain..."
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
      const errorBody = await response.json().catch(() => ({ error: "Unknown error" }));
      
      // Handle Undetermined Consensus gracefully
      if (response.status === 422 && errorBody.code === "CONSENSUS_UNDETERMINED") {
        console.log("\n⚖️  AI Consensus: UNDETERMINED");
        console.log("────────────────────────────────────────────────");
        console.log("   The 5 AI validators could NOT reach agreement.");
        console.log("   This happens when the input is ambiguous or an edge case.");
        if (errorBody.genLayerHash) {
          console.log(`\n🧠 GenLayer Tx: ${errorBody.genLayerHash}`);
        }
        console.log(`\n💡 Hint: ${errorBody.hint}`);
        console.log("\n📝 Your USDC payment was still processed. Try again with clearer job details.");
        return;
      }

      throw new Error(`Bridge Error (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    const result = await response.json();

    // 3. Display Results
    console.log("\n✅ Audit Finalized Successfully!");
    console.log("────────────────────────────────────────────────");
    console.log(`🤖 Screening ID: ${result.screeningId}`);
    
    if (result.results) {
      console.log("\n📊 AI Assessment:");
      console.log(`   Match Score: ${result.results.match_score}/100`);
      console.log(`   Verdict:     ${result.results.verdict}`);
      console.log(`   Seniority:   ${result.results.seniority}`);
      console.log(`   Summary:     ${result.results.explanation}`);

      console.log("\n🛡️  On-Chain Verification Proofs:");
      console.log("────────────────────────────────────────────────");
      console.log(`⭐ Stellar Payment:     ${result.results.stellarPaymentHash}`);
      console.log(`🧠 GenLayer Consensus:  ${result.results.txHash}`);
      console.log(`🔗 On-Chain Attestation: ${result.results.stellarAttestationHash}`);
      console.log(`🔐 Attestation Digest:  ${result.results.attestationDigest}`);
    } else {
      console.log("\n⚠️ Results pending or not returned in full.");
    }

    console.log("\n🚀 The agent successfully paid and received the audit autonomously!");

  } catch (error) {
    console.error("\n❌ Agent Error:", error.message);
    if (error.cause) {
      console.error("   Cause:", error.cause);
    } else {
      console.error("   Full Error:", error);
    }
  }
}

main().catch(console.error);
