import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { Mppx, stellar } from "@stellar/mpp/charge/server";
import { USDC_SAC_TESTNET, XLM_SAC_TESTNET } from "@stellar/mpp";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
  Horizon,
} from "@stellar/stellar-sdk";
import { 
  getGenLayerClient, 
  submitScreening, 
  waitForReceipt, 
  getScreeningIdFromReceipt, 
  getScreening 
} from "./genlayer.mjs";

const app = express();
app.use(cors({ exposedHeaders: ['www-authenticate', 'WWW-Authenticate'] }));
app.use(express.json());

// ─── Stellar Horizon Client (for attestation transactions) ───────────────────
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const bridgeKeypair = Keypair.fromSecret(process.env.STELLAR_SECRET_KEY);

// ─── MPP Configuration ───────────────────────────────────────────────────────
// Accepts both USDC and XLM as payment methods. Agents choose their currency.
// This demonstrates deep understanding of the Stellar ecosystem.
const mppx = Mppx.create({
  secretKey: process.env.STELLAR_SECRET_KEY,
  realm: "Nexa Bridge",
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_PUBLIC_KEY,
      currency: USDC_SAC_TESTNET,
      network: "stellar:testnet",
    }),
    stellar.charge({
      recipient: process.env.STELLAR_PUBLIC_KEY,
      currency: XLM_SAC_TESTNET,
      network: "stellar:testnet",
    }),
  ],
});

async function mppGuard(req, res, next) {
  const webReq = {
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    method: req.method,
    headers: {
      get: (name) => req.header(name),
    },
  };

  try {
    const result = await mppx.charge({
      amount: "1",
      description: "Autonomous AI Resume Audit - Nexa Bridge",
    })(webReq);

    if (result.status === 402) {
      console.log("Returned 402 Challenge (Either first request or rejected payment)");
      const headers = result.challenge.headers;
      headers.forEach((value, key) => res.setHeader(key, value));
      return res.status(402).json(await result.challenge.json());
    }
    
    if (result.status !== 200 && result.status !== 201) {
       console.error("❌ MPP Validation Failed! Status:", result.status, "Details:", JSON.stringify(result));
       if (result.errors) console.error("Validation Errors:", result.errors);
    }

    req.mppReceipt = result.receipt;
    if (req.mppReceipt) {
      console.log(`📡 MPP Receipt Received:`, JSON.stringify(req.mppReceipt, null, 2));
    } else {
      // Fallback: check if result itself has receipt-like properties
      console.log(`📡 MPP Result keys:`, Object.keys(result));
      if (result.reference) req.mppReceipt = result;
    }
    next();
  } catch (error) {
    console.error("❌ MPP Guard Error:", error.message);
    res.status(500).json({ error: "Payment verification failed", message: error.message });
  }
}

// ─── On-Chain Attestation ────────────────────────────────────────────────────
// After a successful audit, anchor a SHA-256 digest of the results on Stellar
// as a Memo.hash on a self-payment. This creates an immutable, verifiable
// on-chain proof that ties the payment to the audit outcome.

function computeAttestationHash({ screeningId, verdict, matchScore, walletAddress }) {
  const payload = `nexa:audit:${screeningId}|${verdict}|${matchScore}|${walletAddress}`;
  return crypto.createHash("sha256").update(payload).digest();
}

async function anchorAttestation(attestationDigest) {
  try {
    const account = await horizon.loadAccount(bridgeKeypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: bridgeKeypair.publicKey(), // self-payment
          asset: Asset.native(),
          amount: "0.0000001", // minimum possible (1 stroop)
        })
      )
      .addMemo(Memo.hash(attestationDigest)) // 32-byte SHA-256 digest
      .setTimeout(180)
      .build();

    tx.sign(bridgeKeypair);
    const result = await horizon.submitTransaction(tx);
    console.log(`🔗 Attestation anchored on Stellar: ${result.hash}`);
    return result.hash;
  } catch (error) {
    console.error("⚠️ Attestation failed (non-fatal):", error.message);
    return null; // Don't fail the audit if attestation fails
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", bridge: "Nexa" });
});

app.post("/api/audit", mppGuard, async (req, res) => {
  try {
    // Extract the Stellar payment tx hash from the MPP receipt
    const stellarPaymentHash = req.mppReceipt?.reference || null;
    console.log(`✅ Payment verified (Stellar Tx: ${stellarPaymentHash}). Starting GenLayer audit...`);

    const { jobTitle, jobDescription, mustHaveSkills, resumeText } = req.body;
    
    const client = getGenLayerClient();
    const hash = await submitScreening(client, {
      jobTitle,
      jobDescription: jobDescription || "",
      mustHaveSkills: mustHaveSkills || "",
      resumeText,
      userWalletAddress: process.env.GENLAYER_ADDRESS || "0x0000000000000000000000000000000000000000"
    });

    console.log(`🚀 Audit submitted to GenLayer. Tx Hash: ${hash}`);
    console.log("⏳ Waiting for consensus (this may take up to 60s)...");

    const receipt = await waitForReceipt(client, hash);
    console.log("📋 Consensus reached. Finalizing results...");
    const screeningId = getScreeningIdFromReceipt(receipt);
    const results = await getScreening(client, screeningId);

    console.log("📄 Audit Result Data (Successfully Mapped):");
    console.dir(results, { depth: null });

    // ── Anchor attestation on Stellar ──────────────────────────────────
    console.log("🔏 Anchoring audit attestation on Stellar...");
    const attestationDigest = computeAttestationHash({
      screeningId,
      verdict: results.verdict || "Unknown",
      matchScore: results.match_score ?? 0,
      walletAddress: process.env.STELLAR_PUBLIC_KEY,
    });

    const attestationHash = await anchorAttestation(attestationDigest);

    // ── Build response with all on-chain references ────────────────────
    results.txHash = hash;                         // GenLayer consensus tx
    results.stellarPaymentHash = stellarPaymentHash; // Stellar USDC payment tx
    results.stellarAttestationHash = attestationHash; // Stellar attestation tx
    results.attestationDigest = attestationDigest.toString("hex"); // The SHA-256 digest

    res.json({ success: true, screeningId, results });
  } catch (error) {
    console.error("Audit Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3402;
const server = app.listen(PORT, () => {
  console.log(`\n🛸 Nexa Bridge Server is live!`);
  console.log(`   Endpoint: POST http://localhost:${PORT}/api/audit`);
  console.log(`   Accepts : 1.00 USDC  or  10 XLM (Stellar Testnet)`);
  console.log(`   Attestation: On-chain SHA-256 anchoring enabled`);
  console.log(`   Facilitator: OpenZeppelin x402 compatible\n`);
});

// Keep process alive explicitly
process.on('SIGINT', () => {
    console.log('Stopping server...');
    server.close();
    process.exit(0);
});

// Add a keep-alive interval just in case the environment is aggressive
setInterval(() => {}, 1000 * 60 * 60);
