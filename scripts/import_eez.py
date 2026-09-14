import geopandas as gpd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv(".env")

GPKG_PATH = r"D:\World_EEZ_v12_20231025_gpkg\World_EEZ_v12_20231025_gpkg\eez_v12.gpkg"

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL is not configured")

print("Reading EEZ GeoPackage...")
print(GPKG_PATH)

if not os.path.exists(GPKG_PATH):
    raise Exception(f"GeoPackage not found: {GPKG_PATH}")

gdf = gpd.read_file(GPKG_PATH, layer="eez_v12")

print(f"Found {len(gdf)} EEZ features.")
print(f"Geometry type: {gdf.geometry.geom_type.unique()}")
print(f"CRS: {gdf.crs}")

if gdf.empty:
    raise Exception("No EEZ features found.")

# Make sure everything is WGS84
if gdf.crs is None:
    raise Exception("GeoPackage has no CRS.")

if str(gdf.crs) != "EPSG:4326":
    gdf = gdf.to_crs("EPSG:4326")

connection = psycopg2.connect(DATABASE_URL)
cursor = connection.cursor()

print("Connected to PostgreSQL.")

print("Removing previous Marine Regions EEZ polygons...")

cursor.execute("""
    DELETE FROM marine_boundaries
    WHERE source = 'Marine Regions'
      AND boundary_type = 'EEZ'
""")

print("Importing EEZ polygons...")

inserted = 0

for _, row in gdf.iterrows():

    geometry = row.geometry

    if geometry is None or geometry.is_empty:
        continue

    # Convert Polygon to MultiPolygon
    if geometry.geom_type == "Polygon":
        geometry = geometry.buffer(0)
        geometry = gpd.GeoSeries([geometry]).iloc[0]

        if geometry.geom_type == "Polygon":
            from shapely.geometry import MultiPolygon
            geometry = MultiPolygon([geometry])

    if geometry.geom_type != "MultiPolygon":
        continue

    boundary_id = (
        str(row.get("MRGID_EEZ"))
        if row.get("MRGID_EEZ") is not None
        else str(row.get("MRGID"))
    )

    name = row.get("GEONAME")

    if name is None:
        name = row.get("TERRITORY1")

    country = row.get("SOVEREIGN1")

    area = row.get("AREA_KM2")

    geometry_wkt = geometry.wkt

    notes = None

    if area is not None:
        notes = f"Area: {area} km²"

    cursor.execute(
        """
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
            %s,
            %s,
            %s,
            %s,
            ST_Multi(
                ST_SetSRID(
                    ST_GeomFromText(%s),
                    4326
                )
            ),
            %s,
            %s,
            %s,
            %s
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
        """,
        (
            boundary_id,
            name,
            country,
            "EEZ",
            geometry_wkt,
            "Marine Regions",
            "2023-10-25",
            "valid",
            notes,
        ),
    )

    inserted += 1

    if inserted % 25 == 0:
        print(f"Imported {inserted}/{len(gdf)}")

connection.commit()

cursor.close()
connection.close()

print("")
print("=================================")
print("EEZ IMPORT COMPLETE")
print("=================================")
print(f"Imported: {inserted}")
print("Source: Marine Regions")
print("Dataset: World EEZ v12")
print("Dataset date: 2023-10-25")
print("=================================")