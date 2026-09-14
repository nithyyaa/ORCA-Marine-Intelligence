import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        {
          error: "Valid lat and lon are required",
        },
        { status: 400 }
      );
    }

    const zones = await db.execute(sql`
      SELECT
        zone_id,
        latitude,
        longitude,
        sector,
        year,
        julian_day,
        length_km,
        source,
        ROUND(
          (
            ST_Distance(
              location::geography,
              ST_SetSRID(
                ST_MakePoint(${lon}, ${lat}),
                4326
              )::geography
            ) / 1000
          )::numeric,
          2
        ) AS distance_km
      FROM pfz_zones
      WHERE location IS NOT NULL
      ORDER BY location <-> ST_SetSRID(
        ST_MakePoint(${lon}, ${lat}),
        4326
      )
      LIMIT 10;
    `);

    return NextResponse.json({
      success: true,
      location: {
        latitude: lat,
        longitude: lon,
      },
      count: zones.length,
      zones,
    });
  } catch (error) {
    console.error("Nearby PFZ error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to find nearby PFZ zones",
      },
      { status: 500 }
    );
  }
}