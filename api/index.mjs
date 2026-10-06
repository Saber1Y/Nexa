import app from "../src/server.mjs";

// Vercel handles the listener, so we just export the app
export default app;

// The x402 flow settles on-chain and then executes the AI service,
// which routinely takes longer than the platform default.
export const config = {
  maxDuration: 60,
};
