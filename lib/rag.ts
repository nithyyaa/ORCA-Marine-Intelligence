import OpenAI from "openai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { ragDocuments } from "@/db/schema";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export type RagResult = {
  id: number;
  content: string;
  source: string;
  title: string | null;
  similarity: number;
};

/*
 * Create the OpenAI client only when an embedding is actually requested.
 *
 * This prevents the entire ORCA API route from crashing during module
 * import when OPENAI_API_KEY is not configured.
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. RAG embeddings are unavailable."
    );
  }

  return new OpenAI({
    apiKey,
  });
}

export async function createEmbedding(text: string): Promise<number[]> {
  const input = text.trim();

  if (!input) {
    throw new Error("Cannot create an embedding for empty text");
  }

  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

export async function searchRag(
  query: string,
  limit = 5,
  minimumSimilarity = 0.2
): Promise<RagResult[]> {
  const embedding = await createEmbedding(query);

  const embeddingLiteral = `[${embedding.join(",")}]`;

  const results = await db.execute(sql`
    SELECT
      id,
      content,
      source,
      title,
      1 - (embedding <=> ${embeddingLiteral}::vector) AS similarity
    FROM rag_documents
    WHERE 1 - (embedding <=> ${embeddingLiteral}::vector) > ${minimumSimilarity}
    ORDER BY embedding <=> ${embeddingLiteral}::vector
    LIMIT ${limit}
  `);

  return results as unknown as RagResult[];
}