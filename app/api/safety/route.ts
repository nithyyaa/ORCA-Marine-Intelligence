import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [weatherRes, oceanRes, tideRes] = await Promise.all([
      fetch("http://localhost:3001/api/weather", {
        cache: "no-store",
      }),
      fetch("http://localhost:3001/api/ocean", {
        cache: "no-store",
      }),
      fetch("http://localhost:3001/api/tide", {
        cache: "no-store",
      }),
    ]);

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
      location: "Visakhapatnam, India",
      risk,
      safetyScore: score,
      recommendation,

      conditions: {
        windSpeed,
        waveHeight,
        seaSurfaceTemperature:
          ocean.seaSurfaceTemperature ?? null,
      },

      tideAvailable: tide.tides?.length > 0,
    });
  } catch {
    return NextResponse.json(
      {
        live: false,
        error: "Unable to calculate marine safety conditions",
      },
      { status: 500 }
    );
  }
}