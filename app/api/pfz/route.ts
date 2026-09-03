import { NextRequest, NextResponse } from "next/server";

const PFZ_URL =
  "https://incois.gov.in/geoserver/PFZ_Automation/wfs" +
  "?service=WFS" +
  "&version=1.1.0" +
  "&request=GetFeature" +
  "&typeName=PFZ_Automation%3Apfzlines" +
  "&outputFormat=application/json" +
  "&srsName=EPSG%3A4326";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));

    const latitude = Number.isFinite(lat) ? lat : 17.6868;
    const longitude = Number.isFinite(lon) ? lon : 83.2185;

    const response = await fetch(PFZ_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("INCOIS PFZ request failed");
    }

    const data = await response.json();

    const zones = (data.features ?? [])
      .map((feature: any, index: number) => {
        const coordinates =
          feature.geometry?.coordinates?.flat(1) ?? [];

        if (!coordinates.length) return null;

        const points = coordinates
          .filter(
            (point: any) =>
              Array.isArray(point) &&
              point.length >= 2 &&
              Number.isFinite(point[0]) &&
              Number.isFinite(point[1])
          )
          .map((point: any) => ({
            longitude: point[0],
            latitude: point[1],
          }));

        if (!points.length) return null;

        const nearest = points.reduce((best: any, point: any) => {
          const bestDistance =
            Math.pow(best.latitude - latitude, 2) +
            Math.pow(best.longitude - longitude, 2);

          const pointDistance =
            Math.pow(point.latitude - latitude, 2) +
            Math.pow(point.longitude - longitude, 2);

          return pointDistance < bestDistance ? point : best;
        });

        return {
          id: feature.id ?? `PFZ-${index + 1}`,
          latitude: nearest.latitude,
          longitude: nearest.longitude,
          geometry: points,
          sector: feature.properties?.SECTORNAME ?? "",
          year: feature.properties?.Year ?? null,
          julianDay: feature.properties?.Julian_day ?? null,
          length: feature.properties?.Length ?? null,
          source: "INCOIS PFZ Web Feature Service",
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      live: true,
      source: "INCOIS",
      location: {
        latitude,
        longitude,
      },
      count: zones.length,
      zones,
    });
  } catch (error) {
    console.error("PFZ error:", error);

    return NextResponse.json(
      {
        live: false,
        source: "INCOIS",
        error: "Unable to retrieve PFZ data",
        zones: [],
      },
      { status: 500 }
    );
  }
}