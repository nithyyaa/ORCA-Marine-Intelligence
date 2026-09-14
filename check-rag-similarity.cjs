require("dotenv").config({ path: ".env.local" });

const postgres = require("postgres");
const OpenAI = require("openai");

const sql = postgres(process.env.DATABASE_URL);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "What is an Ocean State Forecast?",
    dimensions: 1536,
  });

  const embedding = embeddingResponse.data[0].embedding;
  const embeddingLiteral = `[${embedding.join(",")}]`;

  const results = await sql.unsafe(
    `
    SELECT
      id,
      title,
      1 - (embedding <=> $1::vector) AS similarity
    FROM rag_documents
    ORDER BY embedding <=> $1::vector
    `,
    [embeddingLiteral]
  );

  console.log(results);

  await sql.end();
}

main().catch(async (error) => {
  console.error("ERROR:", error.message);
  await sql.end();
  process.exit(1);
});
