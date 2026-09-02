import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url =
      "https://marine-api.open-meteo.com/v1/marine" +
      "?latitude=17.6868" +
      "&longitude=83.2185" +
      "&current=wave_height,wave_direction,wave_period,sea_surface_temperature" +
      "&timezone=Asia%2FKolkata";

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Marine API failed");
    }

    const data = await res.json();

    return NextResponse.json({
      live: true,
      location: "Visakhapatnam, India",
      waveHeight: data.current?.wave_height ?? null,
      waveDirection: data.current?.wave_direction ?? null,
      wavePeriod: data.current?.wave_period ?? null,
      seaSurfaceTemperature:
        data.current?.sea_surface_temperature ?? null,
      time: data.current?.time ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        live: false,
        error: "Unable to retrieve ocean conditions",
      },
      { status: 500 }
    );
  }
}