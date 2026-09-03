import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
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

    const requestUrl = new URL(request.url);
    const date = requestUrl.searchParams.get("date");

    if (date === "tomorrow") {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        `&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max,weather_code` +
        `&forecast_days=2` +
        `&timezone=auto`;

      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Weather forecast API request failed");
      }

      const data = await response.json();

      return NextResponse.json({
        live: true,
        forecast: true,
        date: data.daily?.time?.[1] ?? null,

        location: location.name,
        latitude: location.latitude,
        longitude: location.longitude,

        temperatureMax:
          data.daily?.temperature_2m_max?.[1] ?? null,

        temperatureMin:
          data.daily?.temperature_2m_min?.[1] ?? null,

        windSpeed:
          data.daily?.wind_speed_10m_max?.[1] ?? null,

        precipitationProbability:
          data.daily?.precipitation_probability_max?.[1] ?? null,

        weatherCode:
          data.daily?.weather_code?.[1] ?? null,

        source: "Open-Meteo",
      });
    }

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${location.latitude}` +
      `&longitude=${location.longitude}` +
      `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code` +
      `&hourly=precipitation_probability` +
      `&forecast_days=1` +
      `&timezone=auto`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Weather API request failed");
    }

    const data = await response.json();

    return NextResponse.json({
      live: true,
      forecast: false,

      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,

      temperature: data.current?.temperature_2m ?? null,

      windSpeed: data.current?.wind_speed_10m ?? null,

      windDirection:
        data.current?.wind_direction_10m ?? null,

      weatherCode:
        data.current?.weather_code ?? null,

      precipitationProbability:
        data.hourly?.precipitation_probability?.[0] ?? null,

      time: data.current?.time ?? null,

      source: "Open-Meteo",
    });
  } catch (error) {
    console.error("Weather API error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch weather data",
      },
      { status: 500 }
    );
  }
}