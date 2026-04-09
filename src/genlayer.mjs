import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import { privateKeyToAccount } from "viem/accounts";

export function getGenLayerClient(account) {
  const finalAccount = account || (process.env.GENLAYER_PRIVATE_KEY ? privateKeyToAccount(process.env.GENLAYER_PRIVATE_KEY) : undefined);
  
  if (!finalAccount) {
    throw new Error("No GenLayer account provided and GENLAYER_PRIVATE_KEY not found in .env");
  }

  return createClient({
    chain: Object.assign({}, studionet, { rpcUrls: { default: { http: [process.env.GENLAYER_RPC_URL] } } }),
    account: finalAccount,
  });
}

export async function submitScreening(
  client,
  { jobTitle, jobDescription, mustHaveSkills, resumeText, userWalletAddress }
) {
  const hash = await client.writeContract({
    address: process.env.GENLAYER_CONTRACT_ADDRESS,
    functionName: "submit_screening",
    args: [
      jobTitle,
      jobDescription,
      mustHaveSkills,
      resumeText,
      userWalletAddress,
    ],
    value: 0n,
  });
  return hash;
}

export async function waitForReceipt(client, hash) {
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 100,
    interval: 5000,
    fullTransaction: true,
  });

  if (receipt?.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error("The audit was finalized, but contract execution failed. Check the GenLayer Explorer for details.");
  }

  // Handle Undetermined consensus — validators could not agree on equivalent results
  const consensusResult = receipt?.consensus_data?.final?.consensus_result
    || receipt?.consensus_data?.consensus_result
    || receipt?.consensus_result;

  if (consensusResult && String(consensusResult).toLowerCase() === "undetermined") {
    const error = new Error(
      "AI Consensus Undetermined — the 5 validators could not reach agreement on this audit. " +
      "This can happen with ambiguous or edge-case inputs. Please refine your job details and try again."
    );
    error.code = "CONSENSUS_UNDETERMINED";
    error.genLayerHash = hash;
    throw error;
  }

  return receipt;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractAuditId(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const directMatch = trimmed.match(/AUDIT-[A-Za-z0-9_-]+/i);
  if (directMatch) {
    return directMatch[0];
  }

  const unquoted = trimmed.replace(/^['"]+|['"]+$/g, "");
  const unquotedMatch = unquoted.match(/AUDIT-[A-Za-z0-9_-]+/i);
  if (unquotedMatch) {
    return unquotedMatch[0];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      return extractAuditId(parsed);
    }
  } catch {
    return null;
  }

  return null;
}

function coerceScreeningId(value) {
  if (typeof value === "string") {
    return extractAuditId(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = coerceScreeningId(item);
      if (candidate) {
        return candidate;
      }
    }
  }

  if (value && typeof value === "object") {
    for (const key of ["screening_id", "screeningId", "readable", "payload", "value", "result"]) {
      const candidate = coerceScreeningId(value[key]);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

export function getScreeningIdFromReceipt(receipt) {
  const leaderReceipts = Array.isArray(receipt?.consensus_data?.leader_receipt)
    ? receipt.consensus_data.leader_receipt
    : receipt?.consensus_data?.leader_receipt
      ? [receipt.consensus_data.leader_receipt]
      : [];

  // Prioritize consensus leader receipts (actual contract return value)
  const consensusCandidates = leaderReceipts.map((entry) => entry?.result);
  
  const candidates = [
    ...consensusCandidates,
    receipt?.screening_id,
    receipt?.screeningId,
    receipt?.value,
    receipt?.result,
    receipt?.data?.result,
    ...leaderReceipts.map((entry) => entry?.result?.payload),
    ...leaderReceipts.map((entry) => entry?.result?.payload?.readable),
  ];

  for (const candidate of candidates) {
    const screeningId = coerceScreeningId(candidate);
    if (screeningId) {
      return screeningId;
    }
  }

  throw new Error("Could not determine the screening ID from the finalized transaction receipt.");
}

export async function getScreening(client, screeningId) {
  let result = null;
  let retries = 3;

  while (retries > 0 && !result) {
    try {
      await sleep(1500);

      result = await client.readContract({
        address: process.env.GENLAYER_CONTRACT_ADDRESS,
        functionName: "get_screening",
        args: [screeningId],
        transactionHashVariant: "latest-final", // Wait for consensus block
      });

      if (result) {
        return normalizeResult(result);
      }
    } catch (e) {
      const message = typeof e?.message === "string" ? e.message.toLowerCase() : "";
      retries -= 1;

      if ((!message.includes("execution failed") && !message.includes("missing or invalid parameters")) || retries === 0) {
        throw e;
      }

      console.warn(`get_screening retry ${3 - retries}: finalized state not ready yet, retrying...`, e);
      await sleep(2000);
    }
  }

  throw new Error("Failed to fetch screening results after multiple retries.");
}

function normalizeResult(raw) {
  if (raw && typeof raw === "object") {
    return {
      match_score: typeof raw.score === 'number' ? raw.score : (raw.match_score ?? 0),
      verdict: raw.verdict ?? "Unknown",
      seniority: raw.seniority_estimate ?? raw.seniority ?? "Unknown",
      matched_skills: raw.matched_skills ?? [],
      missing_skills: raw.missing_skills ?? [],
      explanation: raw.explanation ?? raw.key_achievement ?? raw.key_highlight ?? "No explanation available.",
      confidence: raw.confidence ?? 0
    };
  }
  if (typeof raw === "string") {
    try {
      return normalizeResult(JSON.parse(raw));
    } catch {
      return { match_score: 0, verdict: "Unknown", seniority: "Unknown", matched_skills: [], missing_skills: [], explanation: raw };
    }
  }
  return raw;
}
