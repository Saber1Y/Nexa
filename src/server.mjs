import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import {BOT_PAY_TO, BOT_USDT_ADDRESS, AUDIT_PRICE_ATOMIC, AUDIT_SERVICE_ID, AUDIT_SERVICE_VERSION,
  MATCH_PRICE_ATOMIC, MATCH_SERVICE_ID, SKILLS_PRICE_ATOMIC, SKILLS_SERVICE_ID, validateBotConfig} from "./botConfig.mjs";
import {encodeBase64Url, paymentRequired, parsePaymentSignature, verifyPayment, settlePayment} from "./botX402.mjs";
import {listServices, registerBuiltInService} from "./serviceRegistry.mjs";
import {runAudit} from "./aiAdapter.mjs";
import {recordReceiptOnChain, getReceiptOnChain} from "./receipts.mjs";

const app = express();
app.use(cors({exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"]}));
app.use(express.json({limit: "256kb"}));
registerBuiltInService();

const seenPayments = new Set();
const DATA_DIR = process.env.NEXA_DATA_DIR || (process.env.VERCEL ? "/tmp/nexa" : path.join(process.cwd(), "data"));
const AUDIT_LOG = path.join(DATA_DIR, "audits.json");
const MAX_AUDITS = 200;

function loadAudits() {
  try {
    return JSON.parse(fs.readFileSync(AUDIT_LOG, "utf8"));
  } catch {
    return [];
  }
}

function appendAudit(record) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), {recursive: true});
    const audits = loadAudits();
    audits.unshift(record);
    fs.writeFileSync(AUDIT_LOG, JSON.stringify(audits.slice(0, MAX_AUDITS), null, 2));
  } catch (error) {
    console.error("audit log write failed:", error.message);
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function resultHash(value) {
  return `0x${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function paymentId(payment) {
  return `0x${crypto.createHash("sha256").update(`${payment.payer}:${payment.auth.nonce}:${AUDIT_SERVICE_ID}`).digest("hex")}`;
}

function send402(req, res, error) {
  const body = paymentRequired(`${req.protocol}://${req.get("host")}${req.originalUrl}`, error);
  res.setHeader("PAYMENT-REQUIRED", encodeBase64Url(body));
  return res.status(402).json(body);
}

const health = (req, res) => res.json({status: "ok", product: "Nexa", network: "eip155:968", asset: BOT_USDT_ADDRESS, payTo: BOT_PAY_TO, priceAtomic: AUDIT_PRICE_ATOMIC});
app.get("/health", health);
app.get("/api/health", health);

app.get("/api/services", (req, res) => res.json({x402Version: 2, services: listServices()}));

app.get("/api/stats", (req, res) => {
  const audits = loadAudits();
  const scores = audits.map((a) => Number(a.results?.match_score ?? 0));
  const recorded = audits.filter((a) => a.recorded).length;
  const totalAtomic = audits.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const times = audits.map((a) => Number(a.durationMs || 0)).filter((n) => n > 0);
  res.json({
    totalAudits: audits.length,
    avgScore: scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : 0,
    avgTime: times.length ? Math.round(times.reduce((s, n) => s + n, 0) / times.length / 1000) : 0,
    successRate: audits.length ? Math.round((recorded / audits.length) * 100) : 0,
    totalPaidAtomic: totalAtomic,
    totalPaidTusdt: (totalAtomic / 1e6).toFixed(2),
    receiptCount: recorded,
    latestAudit: audits[0]?.completedAt ?? null,
  });
});

const WAITLIST = path.join(DATA_DIR, "waitlist.json");

app.post("/api/waitlist", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({error: "A valid email address is required."});
  }
  try {
    fs.mkdirSync(path.dirname(WAITLIST), {recursive: true});
    let entries = [];
    try { entries = JSON.parse(fs.readFileSync(WAITLIST, "utf8")); } catch { entries = []; }
    if (!entries.some((e) => e.email === email)) {
      entries.push({email, joinedAt: new Date().toISOString()});
      fs.writeFileSync(WAITLIST, JSON.stringify(entries, null, 2));
    }
    res.json({ok: true, position: entries.findIndex((e) => e.email === email) + 1});
  } catch (error) {
    res.status(500).json({error: error instanceof Error ? error.message : String(error)});
  }
});

app.get("/api/audits", (req, res) => res.json({audits: loadAudits()}));

app.get("/api/receipt/:paymentId", async (req, res) => {
  try {
    const receipt = await getReceiptOnChain(req.params.paymentId);
    res.json(receipt);
  } catch (error) {
    res.status(400).json({found: false, error: error instanceof Error ? error.message : String(error)});
  }
});

