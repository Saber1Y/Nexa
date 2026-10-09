// Base URL for the Nexa BOT bridge.
// Production/Vercel serves the API on the same origin (rewritten to the serverless function),
// so the default is empty; local Vite mode files point at the bridge on :3403.
const configured = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

export const API_BASE = configured || (import.meta.env.DEV ? "http://localhost:3403" : "");

export const apiEndpoint = (path: string) => `${API_BASE}${path}`;
