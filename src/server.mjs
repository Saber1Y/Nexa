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
// Two separate Mppx instances — one per currency. This avoids the mppx library
// limitation where two methods with the same name/intent ("stellar/charge")
// overwrite each other in the internal handler map.
const mppUsdc = Mppx.create({
  secretKey: process.env.STELLAR_SECRET_KEY,
  realm: "NexaUSDC",
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_PUBLIC_KEY,
      currency: USDC_SAC_TESTNET,
      network: "stellar:testnet",
      // Bridge sponsors XLM gas fees for USDC payments → users pay $0 gas
      feePayer: {
        envelopeSigner: process.env.STELLAR_SECRET_KEY,
      },
    }),
  ],
});

const mppXlm = Mppx.create({
  secretKey: process.env.STELLAR_SECRET_KEY,
  realm: "NexaXLM",
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_PUBLIC_KEY,
      currency: XLM_SAC_TESTNET,
      network: "stellar:testnet",
    }),
  ],
});

// Pre-configured handlers (each instance has only one method → `charge` works)
const usdcHandler = mppUsdc.charge({ amount: "1", description: "Autonomous AI Resume Audit - Nexa Bridge (USDC)" });
const xlmHandler  = mppXlm.charge({ amount: "10", description: "Autonomous AI Resume Audit - Nexa Bridge (XLM)" });

