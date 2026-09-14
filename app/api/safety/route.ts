import { NextResponse } from "next/server";
import { calculateMarineSafety } from "@/lib/marine/safety-engine";

type JsonObject = Record<string, any>;

async function readJson(response: Response): Promise<JsonObject | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function deriveSeaState(waveHeight: unknown): string | null {
  const wave = Number(waveHeight);
  if (!Number.isFinite(wave)) return null;
  if (wave < 1) return "Calm";
  if (wave < 1.5) return "Slight";
  if (wave < 2.5) return "Moderate";
  if (wave < 4) return "Rough";
  return "Very Rough";
}

function deriveTideRisk(tide: JsonObject | null): number | null {
  const tides = Array.isArray(tide?.tides) ? tide.tides : [];
  const heights = tides
    .map((item: any) => Number(item?.height))
    .filter((value: number) => Number.isFinite(value));

  if (!heights.length) return null;

  const maxAbs = Math.max(...heights.map((value: number) => Math.abs(value)));
  if (maxAbs >= 2.5) return 80;
  if (maxAbs >= 2) return 55;
  if (maxAbs >= 1.5) return 30;
  return 10;
}

function deriveHazardRisk(hazard: JsonObject | null, type: "lightning" | "cyclone"): number | null {
  const hazards = Array.isArray(hazard?.hazards) ? hazard.hazards : [];

  const matching = hazards.filter((item: any) => {
    const text = `${item?.type ?? ""} ${item?.message ?? ""}`.toLowerCase();
    return type === "lightning"
      ? text.includes("lightning") || text.includes("thunder")
      : text.includes("cyclone") || text.includes("tropical storm");
  });

  if (!matching.length) {
    // The current hazard service does not provide a measured lightning/cyclone
    // value when no matching event exists. Treat that as unavailable rather
    // than silently converting missing evidence into a zero-risk score.
    return null;
  }

  const severities = matching.map((item: any) => String(item?.severity ?? "").toLowerCase());
  if (severities.some((s: string) => s.includes("critical") || s.includes("extreme"))) return 100;
  if (severities.some((s: string) => s.includes("high"))) return 80;
  if (severities.some((s: string) => s.includes("moderate"))) return 50;
  return 30;
}

function geofencePenalty(geofence: JsonObject | null): number | null {
  if (!geofence || typeof geofence.insideEEZ !== "boolean") return null;
  if (!geofence.insideEEZ) return 30;

  const warning = String(geofence.warning ?? "").toUpperCase();
  if (warning === "CRITICAL") return 20;
  if (warning === "HIGH") return 15;
  if (warning === "MODERATE") return 8;
  return 0;
}

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";
  const fetchOptions = {
    cache: "no-store" as const,
    headers: { Cookie: cookie },
  };

  try {
    const [weatherRes, oceanRes, tideRes, hazardRes, geofenceRes] = await Promise.all([
      fetch(`${baseUrl}/api/weather`, fetchOptions),
      fetch(`${baseUrl}/api/ocean`, fetchOptions),
      fetch(`${baseUrl}/api/tide`, fetchOptions),
      fetch(`${baseUrl}/api/hazard`, fetchOptions),
      fetch(`${baseUrl}/api/geofence`, fetchOptions),
    ]);

    const [weather, ocean, tide, hazard, geofence] = await Promise.all([
      readJson(weatherRes),
      readJson(oceanRes),
      readJson(tideRes),
      readJson(hazardRes),
      readJson(geofenceRes),
    ]);

    const failures = [
      ["weather", weatherRes.ok, weather],
      ["ocean", oceanRes.ok, ocean],
      ["tide", tideRes.ok, tide],
    ].filter(([, ok, data]) => !ok || !data);

    if (failures.length === 3) {
      return NextResponse.json({
        live: false,
        ready: false,
        model: "Prototype Risk Model",
        message: "Marine safety assessment is unavailable because live weather, ocean and tide data could not be retrieved.",
      });
    }

    const windSpeed = Number.isFinite(Number(weather?.windSpeed)) ? Number(weather?.windSpeed) : null;
    const waveHeight = Number.isFinite(Number(ocean?.waveHeight)) ? Number(ocean?.waveHeight) : null;
    const rainfall = Number.isFinite(Number(weather?.precipitationProbability))
      ? Number(weather?.precipitationProbability)
      : null;

    const result = calculateMarineSafety({
      windSpeed,
      waveHeight,
      rainfall,
      seaState: deriveSeaState(waveHeight),
      lightningRisk: deriveHazardRisk(hazard, "lightning"),
      cycloneRisk: deriveHazardRisk(hazard, "cyclone"),
      tideRisk: deriveTideRisk(tide),
      insideEEZ: typeof geofence?.insideEEZ === "boolean" ? geofence.insideEEZ : null,
      geofenceRisk: geofencePenalty(geofence),
    });

    return NextResponse.json({
      live: true,
      ready: true,
      model: result.model,
      location: weather?.location ?? geofence?.location ?? null,
      latitude: weather?.latitude ?? geofence?.location?.latitude ?? null,
      longitude: weather?.longitude ?? geofence?.location?.longitude ?? null,
      safetyScore: result.safetyScore,
      risk: result.risk,
      confidence: result.confidence,
      factors: result.factors,
      recommendation: result.recommendation,
      availableFactorCount: result.availableFactorCount,
      expectedFactorCount: result.expectedFactorCount,
      conditions: {
        windSpeed,
        waveHeight,
        rainfall,
        seaState: deriveSeaState(waveHeight),
        seaSurfaceTemperature: ocean?.sst ?? null,
      },
      geofence: geofence
        ? {
            insideEEZ: geofence.insideEEZ,
            warning: geofence.warning ?? null,
            distanceToBoundaryKm: geofence.distanceToBoundaryKm ?? null,
          }
        : null,
      hazards: Array.isArray(hazard?.hazards) ? hazard.hazards : [],
      sources: {
        weather: weather?.source ?? null,
        ocean: ocean?.source ?? null,
        tide: tide?.source ?? null,
        hazards: hazard?.source ?? null,
        geofence: geofence?.source ?? null,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Safety API error:", error);
    return NextResponse.json(
      {
        live: false,
        ready: false,
        model: "Prototype Risk Model",
        message: "Marine safety assessment is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
