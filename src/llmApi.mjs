const API_KEY = process.env.NEXA_LLM_API_KEY || "";
const BASE_URL = (process.env.NEXA_LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const MODEL = process.env.NEXA_LLM_MODEL || "gpt-4o-mini";
const GEMINI_NATIVE = BASE_URL.includes("generativelanguage.googleapis.com") && !BASE_URL.endsWith("/openai");

export function llmApiConfigured() {
  return Boolean(API_KEY);
}

export async function createChatCompletion(messages, {maxTokens = 800} = {}) {
  if (!API_KEY) throw new Error("NEXA_LLM_API_KEY is not configured");

  const systemText = messages
    .filter(message => message.role === "system" || message.role === "developer")
    .map(message => message.content)
    .join("\n\n");
  const conversation = messages
    .filter(message => message.role !== "system" && message.role !== "developer")
    .map(message => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{text: message.content}],
    }));
  const url = GEMINI_NATIVE
    ? `${BASE_URL}/models/${encodeURIComponent(MODEL)}:generateContent`
    : `${BASE_URL}/chat/completions`;
  const headers = GEMINI_NATIVE
    ? {"x-goog-api-key": API_KEY, "Content-Type": "application/json"}
    : {Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json"};
  const body = GEMINI_NATIVE
    ? {
        ...(systemText ? {systemInstruction: {parts: [{text: systemText}]}} : {}),
        contents: conversation,
        generationConfig: {
          maxOutputTokens: maxTokens,
          thinkingConfig: {thinkingLevel: "low"},
        },
      }
    : {model: MODEL, messages, max_tokens: maxTokens, temperature: 0.2};

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    throw new Error(`LLM API request failed: ${message}`);
  }

  const content = GEMINI_NATIVE
    ? payload?.candidates?.[0]?.content?.parts
      ?.filter(part => typeof part.text === "string" && !part.thought)
      .map(part => part.text)
      .join("")
    : payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("LLM API returned no message content");
  return {content, model: payload.model || payload.modelVersion || MODEL};
}
