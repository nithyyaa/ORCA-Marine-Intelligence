import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=17.6868&longitude=83.2185&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&hourly=precipitation_probability&timezone=Asia%2FKolkata"
    );

    if (!response.ok) {
      throw new Error("Weather API failed");
    }

    const data = await response.json();

    return NextResponse.json({
      location: "Visakhapatnam, India",
      temperature: data.current.temperature_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      weatherCode: data.current.weather_code,
      precipitationProbability:
        data.hourly?.precipitation_probability?.[0] ?? null,
      source: "Open-Meteo",
      live: true,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to fetch live weather data",
        live: false,
      },
      { status: 500 }
    );
  }
}