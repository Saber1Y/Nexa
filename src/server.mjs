import "dotenv/config";
import express from "express";
import cors from "cors";
import { Mppx, stellar } from "@stellar/mpp/charge/server";
import { USDC_SAC_TESTNET } from "@stellar/mpp";
import { 
  getGenLayerClient, 
  submitScreening, 
  waitForReceipt, 
  getScreeningIdFromReceipt, 
  getScreening 
} from "./genlayer.mjs";

const app = express();
app.use(cors());
app.use(express.json());

// ─── MPP Configuration ───────────────────────────────────────────────────────
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
      const headers = result.challenge.headers;
      headers.forEach((value, key) => res.setHeader(key, value));
      return res.status(402).json(await result.challenge.json());
    }

    req.mppReceipt = result.receipt;
    next();
  } catch (error) {
    console.error("❌ MPP Guard Error:", error.message);
    res.status(500).json({ error: "Payment verification failed", message: error.message });
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", bridge: "Nexa" });
});

app.post("/api/audit", mppGuard, async (req, res) => {
  try {
    console.log("✅ Payment verified. Starting GenLayer audit...");
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

    results.txHash = hash;
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
  console.log(`   Price   : 1.00 USDC (Stellar Testnet)\n`);
});

// Keep process alive explicitly
process.on('SIGINT', () => {
    console.log('Stopping server...');
    server.close();
    process.exit(0);
});

// Add a keep-alive interval just in case the environment is aggressive
setInterval(() => {}, 1000 * 60 * 60);
