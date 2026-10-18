import { createGeminiAgentLlm } from "../agent/geminiAgentLlm";
import { runAgent } from "../agent/runAgent";

async function main() {
  const message = process.argv[2] ?? "Where is my order 1001? When will it arrive?";
  const result = await runAgent(createGeminiAgentLlm(), message);
  console.log("STEPS:", JSON.stringify(result.steps, null, 2));
  console.log("REPLY:", result.reply);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});