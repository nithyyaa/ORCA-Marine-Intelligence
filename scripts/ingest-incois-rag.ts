import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
  override: true,
});

import OpenAI from "openai";
import postgres from "postgres";


const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured");
}

const sql = postgres(DATABASE_URL);

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

const SOURCES = [
  {
    url: "https://www.incois.gov.in/oceanservices/osfforecast.jsp",
    title: "INCOIS Ocean State Forecast - Live Forecast",
  },
  {
    url: "https://www.incois.gov.in/site/services/osf.jsp",
    title: "INCOIS Ocean State Forecast - Service Information",
  },
];

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&deg;/gi, "°")
    .replace(/&times;/gi, "×")
    .replace(/\s+/g, " ")
    .trim();
}

function extractForecastMetadata(text: string): string {
  const patterns = [
    /Wind Speed[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /Surface Current Speed[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /Significant Wave Height[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /Swell Height[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /Wave Period[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /Swell Period[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /Sea Surface Temperature[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /Mixed Layer Depth[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
    /D20[\s\S]{0,180}?Issued on[\s\S]{0,60}/i,
  ];

  const matches: string[] = [];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[0]) {
      matches.push(match[0].replace(/\s+/g, " ").trim());
    }
  }

  return matches.join("\n");
}

function buildKnowledgeDocument(
  liveText: string,
  serviceText: string
): string {
  const metadata = extractForecastMetadata(liveText);

  return `
INCOIS OCEAN STATE FORECAST (OSF)

Source:
Indian National Centre for Ocean Information Services (INCOIS),
Ministry of Earth Sciences, Government of India.

Ocean State Forecast provides marine forecast information for
ocean waves, winds, currents, water temperature and related
ocean-state parameters.

The INCOIS OSF service supports fishermen, the Indian Navy,
Indian Coast Guard, shipping agencies, offshore industries,
research organisations and coastal communities.

Forecast parameters include:

1. Wind speed and direction.
2. Significant wave height.
3. Wave period.
4. Swell height.
5. Swell period.
6. Surface current speed and direction.
7. Sea surface temperature.
8. Mixed Layer Depth (MLD).
9. D20, the depth of the 20-degree isotherm.

INCOIS describes significant wave height as the average height
of the highest one-third of waves in a wave spectrum.

Wave period represents the average time between consecutive
wave crests passing a fixed point.

Swell height represents the significant wave height of swell
waves.

Swell period represents the mean period of swell waves.

Current speed represents the magnitude of water movement.

Sea Surface Temperature represents the temperature of seawater
near the ocean surface.

Mixed Layer Depth represents the depth of the ocean's upper
well-mixed layer.

D20 represents the depth of the 20-degree Celsius isotherm.

INCOIS states that OSF forecasts are produced using numerical
ocean models and observations. Forecast products are provided
for regional and coastal domains as well as specific locations.

CURRENT LIVE INCOIS FORECAST METADATA:

${metadata || "Current forecast metadata was not available in the page text."}

ADDITIONAL CURRENT SOURCE TEXT:

${serviceText.slice(0, 7000)}
`.trim();
}

function chunkText(text: string, maxLength = 1800): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (
      current &&
      current.length + paragraph.length + 1 > maxLength
    ) {
      chunks.push(current.trim());
      current = "";
    }

    current += `${paragraph}\n`;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

async function fetchSource(url: string): Promise<string> {
  console.log(`Fetching ${url}...`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "ORCA-Marine-Intelligence/1.0",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `INCOIS request failed: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  console.log(`Downloaded ${html.length} characters.`);

  const text = cleanHtml(html);

  console.log(`Cleaned text: ${text.length} characters.`);

  return text;
}

async function main() {
  console.log("======================================");
  console.log("ORCA INCOIS RAG INGESTION");
  console.log("======================================");

  const liveText = await fetchSource(SOURCES[0].url);

  const serviceText = await fetchSource(SOURCES[1].url);

  if (!liveText || !serviceText) {
    throw new Error("INCOIS returned insufficient readable text.");
  }

  const knowledgeDocument = buildKnowledgeDocument(
    liveText,
    serviceText
  );

  const chunks = chunkText(knowledgeDocument);

  console.log(`Created ${chunks.length} knowledge chunks.`);

  /*
   * Remove the previous INCOIS RAG records.
   *
   * This prevents the old UI/navigation-only chunks from
   * remaining in the database.
   */
  await sql.unsafe(
    `DELETE FROM rag_documents WHERE source LIKE '%incois.gov.in%'`
  );

  console.log("Removed previous INCOIS RAG records.");

  let inserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(
      `Embedding chunk ${i + 1}/${chunks.length}...`
    );

    const embedding = await createEmbedding(chunk);

    const embeddingLiteral = `[${embedding.join(",")}]`;

    await sql.unsafe(
      `
      INSERT INTO rag_documents
        (content, source, title, embedding)
      VALUES
        ($1, $2, $3, $4::vector)
      `,
      [
        chunk,
        SOURCES[0].url,
        "INCOIS Ocean State Forecast",
        embeddingLiteral,
      ]
    );

    inserted++;
  }

  console.log("--------------------------------------");
  console.log(`Successfully inserted ${inserted} RAG documents.`);
  console.log("--------------------------------------");

  await sql.end();
}

main().catch(async (error) => {
  console.error("RAG ingestion failed:");
  console.error(error);

  try {
    await sql.end();
  } catch {}

  process.exit(1);
});