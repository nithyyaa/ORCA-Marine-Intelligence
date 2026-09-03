import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const locationCookie = cookieStore.get("orca-location")?.value;

    if (!locationCookie) {
      return NextResponse.json(
        { error: "Operating location not selected" },
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
      `&current=wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity,ocean_current_direction` +
      `&timezone=auto`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Ocean API request failed");
    }

    const data = await response.json();

    return NextResponse.json({
      live: true,
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,

      waveHeight: data.current?.wave_height ?? null,
      waveDirection: data.current?.wave_direction ?? null,
      wavePeriod: data.current?.wave_period ?? null,

      sst: data.current?.sea_surface_temperature ?? null,

      oceanCurrentVelocity:
        data.current?.ocean_current_velocity ?? null,

      oceanCurrentDirection:
        data.current?.ocean_current_direction ?? null,

      time: data.current?.time ?? null,

      source: "Open-Meteo Marine API",
    });
  } catch (error) {
    console.error("Ocean API error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch ocean data",
      },
      { status: 500 }
    );
  }
}