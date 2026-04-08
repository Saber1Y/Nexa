import "dotenv/config";
import { getGenLayerClient, getScreening } from "../src/genlayer.mjs";

async function main() {
  const client = getGenLayerClient();
  
  const ids = ["AUDIT-16", "AUDIT-17"];
  
  for (const id of ids) {
    console.log(`\n🔍 Fetching ${id}...`);
    try {
      const result = await getScreening(client, id);
      console.log(`Final Normalized Result for ${id}:`, JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(`Error fetching ${id}:`, e.message);
    }
  }
}

main().catch(console.error);
