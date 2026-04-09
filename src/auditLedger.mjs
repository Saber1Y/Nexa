import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_FILE = process.env.VERCEL
  ? "/tmp/audit-history.json"
  : path.join(__dirname, "..", "audit-history.json");

export function loadLedger() {
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      return JSON.parse(fs.readFileSync(LEDGER_FILE, "utf-8"));
    }
  } catch { /* ignore corrupt file */ }
  return [];
}

export function saveLedgerEntry(entry) {
  const ledger = loadLedger();
  ledger.push(entry);
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
  return ledger;
}

export function findByHash(hash) {
  const ledger = loadLedger();
  return ledger.find(
    (e) =>
      e.stellarAttestationHash === hash ||
      e.stellarPaymentHash === hash ||
      e.genLayerHash === hash ||
      e.attestationDigest === hash
  ) || null;
}

export function getStats() {
  const ledger = loadLedger();
  const total = ledger.length;
  if (total === 0) {
    return { totalAudits: 0, avgScore: 0, avgTime: 0, successRate: 0, totalUsdc: 0, totalXlm: 0, latestAudit: null };
  }
  const avgScore = Math.round(ledger.reduce((s, e) => s + (e.matchScore || 0), 0) / total);
  const avgTime = +(ledger.reduce((s, e) => s + (e.elapsedSeconds || 0), 0) / total).toFixed(1);
  const qualified = ledger.filter((e) => e.verdict === "Qualified").length;
  const successRate = Math.round((qualified / total) * 100);
  const totalUsdc = ledger.filter((e) => e.paymentAsset === "USDC").length;
  const totalXlm = ledger.filter((e) => e.paymentAsset === "XLM").length;
  const latestAudit = ledger[ledger.length - 1]?.completedAt || null;

  return { totalAudits: total, avgScore, avgTime, successRate, totalUsdc, totalXlm, latestAudit };
}
