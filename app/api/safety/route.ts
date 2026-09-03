import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const baseUrl = new URL(request.url).origin;
    const cookie = request.headers.get("cookie") ?? "";

    const fetchOptions = {
      cache: "no-store" as const,
      headers: {
        Cookie: cookie,
      },
    };

    const [weatherRes, oceanRes, tideRes] = await Promise.all([
      fetch(`${baseUrl}/api/weather`, fetchOptions),
      fetch(`${baseUrl}/api/ocean`, fetchOptions),
      fetch(`${baseUrl}/api/tide`, fetchOptions),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather API failed: ${weatherRes.status}`);
    }

    if (!oceanRes.ok) {
      throw new Error(`Ocean API failed: ${oceanRes.status}`);
    }

    if (!tideRes.ok) {
      throw new Error(`Tide API failed: ${tideRes.status}`);
    }

    const weather = await weatherRes.json();
    const ocean = await oceanRes.json();
    const tide = await tideRes.json();

    const windSpeed = weather.windSpeed ?? 0;
    const waveHeight = ocean.waveHeight ?? 0;

    let risk = "LOW";
    let score = 90;

    if (windSpeed > 30 || waveHeight > 2.5) {
      risk = "HIGH";
      score = 35;
    } else if (windSpeed > 20 || waveHeight > 1.5) {
      risk = "MODERATE";
      score = 65;
    }

    const recommendation =
      risk === "HIGH"
        ? "Fishing is not recommended under the current conditions."
        : risk === "MODERATE"
        ? "Exercise caution. Consider waiting for safer marine conditions."
        : "Current conditions appear favourable for fishing.";

    return NextResponse.json({
      live: true,

      location: weather.location,
      latitude: weather.latitude,
      longitude: weather.longitude,

      risk,
      safetyScore: score,
      recommendation,

      conditions: {
        windSpeed,
        waveHeight,
        seaSurfaceTemperature: ocean.sst ?? null,
      },

      tideAvailable:
        Array.isArray(tide.tides) && tide.tides.length > 0,

      source: {
        weather: weather.source,
        ocean: ocean.source,
        tide: tide.source,
      },
    });
  } catch (error) {
    console.error("Safety API error:", error);

    return NextResponse.json(
      {
        live: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate marine safety conditions",
      },
      { status: 500 }
    );
  }
}