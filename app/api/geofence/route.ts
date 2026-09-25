import { NextResponse } from "next/server";

import { db } from "@/db";

import { sql } from "drizzle-orm";



type ZoneWarning =

  | "VIOLATION"

  | "CRITICAL"

  | "HIGH"

  | "MODERATE"

  | "SAFE"

  | "UNAVAILABLE";



type ZoneStatus =

  | "INSIDE"

  | "APPROACHING"

  | "OUTSIDE"

  | "UNAVAILABLE";



type BoundaryRow = {

  boundary_id: string | number;

  name: string | null;

  country: string | null;

  boundary_type: string;

  source: string | null;

  source_date: string | Date | null;

  inside_zone: boolean;

  distance_to_boundary_meters: number | string | null;

  geometry_geojson: string | null;

};



const SUPPORTED_ZONE_TYPES = [

  "EEZ",

  "RESTRICTED",

  "MPA",

  "ECOLOGICALLY_SENSITIVE",

  "OPERATIONAL",

  "HAZARD",

] as const;



function normalizeZoneType(value: unknown): string {

  return String(value ?? "").trim().toUpperCase();

}



function warningForZone(

  inside: boolean,

  distanceMeters: number | null,

  zoneType: string

): ZoneWarning {

  // Being inside the EEZ is normal and must NOT be called a violation.

  // A true violation applies to controlled/restricted zone types only.

  const violationTypes = new Set([

    "RESTRICTED",

    "MPA",

    "ECOLOGICALLY_SENSITIVE",

    "OPERATIONAL",

    "HAZARD",

  ]);



  if (inside && violationTypes.has(zoneType)) return "VIOLATION";

  if (inside) return "SAFE";

  if (distanceMeters === null) return "UNAVAILABLE";

  if (distanceMeters <= 5_000) return "CRITICAL";

  if (distanceMeters <= 25_000) return "HIGH";

  if (distanceMeters <= 100_000) return "MODERATE";



  return "SAFE";

}



function toNumberOrNull(value: unknown): number | null {

  if (value === null || value === undefined || value === "") {

    return null;

  }



  const number = Number(value);



  return Number.isFinite(number) ? number : null;

}



function toIsoOrNull(value: unknown): string | null {

  if (value === null || value === undefined) {

    return null;

  }



  if (value instanceof Date) {

    return value.toISOString();

  }



  const text = String(value);



  return text || null;

}



function parseGeometry(value: unknown): unknown {

  if (!value) return null;



  try {

    return JSON.parse(String(value));

  } catch {

    return null;

  }

}



