import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import postgres from "postgres";

const GPKG_PATH =
  "D:\\World_EEZ_v12_20231025_gpkg\\World_EEZ_v12_20231025_gpkg\\eez_v12.gpkg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

if (!fs.existsSync(GPKG_PATH)) {
  throw new Error(`GeoPackage not found: ${GPKG_PATH}`);
}

const sql = postgres(DATABASE_URL);

async function main() {
  console.log("Reading EEZ GeoPackage...");
  console.log(GPKG_PATH);

  /*
   * Use ogr2ogr to import the GeoPackage directly into
   * the existing PostGIS marine_boundaries table.
   */
  const connectionString = DATABASE_URL;

  const tempGeoJSON = path.join(
    process.cwd(),
    "scripts",
    "eez_temp.geojson"
  );

  console.log("Converting GeoPackage to GeoJSON...");

  execFileSync(
    "ogr2ogr",
    [
      "-f",
      "GeoJSON",
      tempGeoJSON,
      GPKG_PATH,
      "eez_v12",
      "-t_srs",
      "EPSG:4326",
    ],
    {
      stdio: "inherit",
    }
  );

  console.log("GeoJSON created.");

  const geojson = JSON.parse(fs.readFileSync(tempGeoJSON, "utf8"));

  const features = geojson.features ?? [];

  console.log(`Found ${features.length} EEZ features.`);

  if (!features.length) {
    throw new Error("No EEZ features found in GeoPackage.");
  }

  console.log("Clearing existing EEZ polygon records...");

  await sql`
    DELETE FROM marine_boundaries
    WHERE source = 'Marine Regions'
  `;

  console.log("Importing EEZ polygons...");

  let inserted = 0;

  for (const feature of features) {
    const properties = feature.properties ?? {};
    const geometry = feature.geometry;

    if (!geometry) {
      continue;
    }

    if (
      geometry.type !== "MultiPolygon" &&
      geometry.type !== "Polygon"
    ) {
      continue;
    }

    const boundaryId =
      properties.MRGID_EEZ?.toString() ??
      properties.MRGID?.toString() ??
      `EEZ-${inserted + 1}`;

    const name =
      properties.GEONAME?.toString() ??
      properties.TERRITORY1?.toString() ??
      null;

    const country =
      properties.SOVEREIGN1?.toString() ??
      properties.TERRITORY1?.toString() ??
      null;

    const areaKm2 =
      typeof properties.AREA_KM2 === "number"
        ? properties.AREA_KM2
        : null;

    await sql`
      INSERT INTO marine_boundaries (
        boundary_id,
        name,
        country,
        boundary_type,
        geometry,
        source,
        source_date,
        status,
        notes
      )
      VALUES (
        ${boundaryId},
        ${name},
        ${country},
        ${"EEZ"},
        ST_Multi(
          ST_SetSRID(
            ST_GeomFromGeoJSON(${JSON.stringify(geometry)}),
            4326
          )
        ),
        ${"Marine Regions"},
        ${"2023-10-25"},
        ${"valid"},
        ${areaKm2 !== null ? `Area: ${areaKm2} km²` : null}
      )
      ON CONFLICT (boundary_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        boundary_type = EXCLUDED.boundary_type,
        geometry = EXCLUDED.geometry,
        source = EXCLUDED.source,
        source_date = EXCLUDED.source_date,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes
    `;

    inserted++;

    if (inserted % 25 === 0) {
      console.log(`Imported ${inserted}/${features.length}`);
    }
  }

  fs.unlinkSync(tempGeoJSON);

  console.log("");
  console.log("=================================");
  console.log("EEZ IMPORT COMPLETE");
  console.log("=================================");
  console.log(`Inserted/updated: ${inserted}`);
  console.log("Source: Marine Regions");
  console.log("Dataset: World EEZ v12");
  console.log("Dataset date: 2023-10-25");
  console.log("=================================");

  await sql.end();
}

main().catch(async (error) => {
  console.error("");
  console.error("EEZ IMPORT FAILED");
  console.error(error);

  await sql.end();

  process.exit(1);
});