import { NextResponse } from "next/server";
import { calculateMarineSafety } from "@/lib/marine/safety-engine";

type PFZZone = {
  zone_id: string;
  latitude: number;
  longitude: number;
  sector?: string | null;
  year?: number | null;
  julian_day?: string | null;
  length_km?: number | null;
  source?: string | null;
  distance_km?: number | string | null;
};

function deriveSeaState(waveHeight: unknown): string | null {
  const wave = Number(waveHeight);
  if (!Number.isFinite(wave)) return null;
  if (wave < 1) return "Calm";
  if (wave < 1.5) return "Slight";
  if (wave < 2.5) return "Moderate";
  if (wave < 4) return "Rough";
  return "Very Rough";
}

function suitabilityLabel(score: number): "Favorable" | "Moderate" | "Caution" {
  if (score >= 70) return "Favorable";
  if (score >= 45) return "Moderate";
  return "Caution";
}

async function jsonFetch(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Valid lat and lon are required" }, { status: 400 });
  }

  try {
    const baseUrl = url.origin;
    const pfzResponse = await jsonFetch(
      `${baseUrl}/api/pfz/nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
    );

    const zones: PFZZone[] = Array.isArray(pfzResponse?.zones) ? pfzResponse.zones : [];
    const ordered = [...zones].sort(
      (a, b) => Number(a.distance_km ?? Infinity) - Number(b.distance_km ?? Infinity),
    );

    // Evaluate the five nearest zones to keep the intelligence request responsive.
    // Remaining zones stay visible but are explicitly marked unevaluated.
    const evaluated = await Promise.all(
      ordered.slice(0, 5).map(async (zone) => {
        try {
          const weatherUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${zone.latitude}&longitude=${zone.longitude}` +
            `&current=wind_speed_10m,precipitation,precipitation_probability,weather_code` +
            `&timezone=auto`;
          const marineUrl =
            `https://marine-api.open-meteo.com/v1/marine` +
            `?latitude=${zone.latitude}&longitude=${zone.longitude}` +
            `&current=wave_height,wave_direction,wave_period,sea_surface_temperature` +
            `&timezone=auto`;

          const [weather, marine] = await Promise.all([
            jsonFetch(weatherUrl),
            jsonFetch(marineUrl),
          ]);

          const wind = Number(weather?.current?.wind_speed_10m);
          const rain = Number(weather?.current?.precipitation_probability);
          const wave = Number(marine?.current?.wave_height);

          const safety = calculateMarineSafety({
            windSpeed: Number.isFinite(wind) ? wind : undefined,
            waveHeight: Number.isFinite(wave) ? wave : undefined,
            rainfall: Number.isFinite(rain) ? rain : undefined,
            seaState: deriveSeaState(wave) ?? undefined,
          });

          const distance = Number(zone.distance_km);
          const distanceScore = Number.isFinite(distance)
            ? Math.max(0, Math.min(100, 100 - distance * 0.25))
            : 50;

          // This is a transparent prototype suitability score, not a fish-abundance prediction.
          // PFZ evidence contributes 40%, proximity 20%, and local marine safety 40%.
          const suitabilityScore = Math.round(
            40 + distanceScore * 0.2 + safety.safetyScore * 0.4,
          );

          return {
            zoneId: zone.zone_id,
            safetyScore: safety.safetyScore,
            safetyRisk: safety.risk,
            safetyConfidence: safety.confidence,
            suitabilityScore,
            suitability: suitabilityLabel(suitabilityScore),
            conditions: {
              windSpeed: Number.isFinite(wind) ? wind : null,
              waveHeight: Number.isFinite(wave) ? wave : null,
              rainfall: Number.isFinite(rain) ? rain : null,
              seaState: deriveSeaState(wave),
              sst: Number.isFinite(Number(marine?.current?.sea_surface_temperature))
                ? Number(marine.current.sea_surface_temperature)
                : null,
            },
            sources: {
              weather: "Open-Meteo",
              ocean: "Open-Meteo Marine API",
              pfz: zone.source ?? "INCOIS",
            },
            generatedAt: new Date().toISOString(),
          };
        } catch (error) {
          return {
            zoneId: zone.zone_id,
            unavailable: true,
            error: error instanceof Error ? error.message : "Safety data unavailable",
          };
        }
      }),
    );

    const evaluatedById = new Map(evaluated.map((item) => [item.zoneId, item]));

    return NextResponse.json({
      live: true,
      source: "INCOIS PFZ + Open-Meteo weather/marine",
      prototypeModel: true,
      note: "Suitability is an evidence-based prototype indicator, not a prediction of fish abundance. Only the five nearest PFZs receive a zone-specific live safety check.",
      zones: ordered.map((zone, index) => ({
        ...zone,
        rank: index + 1,
        intelligence: evaluatedById.get(zone.zone_id) ?? {
          zoneId: zone.zone_id,
          unavailable: true,
          reason: "Zone-specific safety evaluation limited to five nearest PFZs for responsiveness.",
        },
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Fishing intelligence API error:", error);
    return NextResponse.json(
      { live: false, error: "Fishing intelligence is temporarily unavailable." },
      { status: 503 },
    );
  }
}
