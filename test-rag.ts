import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const { createEmbedding, searchRag } = await import("./lib/rag");

  console.log("Creating test embedding...");

  const embedding = await createEmbedding(
    "What is an Ocean State Forecast?"
  );

  console.log("Embedding dimensions:", embedding.length);

  console.log("Testing vector search...");

  const results = await searchRag(
    "What is an Ocean State Forecast?",
    5,
    0
  );

  console.log("Results:", results);
}

main().catch((error) => {
  console.error("ERROR:", error);
  process.exit(1);
});
