import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

/**
 * Convert a camelCase audit entry from the app to snake_case for Supabase,
 * and vice versa.
 */
function toDbRow(entry) {
  return {
    id: entry.id,
    job_title: entry.jobTitle,
    verdict: entry.verdict,
    match_score: entry.matchScore ?? 0,
    seniority: entry.seniority || "Unknown",
    explanation: entry.explanation || "",
    matched_skills: entry.matchedSkills || [],
    missing_skills: entry.missingSkills || [],
    stellar_payment_hash: entry.stellarPaymentHash || null,
    stellar_attestation_hash: entry.stellarAttestationHash || null,
    gen_layer_hash: entry.genLayerHash || null,
    attestation_digest: entry.attestationDigest || null,
    payment_asset: entry.paymentAsset || "USDC",
    elapsed_seconds: entry.elapsedSeconds || 0,
    completed_at: entry.completedAt || new Date().toISOString(),
  };
}

function fromDbRow(row) {
  return {
    id: row.id,
    jobTitle: row.job_title,
    verdict: row.verdict,
    matchScore: row.match_score,
    seniority: row.seniority,
    explanation: row.explanation,
    matchedSkills: row.matched_skills,
    missingSkills: row.missing_skills,
    stellarPaymentHash: row.stellar_payment_hash,
    stellarAttestationHash: row.stellar_attestation_hash,
    genLayerHash: row.gen_layer_hash,
    attestationDigest: row.attestation_digest,
    paymentAsset: row.payment_asset,
    elapsedSeconds: row.elapsed_seconds,
    completedAt: row.completed_at,
  };
}

export async function loadLedger() {
  try {
    const { data, error } = await supabase
      .from("audits")
      .select("*")
      .order("completed_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(fromDbRow);
  } catch (err) {
    console.error("⚠️ Supabase loadLedger error:", err.message);
    return [];
  }
}

export async function saveLedgerEntry(entry) {
  try {
    const row = toDbRow(entry);
    const { error } = await supabase.from("audits").insert(row);
    if (error) throw error;
    console.log("   📒 Audit saved to Supabase");
  } catch (err) {
    console.error("⚠️ Supabase saveLedgerEntry error:", err.message);
  }
}

export async function findByHash(hash) {
  try {
    const { data, error } = await supabase
      .from("audits")
      .select("*")
      .or(
        `stellar_attestation_hash.eq.${hash},stellar_payment_hash.eq.${hash},gen_layer_hash.eq.${hash},attestation_digest.eq.${hash}`
      )
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? fromDbRow(data) : null;
  } catch (err) {
    console.error("⚠️ Supabase findByHash error:", err.message);
    return null;
  }
}

export async function getStats() {
  try {
    const { data, error } = await supabase
      .from("audits")
      .select("*");

    if (error) throw error;
    const ledger = (data || []).map(fromDbRow);
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
    const latestAudit = ledger[0]?.completedAt || null;

    return { totalAudits: total, avgScore, avgTime, successRate, totalUsdc, totalXlm, latestAudit };
  } catch (err) {
    console.error("⚠️ Supabase getStats error:", err.message);
    return { totalAudits: 0, avgScore: 0, avgTime: 0, successRate: 0, totalUsdc: 0, totalXlm: 0, latestAudit: null };
  }
}
