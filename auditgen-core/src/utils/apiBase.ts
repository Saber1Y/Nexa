// Base URL for the Nexa BOT bridge.
// Production/Vercel serves the API on the same origin (rewritten to the serverless function),
// so the default is empty; Vite dev serves the UI on :8080 while the bridge runs on :3402.
const configured = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

export const API_BASE = configured || (import.meta.env.DEV ? "http://localhost:3402" : "");

export const apiEndpoint = (path: string) => `${API_BASE}${path}`;