async function mppGuard(req, res, next) {
  const webReq = {
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    method: req.method,
    headers: {
      get: (name) => req.header(name),
    },
  };

  try {
    const authHeader = req.header("Authorization");
    const source = req.header("Origin") ? "🌐 Frontend" : "🤖 Agent";
    const timestamp = new Date().toLocaleTimeString();

    if (!authHeader || !authHeader.startsWith("Payment ")) {
      // ── No credential: issue merged 402 with both currencies ────────
      console.log(`\n┌─── 📨 Incoming Request [${timestamp}] ───────────────────────`);
      console.log(`│ Source:   ${source}`);
      console.log(`│ Action:   POST /api/audit (no payment attached)`);
      console.log(`│ Status:   Issuing 402 Payment Required challenge...`);
      console.log(`└────────────────────────────────────────────────────────`);

      const [usdcResult, xlmResult] = await Promise.all([
        usdcHandler(webReq),
        xlmHandler(webReq),
      ]);

      // Merge WWW-Authenticate headers from both challenges
      const mergedHeaders = new Headers();
      mergedHeaders.set("Cache-Control", "no-store");

      for (const result of [usdcResult, xlmResult]) {
        if (result.status === 402) {
          const wwwAuth = result.challenge.headers.get("WWW-Authenticate");
          if (wwwAuth) mergedHeaders.append("WWW-Authenticate", wwwAuth);
        }
      }

      // Use the first body for the problem-details JSON
      const body = await usdcResult.challenge.json();
      const contentType = usdcResult.challenge.headers.get("Content-Type");
      if (contentType) mergedHeaders.set("Content-Type", contentType);

      console.log(`   💳 402 → Offered: 1.00 USDC  or  10.00 XLM`);
      mergedHeaders.forEach((value, key) => res.setHeader(key, value));
      return res.status(402).json(body);
    }

    // ── Credential present: dispatch to the correct handler ───────────
    console.log(`\n┌─── 💰 Payment Credential Received [${timestamp}] ─────────`);
    console.log(`│ Source:   ${source}`);
    console.log(`│ Action:   Verifying Stellar payment...`);

    // Try finding a handler that accepts this credential
    let result;
    let paymentCurrency = null;
    
    // First pass: Try USDC
    const usdcAttempt = await usdcHandler(webReq);
    if (usdcAttempt.status !== 402) {
      result = usdcAttempt;
      paymentCurrency = "USDC";
    } else {
      // If USDC failed, check if it was just "Payment Required" or a hard rejection
      // We clone the response to avoid consuming the body prematurely
      const usdcBody = await usdcAttempt.challenge.clone().json().catch(() => ({}));
      if (usdcBody.title === "Invalid Challenge") {
        console.log(`│ ℹ️  Credential invalid for USDC, trying XLM...`);
      }
      
      // try XLM
      const xlmAttempt = await xlmHandler(webReq);
      if (xlmAttempt.status !== 402) {
        result = xlmAttempt;
        paymentCurrency = "XLM";
      } else {
        // Both failed. Return the USDC 402 because it's our primary, 
        // or the XLM one if that's what they tried to pay with.
        const xlmBody = await xlmAttempt.challenge.clone().json().catch(() => ({}));
        result = (xlmBody.title === "Invalid Challenge") ? xlmAttempt : usdcAttempt;
      }
    }

    if (!paymentCurrency || result.status === 402) {
      console.log(`│ ❌ Payment credential REJECTED`);
      console.log(`└────────────────────────────────────────────────────────`);
      const headers = result.challenge.headers;
      headers.forEach((value, key) => res.setHeader(key, value));
      return res.status(402).json(await result.challenge.json());
    }
    console.log(`│ ✅ Payment VERIFIED (${paymentCurrency})`);
    console.log(`└────────────────────────────────────────────────────────`);

    // ── Extract the Stellar tx hash from the receipt ────────────────
    // withReceipt() returns a Response with a Payment-Receipt header
    // that contains a JSON receipt including the `reference` (tx hash).
    let stellarPaymentHash = null;
    if (result.withReceipt) {
      const receiptResponse = result.withReceipt(new Response("OK"));
      const receiptHeader = receiptResponse.headers.get("Payment-Receipt");
      if (receiptHeader) {
        try {
          const receiptData = JSON.parse(atob(receiptHeader));
          stellarPaymentHash = receiptData.reference || null;
          console.log(`📡 MPP Receipt:`, JSON.stringify(receiptData, null, 2));
        } catch {
          // Try parsing as base64url
          try {
            const decoded = Buffer.from(receiptHeader, "base64url").toString();
            const receiptData = JSON.parse(decoded);
            stellarPaymentHash = receiptData.reference || null;
            console.log(`📡 MPP Receipt (base64url):`, JSON.stringify(receiptData, null, 2));
          } catch {
            console.log(`📡 MPP Receipt header (raw):`, receiptHeader);
            stellarPaymentHash = receiptHeader;
          }
        }
      }
    }

    req.stellarPaymentHash = stellarPaymentHash;
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

// ─── Waitlist (Email Collection) ─────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WAITLIST_FILE = process.env.VERCEL
  ? "/tmp/waitlist.json"
  : path.join(__dirname, "..", "waitlist.json");

function loadWaitlist() {
  try {
    if (fs.existsSync(WAITLIST_FILE)) {
      return JSON.parse(fs.readFileSync(WAITLIST_FILE, "utf-8"));
    }
  } catch { /* ignore */ }
  return [];
}

function saveWaitlist(list) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
}

app.post("/api/waitlist", (req, res) => {
  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const waitlist = loadWaitlist();

  // Check for duplicates
  if (waitlist.some((entry) => entry.email === email)) {
    return res.json({ success: true, message: "You're already on the waitlist!" });
  }

  waitlist.push({
    email,
    subscribedAt: new Date().toISOString(),
  });

  saveWaitlist(waitlist);
  console.log(`📬 Waitlist signup: ${email} (total: ${waitlist.length})`);

  res.json({ success: true, message: "You've been added to the waitlist!" });
});

app.post("/api/audit", mppGuard, async (req, res) => {
  const auditStart = Date.now();
  const useSSE = req.header("Accept")?.includes("text/event-stream");

  // Helper to send SSE events (only when streaming)
  function sendEvent(event, data) {
    if (useSSE) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  }

  try {
    // Extract the Stellar payment tx hash from the MPP guard
    const stellarPaymentHash = req.stellarPaymentHash || null;
    const paymentAssetLabel = stellarPaymentHash ? "Stellar Payment" : "Payment";

    const { jobTitle, jobDescription, mustHaveSkills, resumeText } = req.body;

    console.log(`\n╔══════════════════════════════════════════════════════════╗`);
    console.log(`║  🛸 NEXA AUDIT PIPELINE                                  ║`);
    console.log(`╚══════════════════════════════════════════════════════════╝`);
    console.log(`   📋 Job Title:    ${jobTitle}`);
    console.log(`   ⭐ Stellar Tx:   ${stellarPaymentHash || 'N/A'}`);
    
    const client = getGenLayerClient();

    // ── If SSE, set up streaming headers ────────────────────────────────
    if (useSSE) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });
      sendEvent("payment", { stellarPaymentHash, paymentAssetLabel });
    }

    console.log(`\n   [1/4] 🚀 Submitting to GenLayer (5 AI Validators)...`);
    const hash = await submitScreening(client, {
      jobTitle,
      jobDescription: jobDescription || "",
      mustHaveSkills: mustHaveSkills || "",
      resumeText,
      userWalletAddress: process.env.GENLAYER_ADDRESS || "0x0000000000000000000000000000000000000000"
    });
    console.log(`         GenLayer Tx: ${hash}`);

    // ── Send GenLayer hash immediately so frontend can show explorer link ──
    sendEvent("submitted", { genLayerHash: hash });

    console.log(`   [2/4] ⏳ Waiting for AI consensus...`);
    sendEvent("status", { phase: "consensus", message: "AI validators reaching consensus..." });

    const receipt = await waitForReceipt(client, hash);
    const screeningId = getScreeningIdFromReceipt(receipt);
    console.log(`         Consensus reached! Screening ID: ${screeningId}`);
    sendEvent("status", { phase: "fetching", message: "Consensus reached! Fetching results..." });

    console.log(`   [3/4] 📄 Fetching finalized results...`);
    const results = await getScreening(client, screeningId);
    console.log(`         Verdict: ${results.verdict} | Score: ${results.match_score}/100 | Seniority: ${results.seniority}`);

    // ── Anchor attestation on Stellar ──────────────────────────────────
    console.log(`   [4/4] 🔏 Anchoring attestation on Stellar...`);
    sendEvent("status", { phase: "attestation", message: "Anchoring proof on Stellar..." });

    const attestationDigest = computeAttestationHash({
      screeningId,
      verdict: results.verdict || "Unknown",
      matchScore: results.match_score ?? 0,
      walletAddress: process.env.STELLAR_PUBLIC_KEY,
    });

    const attestationHash = await anchorAttestation(attestationDigest);
    console.log(`         Attestation Tx: ${attestationHash}`);

    // ── Build response with all on-chain references ────────────────────
    results.txHash = hash;                         // GenLayer consensus tx
    results.stellarPaymentHash = stellarPaymentHash; // Stellar USDC payment tx
    results.stellarAttestationHash = attestationHash; // Stellar attestation tx
    results.attestationDigest = attestationDigest.toString("hex"); // The SHA-256 digest
    results.paymentAssetLabel = paymentAssetLabel; // Label for UI (USDC or XLM)

    const elapsed = ((Date.now() - auditStart) / 1000).toFixed(1);
    console.log(`\n   ✅ AUDIT COMPLETE in ${elapsed}s`);
    console.log(`   ────────────────────────────────────────────────`);
    console.log(`   ⭐ Payment:      ${stellarPaymentHash}`);
    console.log(`   🧠 Consensus:    ${hash}`);
    console.log(`   🔗 Attestation:  ${attestationHash}`);
    console.log(`   📊 Result:       ${results.verdict} (${results.match_score}/100)`);
    console.log(`   ────────────────────────────────────────────────\n`);

    if (useSSE) {
      sendEvent("complete", { success: true, screeningId, results });
      res.end();
    } else {
      res.json({ success: true, screeningId, results });
    }
  } catch (error) {
    console.error("Audit Error:", error);

    // Return a specific response for Undetermined consensus
    if (error.code === "CONSENSUS_UNDETERMINED") {
      const errData = {
        error: error.message,
        code: "CONSENSUS_UNDETERMINED",
        genLayerHash: error.genLayerHash,
        hint: "The 5 AI validators could not agree. Try with clearer job details or a more detailed resume."
      };
      if (useSSE) {
        sendEvent("error", errData);
        return res.end();
      }
      return res.status(422).json(errData);
    }

    if (useSSE) {
      sendEvent("error", { error: error.message });
      return res.end();
    }
    res.status(500).json({ error: error.message });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3402;

// Standard export for Vercel / serverless
export default app;

// Only start the listener if run directly (local dev)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`\n🛸 Nexa Bridge Server is live!`);
    console.log(`   Endpoint: POST http://localhost:${PORT}/api/audit`);
    console.log(`   Accepts : 1.00 USDC  or  10 XLM (Stellar Testnet)`);
    console.log(`   Attestation: On-chain SHA-256 anchoring enabled`);
    console.log(`   Facilitator: OpenZeppelin x402 compatible\n`);
  });

  process.on('SIGINT', () => {
      console.log('Stopping server...');
      server.close();
      process.exit(0);
  });
}
