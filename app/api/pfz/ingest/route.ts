import { NextResponse } from "next/server";
import { db } from "@/db";
import { pfzZones } from "@/db/schema";
import { sql } from "drizzle-orm";

const PFZ_URL =
  "https://incois.gov.in/geoserver/PFZ_Automation/wfs" +
  "?service=WFS" +
  "&version=1.1.0" +
  "&request=GetFeature" +
  "&typeName=PFZ_Automation%3Apfzlines" +
  "&outputFormat=application/json" +
  "&srsName=EPSG%3A4326";

function isValidCoordinate(lat: unknown, lon: unknown) {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export async function POST() {
  try {
    console.log("PFZ ingestion started...");

    const response = await fetch(PFZ_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `INCOIS PFZ request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    const features = Array.isArray(data.features)
      ? data.features
      : [];

    if (!features.length) {
      return NextResponse.json({
        success: true,
        source: "INCOIS",
        fetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        message: "INCOIS returned no PFZ features",
      });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const feature of features) {
      try {
        /*
         * INCOIS PFZ features are line geometries.
         * pfz_zones stores a representative Point.
         *
         * We use the midpoint of the valid PFZ line
         * as the spatial representative point.
         */
        const rawCoordinates =
          feature.geometry?.coordinates?.flat(1) ?? [];

        const points = rawCoordinates.filter(
          (point: unknown) =>
            Array.isArray(point) &&
            point.length >= 2 &&
            Number.isFinite(Number(point[0])) &&
            Number.isFinite(Number(point[1]))
        );

        if (!points.length) {
          skipped++;
          continue;
        }

        const middlePoint =
          points[Math.floor(points.length / 2)];

        const longitude = Number(middlePoint[0]);
        const latitude = Number(middlePoint[1]);

        if (!isValidCoordinate(latitude, longitude)) {
          skipped++;
          continue;
        }

        const uid = feature.properties?.UID;

        const zoneId = uid
          ? `PFZ-${String(uid)}`
          : feature.id
            ? String(feature.id)
            : null;

        if (!zoneId) {
          skipped++;
          continue;
        }

        const sector =
          feature.properties?.SECTORNAME != null
            ? String(feature.properties.SECTORNAME)
            : null;

        const yearValue = Number(
          feature.properties?.Year
        );

        const year = Number.isFinite(yearValue)
          ? yearValue
          : null;

        const julianDay =
          feature.properties?.Julian_day != null
            ? String(feature.properties.Julian_day)
            : null;

        const lengthValue = Number(
          feature.properties?.Length
        );

        const lengthKm = Number.isFinite(lengthValue)
          ? lengthValue
          : null;

        /*
         * Check whether the zone already exists.
         * We do this explicitly so the response can distinguish
         * inserted vs updated records.
         */
        const existing = await db.execute(sql`
          SELECT zone_id
          FROM pfz_zones
          WHERE zone_id = ${zoneId}
          LIMIT 1
        `);

        if (existing.length > 0) {
          await db.execute(sql`
            UPDATE pfz_zones
            SET
              latitude = ${latitude},
              longitude = ${longitude},
              location = ST_SetSRID(
                ST_MakePoint(
                  ${longitude},
                  ${latitude}
                ),
                4326
              ),
              sector = ${sector},
              year = ${year},
              julian_day = ${julianDay},
              length_km = ${lengthKm},
              source = ${"INCOIS PFZ Web Feature Service"},
              observed_at = NOW(),
              status = ${"ACTIVE"}
            WHERE zone_id = ${zoneId}
          `);

          updated++;
        } else {
          await db.execute(sql`
            INSERT INTO pfz_zones (
              zone_id,
              latitude,
              longitude,
              location,
              sector,
              year,
              julian_day,
              length_km,
              source,
              observed_at,
              status
            )
            VALUES (
              ${zoneId},
              ${latitude},
              ${longitude},
              ST_SetSRID(
                ST_MakePoint(
                  ${longitude},
                  ${latitude}
                ),
                4326
              ),
              ${sector},
              ${year},
              ${julianDay},
              ${lengthKm},
              ${"INCOIS PFZ Web Feature Service"},
              NOW(),
              ${"ACTIVE"}
            )
          `);

          inserted++;
        }
      } catch (featureError) {
        console.error(
          "PFZ feature ingestion error:",
          featureError
        );

        skipped++;
      }
    }

    console.log(
      `PFZ ingestion completed. Fetched: ${features.length}, Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`
    );

    return NextResponse.json({
      success: true,
      source: "INCOIS",
      fetched: features.length,
      inserted,
      updated,
      skipped,
      totalStored: inserted + updated,
      observedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PFZ ingestion failed:", error);

    return NextResponse.json(
      {
        success: false,
        source: "INCOIS",
        error: "PFZ ingestion failed",
      },
      { status: 500 }
    );
  }
}