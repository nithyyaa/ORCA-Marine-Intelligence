import { NextResponse } from "next/server";
import { searchRag } from "@/lib/rag";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({
      available: false,
      results: [],
      message: "Enter a marine knowledge query to search the ORCA knowledge base.",
    });
  }

  try {
    const results = await searchRag(query, 6, 0.35);

    return NextResponse.json({
      available: results.length > 0,
      results: results.map((doc) => ({
        title: doc.title ?? "Marine document",
        content: doc.content ?? "",
        source: doc.source ?? "Unknown source",
        similarity: Number.isFinite(Number(doc.similarity))
          ? Number(doc.similarity)
          : null,
      })),
      retrievedAt: new Date().toISOString(),
      source: "ORCA Marine Knowledge Base",
    });
  } catch (error) {
    console.error("Knowledge search failed:", error);

    return NextResponse.json(
      {
        available: false,
        results: [],
        message: "The marine knowledge service is temporarily unavailable.",
      },
      { status: 503 }
    );
  }
}
