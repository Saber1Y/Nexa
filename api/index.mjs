import app from "../src/server.mjs";

// Vercel handles the listener, so we just export the app
export default app;

// Direct gateway payment verification, AI inference, and receipt writes can exceed
// the platform default function duration.
export const config = {
  maxDuration: 60,
};
