import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import {BOT_PAY_TO, BOT_USDT_ADDRESS, AUDIT_PRICE_ATOMIC, AUDIT_SERVICE_ID, AUDIT_SERVICE_VERSION, validateBotConfig} from "./botConfig.mjs";
import {encodeBase64Url, paymentRequired, parsePaymentSignature, verifyPayment, settlePayment} from "./botX402.mjs";
import {listServices, registerBuiltInService} from "./serviceRegistry.mjs";
import {runAudit} from "./aiAdapter.mjs";
import {recordReceiptOnChain} from "./receipts.mjs";

const app = express();
app.use(cors({exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"]}));
app.use(express.json({limit: "256kb"}));
registerBuiltInService();

const seenPayments = new Set();

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

app.get("/health", (req, res) => res.json({status: "ok", product: "Nexa", network: "eip155:968", asset: BOT_USDT_ADDRESS, payTo: BOT_PAY_TO, priceAtomic: AUDIT_PRICE_ATOMIC}));

app.get("/api/services", (req, res) => res.json({x402Version: 2, services: listServices()}));

app.post("/api/audit", async (req, res) => {
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