function mapZone(row: BoundaryRow) {

  const type = normalizeZoneType(row.boundary_type);

  const inside = Boolean(row.inside_zone);

  const distanceMeters = toNumberOrNull(

    row.distance_to_boundary_meters

  );



  const warning = warningForZone(

    inside,

    distanceMeters,

    type

  );



  const status: ZoneStatus = inside

    ? "INSIDE"

    : distanceMeters === null

      ? "UNAVAILABLE"

      : distanceMeters <= 100_000

        ? "APPROACHING"

        : "OUTSIDE";



  const violation = warning === "VIOLATION";



  return {

    boundaryId: row.boundary_id,

    name: row.name,

    country: row.country,

    type,

    source: row.source,

    datasetDate: toIsoOrNull(row.source_date),

    inside,

    distanceToBoundaryMeters: distanceMeters,

    distanceToBoundaryKm:

      distanceMeters !== null

        ? Number((distanceMeters / 1000).toFixed(2))

        : null,

    warning,

    status,

    violation,

    geometry: parseGeometry(row.geometry_geojson),

  };

}



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



    if (

      lat < -90 ||

      lat > 90 ||

      lon < -180 ||

      lon > 180

    ) {

      return NextResponse.json(

        {

          success: false,

          error: "Invalid coordinates",

        },

        { status: 400 }

      );

    }



    /*

     * PERFORMANCE NOTE

     *

     * The previous unified implementation serialized every EEZ

     * MultiPolygon with ST_AsGeoJSON() and calculated an exact

     * geography distance for every boundary. The Marine Regions

     * EEZ geometries are detailed, so that made the endpoint very

     * slow.

     *

     * This version keeps PostGIS as the source of truth but:

     * 1. Gets available zone types separately.

     * 2. Checks exact intersections first.

     * 3. If outside, uses PostGIS geometry KNN (<->) to obtain a

     *    small nearest-candidate set.

     * 4. Calculates exact boundary distance only for those candidates.

     * 5. Serializes GeoJSON only for the returned relevant zones.

     *

     * No database data is changed.

     */



    const point = sql`

      ST_SetSRID(

        ST_MakePoint(${lon}, ${lat}),

        4326

      )

    `;



    // Fast metadata query: tells us which zone types really exist.

    const typeResult = await db.execute(sql`

      SELECT DISTINCT

        UPPER(TRIM(boundary_type)) AS boundary_type

      FROM marine_boundaries

      WHERE status = 'valid'

        AND boundary_type IS NOT NULL

    `);



    const availableZoneTypes = Array.from(typeResult as any)

      .map((row: any) =>

        normalizeZoneType(row.boundary_type)

      )

      .filter(Boolean);



    const unavailableZoneTypes =

      SUPPORTED_ZONE_TYPES.filter(

        (type) =>

          !availableZoneTypes.includes(type)

      );



    // First check whether the operating point is actually inside

    // any active boundary. This is the most important geofence case.

    const insideResult = await db.execute(sql`

      SELECT

        boundary_id,

        name,

        country,

        boundary_type,

        source,

        source_date,

        TRUE AS inside_zone,



        ST_Distance(

          ST_Boundary(geometry)::geography,

          ${point}::geography

        ) AS distance_to_boundary_meters,



        ST_AsGeoJSON(

          CASE

            WHEN ${url.searchParams.get("geometry")} = 'full'

              THEN geometry

            ELSE ST_SimplifyPreserveTopology(

              geometry,

              0.01

            )

          END

        ) AS geometry_geojson



      FROM marine_boundaries



      WHERE status = 'valid'

        AND ST_Intersects(

          geometry,

          ${point}

        )

    `);



    let rows =

      Array.from(insideResult as any) as BoundaryRow[];



    /*

     * If the point is outside every zone, find a small number of

     * nearest candidates using PostGIS KNN and calculate the exact

     * distance only for those candidates.

     */

    if (rows.length === 0) {

      const candidateResult = await db.execute(sql`

        SELECT

          boundary_id,

          name,

          country,

          boundary_type,

          source,

          source_date,



          FALSE AS inside_zone,



          ST_Distance(

            ST_Boundary(geometry)::geography,

            ${point}::geography

          ) AS distance_to_boundary_meters,



          ST_AsGeoJSON(

            CASE

              WHEN ${url.searchParams.get("geometry")} = 'full'

                THEN geometry

              ELSE ST_SimplifyPreserveTopology(

                geometry,

                0.01

              )

            END

          ) AS geometry_geojson



        FROM marine_boundaries



        WHERE status = 'valid'



        ORDER BY geometry <-> ${point}



        LIMIT 12

      `);



      rows =

        Array.from(candidateResult as any) as BoundaryRow[];

    }



    const zones = rows

      .map(mapZone)

      .sort(

        (a, b) =>

          (a.distanceToBoundaryMeters ??

            Number.POSITIVE_INFINITY) -

          (b.distanceToBoundaryMeters ??

            Number.POSITIVE_INFINITY)

      );



    const insideZones = zones.filter(

      (zone) => zone.inside

    );



    const approachingZones = zones.filter(

      (zone) => zone.status === "APPROACHING"

    );



    const violationZones = zones.filter(

      (zone) => zone.violation

    );



    /*

     * Keep one nearest relevant zone per type in the compact

     * response. This prevents returning dozens of large geometries.

     */

    const nearestByType = new Map<

      string,

      (typeof zones)[number]

    >();



    for (const zone of zones) {

      if (!nearestByType.has(zone.type)) {

        nearestByType.set(zone.type, zone);

      }

    }



    const relevantZones =

      Array.from(nearestByType.values());



    // Legacy EEZ compatibility.

    const eezZones = zones.filter(

      (zone) => zone.type === "EEZ"

    );



    const nearestEEZ = eezZones[0] ?? null;



    const insideEEZ = eezZones.some(

      (zone) => zone.inside

    );



    const distanceToBoundaryMeters =

      nearestEEZ?.distanceToBoundaryMeters ?? null;



    const distanceToBoundaryKm =

      distanceToBoundaryMeters !== null

        ? Number(

            (

              distanceToBoundaryMeters / 1000

            ).toFixed(2)

          )

        : null;



    let warning = "NO_BOUNDARY_DATA";



    if (nearestEEZ) {

      warning = insideEEZ

        ? nearestEEZ.warning

        : "OUTSIDE_EEZ";

    }



    const geometryMode =

      url.searchParams.get("geometry") === "full"

        ? "full"

        : "simplified";



    const geofenceStatus =

      violationZones.length > 0

        ? "VIOLATION"

        : approachingZones.length > 0

          ? "APPROACHING"

          : insideZones.length > 0

            ? "INSIDE"

            : zones.length > 0

              ? "OUTSIDE"

              : "UNAVAILABLE";



    const generatedAt =

      new Date().toISOString();



    return NextResponse.json({

      success: true,



      location: {

        latitude: lat,

        longitude: lon,

      },



      // Existing compatibility response.

      insideEEZ,



      boundary: nearestEEZ

        ? {

            boundaryId:

              nearestEEZ.boundaryId,

            name: nearestEEZ.name,

            country: nearestEEZ.country,

            type: nearestEEZ.type,



            // Existing MarineMap expects boundary.geometry.

            geometry:

              nearestEEZ.geometry,

          }

        : null,



      distanceToBoundaryMeters,

      distanceToBoundaryKm,

      warning,



      /*

       * Only report the actual source stored for the

       * selected boundary. Do not claim an EEZ source when

       * the database does not provide one.

       */

      source:

        nearestEEZ?.source ?? null,



      /*

       * Only report the actual dataset date stored in

       * the database. Do not invent a fallback date.

       */

      datasetDate:

        nearestEEZ?.datasetDate ?? null,



      generatedAt,



      // Geometry is simplified by default so the endpoint stays fast.

      // Exact PostGIS intersection/distance calculations are unchanged.

      geometryMode,



      geofenceStatus,

      violationCount:

        violationZones.length,

      approachingCount:

        approachingZones.length,



      geofencing: {

        engine:

          "PostGIS Unified Geofence Engine",

        prototype: true,



        availableZoneTypes,

        unavailableZoneTypes,



        zoneTypeAvailability: {

          EEZ:

            availableZoneTypes.includes("EEZ"),



          RESTRICTED:

            availableZoneTypes.includes(

              "RESTRICTED"

            ),



          MPA:

            availableZoneTypes.includes("MPA"),



          ECOLOGICALLY_SENSITIVE:

            availableZoneTypes.includes(

              "ECOLOGICALLY_SENSITIVE"

            ),



          OPERATIONAL:

            availableZoneTypes.includes(

              "OPERATIONAL"

            ),



          HAZARD:

            availableZoneTypes.includes(

              "HAZARD"

            ),

        },



        zones: relevantZones,

        insideZones,

        approachingZones,

      },

    });

  } catch (error) {

    console.error(

      "Geofence API error:",

      error

    );



    return NextResponse.json(

      {

        success: false,

        error:

          "Unable to perform geofence check",

        engine:

          "PostGIS Unified Geofence Engine",

      },

      { status: 500 }

    );

  }

}