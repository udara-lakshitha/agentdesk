import { createGeminiProvider } from "../agent/geminiProvider";

async function main() {
  const llm = createGeminiProvider();
  const answer = await llm.generateText(
    "In one sentence, what is a customer support agent?"
  );
  console.log(answer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});