app.get("/api/verify/:paymentId", async (req, res) => {
  try {
    const onChain = await getReceiptOnChain(req.params.paymentId);
    const local = loadAudits().find((a) => a.paymentId === req.params.paymentId) || null;
    if (!onChain.found && !local) return res.json({found: false, error: "No audit found for this paymentId."});
    const hashMatches = local && onChain.found ? local.resultHash === onChain.resultHash : null;
    res.json({found: true, audit: { ...local, onChain }, hashMatches});
  } catch (error) {
    res.status(400).json({found: false, error: error instanceof Error ? error.message : String(error)});
  }
});

app.post("/api/audit", async (req, res) => {
  const startedAt = Date.now();
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const signatureHeader = req.header("PAYMENT-SIGNATURE");

  const {jobTitle = "", jobDescription = "", mustHaveSkills = "", resumeText = ""} = req.body || {};
  if (!jobTitle || typeof jobTitle !== "string") return res.status(400).json({error: "jobTitle is required"});
  if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) return res.status(400).json({error: "resumeText is required"});

  if (!signatureHeader) return send402(req, res);

  let verified;
  try {
    const payload = parsePaymentSignature(signatureHeader);
    verified = await verifyPayment(payload, resourceUrl);
  } catch (error) {
    return send402(req, res, error instanceof Error ? error.message : "invalid payment");
  }

  const id = paymentId(verified);
  if (seenPayments.has(id)) return res.status(409).json({error: "duplicate_payment", paymentId: id});

  let settlement;
  try {
    settlement = await settlePayment(verified);
  } catch (error) {
    return res.status(402).json({error: "settlement_failed", detail: error instanceof Error ? error.message : String(error)});
  }
  seenPayments.add(id);
  res.setHeader("PAYMENT-RESPONSE", encodeBase64Url(settlement));

  let audit;
  try {
    audit = await runAudit({jobTitle, jobDescription, mustHaveSkills, resumeText, payer: verified.payer});
  } catch (error) {
    return res.status(502).json({
      error: "execution_failed",
      detail: error instanceof Error ? error.message : String(error),
      payment: {...settlement, paymentId: id},
      refund: "Service execution failed after settlement. The payment is on-chain; contact the provider with this paymentId for a refund.",
    });
  }

  const outputHash = resultHash(stableStringify({
    serviceId: AUDIT_SERVICE_ID,
    serviceVersion: AUDIT_SERVICE_VERSION,
    adapter: audit.adapter,
    screeningId: audit.screeningId,
    results: audit.results,
  }));

  let onChainReceipt = {recorded: false};
  try {
    onChainReceipt = await recordReceiptOnChain({
      paymentId: id,
      payer: verified.payer,
      provider: BOT_PAY_TO,
      asset: BOT_USDT_ADDRESS,
      amount: AUDIT_PRICE_ATOMIC,
      resultHash: outputHash,
    });
  } catch (error) {
    onChainReceipt = {recorded: false, reason: error instanceof Error ? error.message : String(error)};
  }

  appendAudit({
    paymentId: id,
    screeningId: audit.screeningId,
    adapter: audit.adapter,
    service: {id: AUDIT_SERVICE_ID, version: AUDIT_SERVICE_VERSION},
    jobTitle,
    results: audit.results,
    resultHash: outputHash,
    paymentTx: settlement.transaction,
    receiptTx: onChainReceipt.tx || null,
    recorded: Boolean(onChainReceipt.recorded),
    payer: verified.payer,
    amount: AUDIT_PRICE_ATOMIC,
    asset: BOT_USDT_ADDRESS,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  });

  return res.json({
    success: true,
    payment: {...settlement, paymentId: id},
    service: {id: AUDIT_SERVICE_ID, version: AUDIT_SERVICE_VERSION},
    adapter: audit.adapter,
    execution: audit.execution,
    screeningId: audit.screeningId,
    results: audit.results,
    resultHash: outputHash,
    receipt: {paymentId: id, resultHash: outputHash, ...onChainReceipt},
  });
});

try {
  validateBotConfig();
  console.log(`Nexa BOT service ready on ${process.env.PORT || 3402}; payTo=${BOT_PAY_TO}; price=${AUDIT_PRICE_ATOMIC} atomic tUSDT`);
} catch (error) {
  console.error(`Nexa configuration error: ${error.message}`);
  if (process.env.NODE_ENV === "production") process.exitCode = 1;
}

export default app;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const server = app.listen(Number(process.env.PORT || 3402), () => console.log("Nexa BOT bridge listening"));
  process.on("SIGINT", () => server.close(() => process.exit(0)));
}

