import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Point = {
  latitude: number;
  longitude: number;
};

function haversineKm(a: Point, b: Point) {
  const R = 6371;

  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const dLat =
    ((b.latitude - a.latitude) * Math.PI) / 180;

  const dLon =
    ((b.longitude - a.longitude) * Math.PI) / 180;

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(1 - value)
    )
  );
}

async function geocodeDestination(destination: string) {
  // First try the exact destination entered by the user
  const searchNames = [
    destination,
    `${destination}, India`,
  ];

  for (const searchName of searchNames) {
    const url =
      "https://geocoding-api.open-meteo.com/v1/search?" +
      new URLSearchParams({
        name: searchName,
        count: "5",
        language: "en",
        format: "json",
      }).toString();

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const results = data?.results;

    if (Array.isArray(results) && results.length > 0) {
      // Prefer an Indian result when available
      const result =
        results.find(
          (item: any) =>
            String(item.country || "").toLowerCase() ===
            "india"
        ) || results[0];

      return {
        latitude: Number(result.latitude),
        longitude: Number(result.longitude),
        name: [result.name, result.admin1, result.country]
          .filter(Boolean)
          .join(", "),
      };
    }
  }

  // Fallback to OpenStreetMap/Nominatim for places
  // such as ports that Open-Meteo may not index directly.
  const nominatimUrl =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: `${destination}, India`,
      format: "json",
      limit: "5",
    }).toString();

  const nominatimResponse = await fetch(nominatimUrl, {
    cache: "no-store",
    headers: {
      "User-Agent": "ORCA-Marine-Intelligence/1.0",
    },
  });

  if (nominatimResponse.ok) {
    const results = await nominatimResponse.json();

    if (Array.isArray(results) && results.length > 0) {
      const result = results[0];

      return {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        name: result.display_name || destination,
      };
    }
  }

  throw new Error(
    `Could not find destination "${destination}".`
  );
}

async function getForecast(
  point: Point,
  date: string
) {
  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: String(point.latitude),
      longitude: String(point.longitude),

      hourly:
        "wind_speed_10m,precipitation_probability,weather_code",

      start_date: date,
      end_date: date,

      timezone: "auto",
    }).toString();

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Weather forecast unavailable");
  }

  return response.json();
}

