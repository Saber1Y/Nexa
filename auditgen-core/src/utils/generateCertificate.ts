import jsPDF from "jspdf";
import { BOT_CHAIN_NAME, explorerTxUrl } from "@/utils/botChain";

interface CertData {
  match_score: number;
  verdict: string;
  seniority: string;
  explanation: string;
  matched_skills?: string[];
  missing_skills?: string[];
  attestationDigest?: string;
  [key: string]: unknown;
}

interface CertMeta {
  screeningId?: string;
  paymentTx?: string;
  receiptTx?: string;
  resultHash?: string;
  consensusTx?: string;
}

const GENLAYER_EXPLORER = "https://explorer-studio.genlayer.com/transactions/";

export function generateCertificate(data: CertData, jobTitle: string, meta: CertMeta = {}) {
  const { screeningId, paymentTx, receiptTx, resultHash, consensusTx } = meta;
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  let y = 20;

  // ── Header ─────────────────────────────────────────
  doc.setFillColor(15, 15, 25);
  doc.rect(0, 0, w, 50, "F");

  doc.setTextColor(160, 120, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NEXA AI BRIDGE", w / 2, y + 8, { align: "center" });

  doc.setTextColor(200, 200, 220);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Autonomous AI Audit Certificate", w / 2, y + 18, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 150);
  doc.text("Settlement by BOT Chain · Audit by Nexa x402 + AI Consensus", w / 2, y + 26, { align: "center" });

  y = 60;

  // ── Audit Info ─────────────────────────────────────
  doc.setTextColor(60, 60, 80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("AUDIT DETAILS", 20, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const details = [
    ["Job Title", jobTitle || "N/A"],
    ["Screening ID", screeningId || "N/A"],
    ["Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ["Match Score", `${data.match_score}/100`],
    ["Verdict", data.verdict],
    ["Seniority", data.seniority],
  ];

  details.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 120);
    doc.text(`${label}:`, 20, y);
    doc.setTextColor(30, 30, 50);
    doc.setFont("helvetica", "bold");
    doc.text(value, 70, y);
    doc.setFont("helvetica", "normal");
    y += 6;
  });

  y += 6;

  // ── AI Explanation ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 80);
  doc.setFontSize(10);
  doc.text("AI CONSENSUS EXPLANATION", 20, y);
  y += 7;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 100);
  const lines = doc.splitTextToSize(`"${data.explanation}"`, w - 40);
  doc.text(lines, 20, y);
  y += lines.length * 5 + 8;

  // ── Skills ─────────────────────────────────────────
  if (data.matched_skills && data.matched_skills.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 160, 80);
    doc.setFontSize(9);
    doc.text("MATCHED SKILLS", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 100);
    doc.text(data.matched_skills.join(", "), 20, y);
    y += 8;
  }

  if (data.missing_skills && data.missing_skills.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 60, 60);
    doc.setFontSize(9);
    doc.text("MISSING SKILLS", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 100);
    doc.text(data.missing_skills.join(", "), 20, y);
    y += 8;
  }

  y += 4;

  // ── Onchain Proofs ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 80);
  doc.setFontSize(10);
  doc.text("ONCHAIN VERIFICATION PROOFS", 20, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const proofs: Array<[string, string, string]> = [];
  if (paymentTx) proofs.push([`USDT Payment (${BOT_CHAIN_NAME})`, paymentTx, explorerTxUrl(paymentTx)]);
  if (receiptTx) proofs.push(["Result Receipt", receiptTx, explorerTxUrl(receiptTx)]);
  if (consensusTx) proofs.push(["AI Consensus", consensusTx, `${GENLAYER_EXPLORER}${consensusTx}`]);

  proofs.forEach(([label, hash, url]) => {
    doc.setTextColor(100, 100, 120);
    doc.text(`${label}:`, 20, y);
    doc.setTextColor(120, 80, 220);
    doc.textWithLink(hash, 20, y + 4, { url });
    y += 12;
  });

  const digest = resultHash || data.attestationDigest;
  if (digest) {
    doc.setTextColor(100, 100, 120);
    doc.text("Result Hash (SHA-256):", 20, y);
    doc.setTextColor(30, 30, 50);
    doc.setFont("courier", "normal");
    doc.text(digest, 20, y + 4);
    doc.setFont("helvetica", "normal");
    y += 12;
  }

  // ── Footer ─────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200, 200, 220);
  doc.line(20, footerY - 5, w - 20, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 160);
  doc.text("Verified by 5 AI Validators via GenLayer Decentralized Consensus Protocol", w / 2, footerY, { align: "center" });
  doc.text("https://nexa-ai-bridge.vercel.app", w / 2, footerY + 4, { align: "center" });

  // ── Save ───────────────────────────────────────────
  const filename = `Nexa_Audit_Certificate_${screeningId || "result"}.pdf`;
  doc.save(filename);
}
