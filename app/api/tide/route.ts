import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const locationCookie = cookieStore.get("orca-location")?.value;

    if (!locationCookie) {
      return NextResponse.json(
        {
          error:
            "Operating location not set. Please choose a location in Settings.",
        },
        { status: 400 }
      );
    }

    const location = JSON.parse(decodeURIComponent(locationCookie));

    if (
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid operating location" },
        { status: 400 }
      );
    }

    const url =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${location.latitude}` +
      `&longitude=${location.longitude}` +
      `&hourly=sea_level_height_msl` +
      `&forecast_days=3` +
      `&timezone=auto`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Tide API request failed");
    }

    const data = await response.json();

    const times = data.hourly?.time ?? [];
    const heights = data.hourly?.sea_level_height_msl ?? [];

    const tides: {
      type: string;
      time: string;
      height: number;
    }[] = [];

    for (let i = 1; i < heights.length - 1; i++) {
      const previous = heights[i - 1];
      const current = heights[i];
      const next = heights[i + 1];

      if (
        typeof previous !== "number" ||
        typeof current !== "number" ||
        typeof next !== "number"
      ) {
        continue;
      }

      if (current > previous && current > next) {
        tides.push({
          type: "High Tide",
          time: formatTime(times[i]),
          height: Number(current.toFixed(2)),
        });
      }

      if (current < previous && current < next) {
        tides.push({
          type: "Low Tide",
          time: formatTime(times[i]),
          height: Number(current.toFixed(2)),
        });
      }
    }

    return NextResponse.json({
      live: true,
      modelDerived: true,
      source: "Open-Meteo Marine API",
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      tides: tides.slice(0, 6),
    });
  } catch (error) {
    console.error("Tide API error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch tide data",
      },
      { status: 500 }
    );
  }
}

function formatTime(time: string) {
  const date = new Date(time);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}