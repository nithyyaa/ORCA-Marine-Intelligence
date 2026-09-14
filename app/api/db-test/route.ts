import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
  try {
    const result = await db.execute(
      sql`SELECT current_database() AS database, PostGIS_Version() AS postgis`
    );

    return NextResponse.json({
      connected: true,
      database: result[0]?.database,
      postgis: result[0]?.postgis,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        connected: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}