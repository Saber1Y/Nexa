import crypto from "node:crypto";
import {getGenLayerClient, submitScreening, waitForReceipt, getScreeningIdFromReceipt, getScreening} from "./genlayer.mjs";
import {createChatCompletion, llmApiConfigured} from "./llmApi.mjs";

const AUDIT_SYSTEM = `You are a rigorous technical recruiter. Analyze the candidate against the job.
Respond with ONLY a JSON object, no markdown, with exactly these keys:
verdict ("STRONG_FIT" | "PARTIAL_FIT" | "NOT_FIT"), match_score (integer 0-100),
seniority ("Junior" | "Mid" | "Senior" | "Staff+"), matched_skills (array of strings),
missing_skills (array of strings), explanation (string, max 120 words), confidence (integer 0-100).`;

const clamp = (value, fallback = 0) => {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, Math.min(100, n));
};

function normalizeVerdict(raw) {
  const v = String(raw || "").toLowerCase();
  if (v.includes("strong")) return "STRONG_FIT";
  if (v.includes("partial")) return "PARTIAL_FIT";
  if (v.includes("not") || v.includes("no_fit") || v.includes("reject")) return "NOT_FIT";
  return String(raw || "Unknown").toUpperCase();
}

function normalizeSeniority(raw) {
  const v = String(raw || "").toLowerCase();
  if (v.includes("staff") || v.includes("lead")) return "Staff+";
  if (v.includes("senior") || v === "senior" || v === "sr") return "Senior";
  if (v.includes("mid")) return "Mid";
  if (v.includes("junior") || v.includes("entry")) return "Junior";
  return String(raw || "Unknown");
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("LLM did not return JSON");
  let parsed;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch (error) {
    throw new Error(`LLM returned malformed JSON: ${error.message}`);
  }
  if (typeof parsed !== "object" || parsed === null) throw new Error("LLM did not return a JSON object");
  return {
    verdict: normalizeVerdict(parsed.verdict),
    match_score: clamp(parsed.match_score),
    seniority: normalizeSeniority(parsed.seniority),
    matched_skills: Array.isArray(parsed.matched_skills) ? parsed.matched_skills.map(String) : [],
    missing_skills: Array.isArray(parsed.missing_skills) ? parsed.missing_skills.map(String) : [],
    explanation: String(parsed.explanation || ""),
    confidence: clamp(parsed.confidence),
  };
}

function localScreeningId(input) {
  return `local-${crypto.createHash("sha256").update(input).digest("hex").slice(0, 24)}`;
}

export async function runAudit({jobTitle, jobDescription, mustHaveSkills, resumeText, payer, adapter, systemPrompt, userPrompt}) {
  const selected = adapter || process.env.NEXA_AI_ADAPTER || (process.env.GENLAYER_PRIVATE_KEY ? "genlayer" : "llm");

  if (selected === "genlayer") {
    const client = getGenLayerClient();
    const tx = await submitScreening(client, {jobTitle, jobDescription: jobDescription || "", mustHaveSkills: mustHaveSkills || "", resumeText, userWalletAddress: payer});
    const receipt = await waitForReceipt(client, tx);
    const screeningId = getScreeningIdFromReceipt(receipt);
    const results = await getScreening(client, screeningId);
    return {adapter: "genlayer", execution: {type: "genlayer", tx}, screeningId, results};
  }

  if (selected !== "llm") throw new Error(`unknown AI adapter: ${selected}`);
  if (!llmApiConfigured()) throw new Error("LLM adapter requires NEXA_LLM_API_KEY");

  const prompt = `Job title: ${jobTitle}
Job description: ${jobDescription || "n/a"}
Required skills: ${mustHaveSkills || "n/a"}
Candidate resume:
${resumeText}`;
  const messages = [
    {role: "system", content: systemPrompt || AUDIT_SYSTEM},
    {role: "user", content: userPrompt || prompt},
  ];
  let lastError = null;
  let success = null;
  for (let attempt = 1; attempt <= 2 && !success; attempt++) {
    try {
      const call = await createChatCompletion(messages, {maxTokens: 800});
      const results = systemPrompt || userPrompt ? JSON.parse(call.content.slice(call.content.indexOf("{"), call.content.lastIndexOf("}") + 1)) : extractJson(call.content);
      success = {call, results};
    } catch (error) {
      lastError = error;
      messages.push({role: "assistant", content: "Understood."});
      messages.push({role: "user", content: "Your previous reply was not a single valid JSON object. Return ONLY the JSON object now, no markdown, no prose."});
    }
  }
  if (!success) throw lastError || new Error("llm_audit_failed");

  const screeningId = localScreeningId(`${jobTitle}:${resumeText}`);
  return {
    adapter: "llm",
    execution: {
      type: "llm-api",
      model: success.call.model,
    },
    screeningId,
    results: success.results,
  };
}
