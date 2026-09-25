import { NextResponse } from "next/server";

type HourlyRow = {
  hoursFromNow: number;
  time: string;
  windSpeed: number | null;
  windDirection: number | null;
  precipitationProbability: number | null;
  weatherCode: number | null;
  waveHeight: number | null;
  waveDirection: number | null;
  wavePeriod: number | null;
};

function finiteOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("lat"));
    const longitude = Number(searchParams.get("lon"));

    const requestedHours = Number(searchParams.get("hours") || 24);

    const hours = Number.isFinite(requestedHours)
      ? Math.min(24, Math.max(1, requestedHours))
      : 24;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { live: false, error: "Invalid coordinates." },
        { status: 400 }
      );
    }

    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?" +
      new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        hourly:
          "wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code",
        forecast_hours: String(hours + 1),
        timezone: "auto",
      }).toString();

    const marineUrl =
      "https://marine-api.open-meteo.com/v1/marine?" +
      new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        hourly: "wave_height,wave_direction,wave_period",
        forecast_hours: String(hours + 1),
        timezone: "auto",
      }).toString();

    const [weatherResponse, marineResponse] = await Promise.all([
      fetch(weatherUrl, { cache: "no-store" }),
      fetch(marineUrl, { cache: "no-store" }),
    ]);

    if (!weatherResponse.ok) {
      throw new Error("Weather forecast unavailable.");
    }

    const weather = await weatherResponse.json();
    const marine = marineResponse.ok ? await marineResponse.json() : null;

    const weatherTimes: string[] = Array.isArray(weather?.hourly?.time)
      ? weather.hourly.time
      : [];

    const marineTimes: string[] = Array.isArray(marine?.hourly?.time)
      ? marine.hourly.time
      : [];

    const rows: HourlyRow[] = weatherTimes
      .slice(0, hours + 1)
      .map((time, index) => {
        const marineIndex = marineTimes.indexOf(time);

        return {
          hoursFromNow: index,
          time,
          windSpeed: finiteOrNull(
            weather?.hourly?.wind_speed_10m?.[index]
          ),
          windDirection: finiteOrNull(
            weather?.hourly?.wind_direction_10m?.[index]
          ),
          precipitationProbability: finiteOrNull(
            weather?.hourly?.precipitation_probability?.[index]
          ),
          weatherCode: finiteOrNull(
            weather?.hourly?.weather_code?.[index]
          ),
          waveHeight:
            marineIndex >= 0
              ? finiteOrNull(marine?.hourly?.wave_height?.[marineIndex])
              : null,
          waveDirection:
            marineIndex >= 0
              ? finiteOrNull(marine?.hourly?.wave_direction?.[marineIndex])
              : null,
          wavePeriod:
            marineIndex >= 0
              ? finiteOrNull(marine?.hourly?.wave_period?.[marineIndex])
              : null,
        };
      });

    return NextResponse.json({
      live: true,
      latitude,
      longitude,
      forecastHours: hours,
      hourly: rows,
      dataAvailability: {
        weather: weatherTimes.length > 0,
        marine: marineTimes.length > 0,
      },
      sources: {
        weather: "Open-Meteo",
        marine: marineResponse.ok
          ? "Open-Meteo Marine API"
          : null,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Map forecast error:", error);

    return NextResponse.json(
      {
        live: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve map forecast.",
      },
      { status: 502 }
    );
  }
}