app.post("/api/match", async (req, res) => {
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const signatureHeader = req.header("PAYMENT-SIGNATURE");
  const {jobDescription = "", resumeText = ""} = req.body || {};
  if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) return res.status(400).json({error: "jobDescription is required"});
  if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) return res.status(400).json({error: "resumeText is required"});
  if (!signatureHeader) return send402(req, res);
  let verified;
  try {
    const payload = parsePaymentSignature(signatureHeader);
    verified = await verifyPayment(payload, resourceUrl);
  } catch (error) {
    return send402(req, res, error instanceof Error ? error.message : "invalid payment");
  }
  const id = paymentId(verified);
  if (seenPayments.has(id)) return res.status(409).json({error: "duplicate_payment", paymentId: id});
  let settlement;
  try {
    settlement = await settlePayment(verified);
  } catch (error) {
    return res.status(402).json({error: "settlement_failed", detail: error instanceof Error ? error.message : String(error)});
  }
  seenPayments.add(id);
  res.setHeader("PAYMENT-RESPONSE", encodeBase64Url(settlement));
  const system = `You are an ATS matcher. Return ONLY JSON with keys match_score (0-100), overlaps (string[]), gaps (string[]), verdict ("STRONG","GOOD","WEAK","NONE"), summary (string<=80). Compare JD vs resume semantically.`;
  const user = `JOB_DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resumeText}`;
  let result;
  try {
    const {runAudit} = await import("./aiAdapter.mjs");
    const audit = await runAudit({jobTitle: "match", jobDescription, mustHaveSkills: "", resumeText, payer: verified.payer, adapter: undefined, systemPrompt: system, userPrompt: user});
    result = audit.results;
  } catch (error) {
    return res.status(502).json({error: "execution_failed", detail: error instanceof Error ? error.message : String(error), payment: {...settlement, paymentId: id}});
  }
  const outputHash = resultHash(stableStringify({serviceId: MATCH_SERVICE_ID, serviceVersion: "1", results: result}));
  try { await recordReceiptOnChain({paymentId: id, payer: verified.payer, provider: BOT_PAY_TO, asset: BOT_USDT_ADDRESS, amount: MATCH_PRICE_ATOMIC, serviceId: MATCH_SERVICE_ID, endpointHash: "", resultHash: outputHash, durationMs: 0}); } catch {}
  res.json({ok: true, serviceId: MATCH_SERVICE_ID, paymentId: id, settlement, results: result});
});

app.post("/api/skills", async (req, res) => {
  const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const signatureHeader = req.header("PAYMENT-SIGNATURE");
  const {resumeText = "", text = ""} = req.body || {};
  const content = resumeText || text;
  if (!content || typeof content !== "string" || !content.trim()) return res.status(400).json({error: "resumeText or text is required"});
  if (!signatureHeader) return send402(req, res);
  let verified;
  try {
    const payload = parsePaymentSignature(signatureHeader);
    verified = await verifyPayment(payload, resourceUrl);
  } catch (error) {
    return send402(req, res, error instanceof Error ? error.message : "invalid payment");
  }
  const id = paymentId(verified);
  if (seenPayments.has(id)) return res.status(409).json({error: "duplicate_payment", paymentId: id});
  let settlement;
  try {
    settlement = await settlePayment(verified);
  } catch (error) {
    return res.status(402).json({error: "settlement_failed", detail: error instanceof Error ? error.message : String(error)});
  }
  seenPayments.add(id);
  res.setHeader("PAYMENT-RESPONSE", encodeBase64Url(settlement));
  const system = `Extract skills from text. Return ONLY JSON with keys hard_skills (string[]), soft_skills (string[]), tools (string[]), frameworks (string[]), certifications (string[]), years (number), raw_count (number). Deduplicate, lowercase, clean.`;
  const user = `TEXT:\n${content}`;
  let result;
  try {
    const {runAudit} = await import("./aiAdapter.mjs");
    const audit = await runAudit({jobTitle: "skills", jobDescription: "", mustHaveSkills: "", resumeText: content, payer: verified.payer, adapter: undefined, systemPrompt: system, userPrompt: user});
    result = audit.results;
  } catch (error) {
    return res.status(502).json({error: "execution_failed", detail: error instanceof Error ? error.message : String(error), payment: {...settlement, paymentId: id}});
  }
  const outputHash = resultHash(stableStringify({serviceId: SKILLS_SERVICE_ID, serviceVersion: "1", results: result}));
  try { await recordReceiptOnChain({paymentId: id, payer: verified.payer, provider: BOT_PAY_TO, asset: BOT_USDT_ADDRESS, amount: SKILLS_PRICE_ATOMIC, serviceId: SKILLS_SERVICE_ID, endpointHash: "", resultHash: outputHash, durationMs: 0}); } catch {}
  res.json({ok: true, serviceId: SKILLS_SERVICE_ID, paymentId: id, settlement, results: result});
});
