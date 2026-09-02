import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [weatherRes, oceanRes] = await Promise.all([
      fetch("http://localhost:3001/api/weather", {
        cache: "no-store",
      }),
      fetch("http://localhost:3001/api/ocean", {
        cache: "no-store",
      }),
    ]);

    const weather = await weatherRes.json();
    const ocean = await oceanRes.json();

    const alerts = [];

    const windSpeed = weather.windSpeed ?? 0;
    const waveHeight = ocean.waveHeight ?? 0;

    if (windSpeed > 30) {
      alerts.push({
        type: "HIGH_WIND",
        severity: "HIGH",
        title: "High Wind Warning",
        message: `Wind speed is ${windSpeed} km/h. Fishing and small-vessel operations may be unsafe.`,
      });
    } else if (windSpeed > 20) {
      alerts.push({
        type: "STRONG_WIND",
        severity: "MODERATE",
        title: "Strong Wind",
        message: `Wind speed is ${windSpeed} km/h. Exercise caution while operating at sea.`,
      });
    }

    if (waveHeight > 2.5) {
      alerts.push({
        type: "HIGH_WAVES",
        severity: "HIGH",
        title: "High Wave Alert",
        message: `Wave height is ${waveHeight} m. Sea conditions may be dangerous.`,
      });
    } else if (waveHeight > 1.5) {
      alerts.push({
        type: "ROUGH_SEA",
        severity: "MODERATE",
        title: "Rough Sea Conditions",
        message: `Wave height is ${waveHeight} m. Mariners should exercise caution.`,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: "NO_MAJOR_ALERT",
        severity: "LOW",
        title: "No Major Marine Alerts",
        message:
          "Current wind and wave conditions do not indicate a major marine hazard.",
      });
    }

    return NextResponse.json({
      live: true,
      location: "Visakhapatnam, India",
      generatedAt: new Date().toISOString(),
      alerts,
      conditions: {
        windSpeed,
        waveHeight,
      },
    });
  } catch {
    return NextResponse.json(
      {
        live: false,
        error: "Unable to generate marine alerts",
      },
      { status: 500 }
    );
  }
}