import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid latitude and longitude are required",
        },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coordinates",
        },
        { status: 400 }
      );
    }

    const result = await db.execute(sql`
  SELECT
    boundary_id,
    name,
    country,
    boundary_type,
    source,
    source_date,

    ST_Intersects(
      geometry,
      ST_SetSRID(
        ST_MakePoint(${lon}, ${lat}),
        4326
      )
    ) AS inside_eez,

    ST_Distance(
      ST_Boundary(geometry)::geography,
      ST_SetSRID(
        ST_MakePoint(${lon}, ${lat}),
        4326
      )::geography
    ) AS distance_to_boundary_meters

  FROM (
    SELECT
      boundary_id,
      name,
      country,
      boundary_type,
      geometry,
      source,
      source_date
    FROM marine_boundaries
    WHERE boundary_type = 'EEZ'
    ORDER BY
      geometry <-> ST_SetSRID(
        ST_MakePoint(${lon}, ${lat}),
        4326
      )
    LIMIT 1
  ) AS nearest_boundary
`);
    const rows = Array.from(result);

    if (!rows.length) {
      return NextResponse.json({
        success: true,
        insideEEZ: false,

        location: {
          latitude: lat,
          longitude: lon,
        },

        boundary: null,

        distanceToBoundaryMeters: null,
        distanceToBoundaryKm: null,

        warning: "NO_BOUNDARY_DATA",

        source: "Marine Regions World EEZ v12",
        datasetDate: "2023-10-25",
      });
    }

    const boundary = rows[0];

    const insideEEZ = Boolean(boundary.inside_eez);

    const distanceMeters =
      boundary.distance_to_boundary_meters !== null
        ? Number(boundary.distance_to_boundary_meters)
        : null;

    const distanceKm =
      distanceMeters !== null
        ? Number((distanceMeters / 1000).toFixed(2))
        : null;

    let warning = "SAFE";

    if (!insideEEZ) {
      warning = "OUTSIDE_EEZ";
    } else if (distanceMeters !== null && distanceMeters <= 5000) {
      warning = "CRITICAL";
    } else if (distanceMeters !== null && distanceMeters <= 25000) {
      warning = "HIGH";
    } else if (distanceMeters !== null && distanceMeters <= 100000) {
      warning = "MODERATE";
    }

    return NextResponse.json({
      success: true,

      insideEEZ,

      location: {
        latitude: lat,
        longitude: lon,
      },

      boundary: {
        boundaryId: boundary.boundary_id,
        name: boundary.name,
        country: boundary.country,
        type: boundary.boundary_type,
      },

      distanceToBoundaryMeters: distanceMeters,
      distanceToBoundaryKm: distanceKm,

      warning,

      source: boundary.source,
      datasetDate: boundary.source_date,
    });
  } catch (error) {
    console.error("Geofence API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to perform geofence check",
      },
      { status: 500 }
    );
  }
}