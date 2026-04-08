import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

async function main() {
  console.log("\n🔐  Generating GenLayer Private Key...");
  
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  console.log(`  Public Address : ${account.address}`);
  console.log(`  Private Key    : ${privateKey.slice(0, 6)}... (saved to .env)`);

  let env = readFileSync(envPath, "utf-8");
  
  if (env.includes("GENLAYER_PRIVATE_KEY")) {
    console.log("  ⚠️  GENLAYER_PRIVATE_KEY already exists. Skipping.");
    return;
  }

  // Find the GenLayer section or append
  const entry = `GENLAYER_PRIVATE_KEY=${privateKey}\nGENLAYER_ADDRESS=${account.address}\n`;
  
  if (env.includes("# ─── GenLayer ───")) {
    env = env.replace("# ─── GenLayer ───", `# ─── GenLayer ───\n${entry}`);
  } else {
    env += `\n# ─── GenLayer ───\n${entry}`;
  }

  writeFileSync(envPath, env, "utf-8");
  console.log("  ✅ Generated and saved to .env\n");
}

main().catch(console.error);