async function getMarineForecast(
  point: Point,
  date: string
) {
  const url =
    "https://marine-api.open-meteo.com/v1/marine?" +
    new URLSearchParams({
      latitude: String(point.latitude),
      longitude: String(point.longitude),

      hourly:
        "wave_height,wave_direction,wave_period",

      start_date: date,
      end_date: date,

      timezone: "auto",
    }).toString();

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function getHourIndex(
  times: string[] | undefined,
  departureTime: string
) {
  if (!times?.length) return 0;

  const targetHour = Number(
    departureTime.split(":")[0]
  );

  let closestIndex = 0;
  let closestDifference = Infinity;

  times.forEach((time, index) => {
    const hour = Number(
      time.substring(11, 13)
    );

    const difference = Math.abs(
      hour - targetHour
    );

    if (difference < closestDifference) {
      closestDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function calculateSafetyScore(
  windSpeed: number | null,
  waveHeight: number | null,
  precipitationProbability: number | null
) {
  const valuesAvailable =
    windSpeed !== null ||
    waveHeight !== null ||
    precipitationProbability !== null;

  if (!valuesAvailable) {
    return null;
  }

  let score = 100;

  if (
    windSpeed !== null &&
    windSpeed >= 40
  ) {
    score -= 35;
  } else if (
    windSpeed !== null &&
    windSpeed >= 30
  ) {
    score -= 25;
  } else if (
    windSpeed !== null &&
    windSpeed >= 20
  ) {
    score -= 12;
  }

  if (
    waveHeight !== null &&
    waveHeight >= 4
  ) {
    score -= 35;
  } else if (
    waveHeight !== null &&
    waveHeight >= 3
  ) {
    score -= 25;
  } else if (
    waveHeight !== null &&
    waveHeight >= 2
  ) {
    score -= 12;
  }

  if (
    precipitationProbability !== null &&
    precipitationProbability >= 80
  ) {
    score -= 15;
  } else if (
    precipitationProbability !== null &&
    precipitationProbability >= 60
  ) {
    score -= 8;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
}

function getRiskLevel(
  score: number | null
) {
  if (score === null) {
    return "UNAVAILABLE";
  }

  if (score >= 76) return "LOW";
  if (score >= 51) return "MODERATE";
  if (score >= 26) return "HIGH";

  return "CRITICAL";
}

function calculateForecastRisk(
  windSpeed: number | null,
  waveHeight: number | null,
  precipitationProbability: number | null,
  vesselType: string
) {
  let score = calculateSafetyScore(
    windSpeed,
    waveHeight,
    precipitationProbability
  );

  if (score === null) {
    return null;
  }

  if (
    vesselType === "Small Boat" &&
    waveHeight !== null &&
    waveHeight >= 2
  ) {
    score = Math.max(0, score - 10);
  }

  if (
    vesselType === "Cargo Vessel" &&
    windSpeed !== null &&
    windSpeed >= 30
  ) {
    score = Math.max(0, score - 5);
  }

  return score;
}

function getNullableNumber(
  value: unknown
): number | null {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getTrend(
  first: number | null,
  last: number | null,
  threshold: number
) {
  if (first === null || last === null) {
    return "UNAVAILABLE";
  }

  if (last >= first + threshold) {
    return "INCREASING";
  }

  if (last <= first - threshold) {
    return "DECREASING";
  }

  return "STABLE";
}

function buildPredictiveRisk(
  times: string[] | undefined,
  windSpeeds: number[] | undefined,
  waveHeights: number[] | undefined,
  precipitationProbabilities: number[] | undefined,
  baseIndex: number,
  vesselType: string
) {
  if (!times?.length) {
    return {
      available: false,
      message: "Forecast data is unavailable.",
    };
  }

  const offsets = [0, 6, 12, 24];

  const points = offsets.map((offset) => {
    const index = Math.min(
      baseIndex + offset,
      times.length - 1
    );

    /*
     * IMPORTANT:
     * Missing forecast values remain null.
     *
     * We do NOT use:
     * Number(value) || 0
     *
     * because zero is a real marine/weather value,
     * while unavailable data is not zero.
     */
    const windSpeed =
      getNullableNumber(
        windSpeeds?.[index]
      );

    const waveHeight =
      getNullableNumber(
        waveHeights?.[index]
      );

    const precipitationProbability =
      getNullableNumber(
        precipitationProbabilities?.[index]
      );

    const riskScore =
      calculateForecastRisk(
        windSpeed,
        waveHeight,
        precipitationProbability,
        vesselType
      );

    return {
      horizonHours: offset,
      timestamp: times[index],
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      conditions: {
        windSpeed,
        waveHeight,
        precipitationProbability,
      },
    };
  });

  const firstScore = points[0].riskScore;
  const lastScore =
    points[points.length - 1].riskScore;

  let trend = "UNAVAILABLE";

  if (
    firstScore !== null &&
    lastScore !== null
  ) {
    trend = "STABLE";

    if (lastScore >= firstScore + 10) {
      trend = "INCREASING";
    } else if (
      lastScore <= firstScore - 10
    ) {
      trend = "DECREASING";
    }
  }

  /*
   * Predictive trend drivers.
   *
   * These are derived only from the forecast values
   * already retrieved above. Missing values remain
   * UNAVAILABLE and are never treated as zero.
   */
  const currentConditions =
    points[0].conditions;

  const futureConditions =
    points[points.length - 1].conditions;

  const windTrend = getTrend(
    currentConditions.windSpeed,
    futureConditions.windSpeed,
    5
  );

  const waveTrend = getTrend(
    currentConditions.waveHeight,
    futureConditions.waveHeight,
    0.3
  );

  const precipitationTrend = getTrend(
    currentConditions.precipitationProbability,
    futureConditions.precipitationProbability,
    15
  );

  return {
    available: true,
    trend,

    trendDrivers: {
      wind: windTrend,
      waves: waveTrend,
      precipitation: precipitationTrend,
      lightning: "UNAVAILABLE",
      cyclone: "UNAVAILABLE",
    },

    current: points[0],
    forecast6h: points[1],
    forecast12h: points[2],
    forecast24h: points[3],

    note:
      "Forecast-derived risk. Values are predictions, not observations.",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const destinationText =
      typeof body?.destination === "string"
        ? body.destination.trim()
        : "";

    const date =
      typeof body?.date === "string" &&
      body.date
        ? body.date
        : new Date()
            .toISOString()
            .split("T")[0];

    const departureTime =
      typeof body?.departureTime === "string"
        ? body.departureTime
        : "06:00";

    const vesselType =
      typeof body?.vesselType === "string"
        ? body.vesselType
        : "Fishing Vessel";

    const route =
      typeof body?.route === "string"
        ? body.route
        : "Balanced Route";

    if (!destinationText) {
      return NextResponse.json(
        {
          error: "Destination is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Read the dynamic operating location
     * selected in Settings.
     */
    const cookieStore = await cookies();

    const locationCookie =
      cookieStore.get("orca-location")?.value;

    if (!locationCookie) {
      return NextResponse.json(
        {
          error:
            "Operating location is not set. Please choose a location in Settings.",
        },
        { status: 400 }
      );
    }

    let start: Point & { name: string };

    try {
      const parsed = JSON.parse(
        decodeURIComponent(locationCookie)
      );

      if (
        !Number.isFinite(
          Number(parsed.latitude)
        ) ||
        !Number.isFinite(
          Number(parsed.longitude)
        )
      ) {
        throw new Error("Invalid location");
      }

      start = {
        latitude: Number(parsed.latitude),
        longitude: Number(parsed.longitude),
        name:
          parsed.name ||
          "Selected operating location",
      };
    } catch {
      return NextResponse.json(
        {
          error: "Invalid operating location.",
        },
        { status: 400 }
      );
    }

    const destination =
      await geocodeDestination(
        destinationText
      );

    /*
     * Actual geographic distance.
     */
    const baseDistance = haversineKm(
      start,
      destination
    );

    /*
     * Weather + marine forecast for the
     * selected date.
     */
    const [weather, marine] =
      await Promise.all([
        getForecast(start, date),
        getMarineForecast(start, date),
      ]);

    const weatherTimes =
      weather?.hourly?.time;

    const index = getHourIndex(
      weatherTimes,
      departureTime
    );

    /*
     * Preserve missing values as null.
     */
    const windSpeed =
      getNullableNumber(
        weather?.hourly
          ?.wind_speed_10m?.[index]
      );

    const precipitationProbability =
      getNullableNumber(
        weather?.hourly
          ?.precipitation_probability?.[index]
      );

    const waveHeight =
      getNullableNumber(
        marine?.hourly
          ?.wave_height?.[index]
      );

    const predictiveRisk =
      buildPredictiveRisk(
        weatherTimes,
        weather?.hourly?.wind_speed_10m,
        marine?.hourly?.wave_height,
        weather?.hourly
          ?.precipitation_probability,
        index,
        vesselType
      );

    let safetyScore =
      calculateSafetyScore(
        windSpeed,
        waveHeight,
        precipitationProbability
      );

    /*
     * Vessel type affects the interpretation of
     * environmental conditions.
     */
    if (
      safetyScore !== null &&
      vesselType === "Small Boat" &&
      waveHeight !== null &&
      waveHeight >= 2
    ) {
      safetyScore = Math.max(
        0,
        safetyScore - 10
      );
    }

    if (
      safetyScore !== null &&
      vesselType === "Cargo Vessel" &&
      windSpeed !== null &&
      windSpeed >= 30
    ) {
      safetyScore = Math.max(
        0,
        safetyScore - 5
      );
    }

    /*
     * Route preference affects travel-time
     * assumptions, but does not fabricate marine
     * conditions.
     */
    const speedByRoute: Record<
      string,
      number
    > = {
      "Shortest Route": 22,
      "Fastest Route": 27,
      "Safest Route": 20,
      "Balanced Route": 24,
    };

    const speed =
      speedByRoute[route] ?? 24;

    const travelTime = Math.max(
      1,
      Math.round(
        (baseDistance / speed) * 60
      )
    );

    const hazardExposure =
      safetyScore === null
        ? "UNAVAILABLE"
        : safetyScore >= 76
        ? "LOW"
        : safetyScore >= 51
        ? "MODERATE"
        : safetyScore >= 26
        ? "HIGH"
        : "CRITICAL";

    const riskLevel =
      getRiskLevel(safetyScore);

    let recommendation =
      "Conditions are comparatively favourable.";

    if (safetyScore === null) {
      recommendation =
        "Marine forecast data is unavailable for this scenario. Do not assume safe conditions.";
    } else if (riskLevel === "MODERATE") {
      recommendation =
        "Proceed with caution and monitor marine conditions.";
    }

    if (riskLevel === "HIGH") {
      recommendation =
        "Consider delaying departure or selecting a safer route.";
    }

    if (riskLevel === "CRITICAL") {
      recommendation =
        "Avoid departure under the forecast conditions.";
    }

    const hazards: string[] = [];

    if (
      windSpeed !== null &&
      windSpeed >= 20
    ) {
      hazards.push(
        `Wind ${windSpeed} km/h`
      );
    }

    if (
      waveHeight !== null &&
      waveHeight >= 2
    ) {
      hazards.push(
        `Waves ${waveHeight} m`
      );
    }

    if (
      precipitationProbability !== null &&
      precipitationProbability >= 60
    ) {
      hazards.push(
        `Precipitation probability ${precipitationProbability}%`
      );
    }

    /*
     * Explicitly identify unavailable inputs.
     * This prevents missing evidence from being
     * mistaken for safe conditions.
     */
    const unavailableInputs: string[] = [];

    if (windSpeed === null) {
      unavailableInputs.push("Wind");
    }

    if (waveHeight === null) {
      unavailableInputs.push("Wave");
    }

    if (
      precipitationProbability === null
    ) {
      unavailableInputs.push(
        "Precipitation probability"
      );
    }

    if (unavailableInputs.length > 0) {
      hazards.push(
        `Unavailable: ${unavailableInputs.join(
          ", "
        )}`
      );
    }

    return NextResponse.json({
      live: true,

      scenario: {
        id: `${date}-${departureTime}-${route}`,

        departureTime,

        date,

        destination:
          destination.name,

        vesselType,

        route,

        distance: Number(
          baseDistance.toFixed(1)
        ),

        travelTime,

        riskScore: safetyScore,

        riskLevel,

        hazardExposure,

        hazards,

        recommendation,

        conditions: {
          windSpeed,
          waveHeight,
          precipitationProbability,
        },

        prediction: true,

        predictiveRisk,

        sources: [
          "Open-Meteo Weather",
          "Open-Meteo Marine",
        ],

        generatedAt:
          new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Scenario API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate scenario.",
      },
      { status: 500 }
    );
  }
}