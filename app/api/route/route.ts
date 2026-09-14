import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Point = {
  latitude: number;
  longitude: number;
};

type RouteCandidate = {
  id: string;
  name: "Shortest Route" | "Fastest Route" | "Safest Route" | "Balanced Route";
  tag: string;
  geometry: Point[];
  distanceKm: number;
  estimatedTimeMinutes: number;
  fuelLitres: number;
  safetyScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  hazardExposure: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  hazards: string[];
  recommendation: string;
  geofence: {
    available: boolean;
    checks: unknown[];
    violationCount: number;
    approachingCount: number;
    status: string | null;
  };
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
    Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

function interpolate(
  start: Point,
  destination: Point,
  offset = 0
): Point[] {
  const points: Point[] = [];

  const dx = destination.longitude - start.longitude;
  const dy = destination.latitude - start.latitude;

  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  const normalLat = -dx / length;
  const normalLon = dy / length;

  for (let i = 0; i <= 12; i++) {
    const t = i / 12;

    const curve =
      Math.sin(Math.PI * t) * offset;

    points.push({
      latitude:
        start.latitude +
        dy * t +
        normalLat * curve,

      longitude:
        start.longitude +
        dx * t +
        normalLon * curve,
    });
  }

  return points;
}

function routeDistance(points: Point[]) {
  let distance = 0;

  for (let i = 1; i < points.length; i++) {
    distance += haversineKm(
      points[i - 1],
      points[i]
    );
  }

  return distance;
}

function riskLevel(
  safetyScore: number
): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" {
  if (safetyScore >= 76) return "LOW";
  if (safetyScore >= 51) return "MODERATE";
  if (safetyScore >= 26) return "HIGH";
  return "CRITICAL";
}

async function geocodeDestination(
  destination: string
): Promise<Point & { name: string }> {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    new URLSearchParams({
      name: destination,
      count: "1",
      language: "en",
      format: "json",
    }).toString();

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Destination lookup failed");
  }

  const data = await response.json();

  const result = data?.results?.[0];

  if (!result) {
    throw new Error(
      `Could not find destination "${destination}".`
    );
  }

  return {
    latitude: Number(result.latitude),
    longitude: Number(result.longitude),
    name:
      [result.name, result.admin1, result.country]
        .filter(Boolean)
        .join(", "),
  };
}

async function getMarineConditions(point: Point) {
  const weatherUrl =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      current:
        "wind_speed_10m,wind_direction_10m,precipitation",
      timezone: "auto",
    }).toString();

  const marineUrl =
    "https://marine-api.open-meteo.com/v1/marine?" +
    new URLSearchParams({
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      current:
        "wave_height,wave_direction,wave_period",
      timezone: "auto",
    }).toString();

  const [weatherResponse, marineResponse] =
    await Promise.all([
      fetch(weatherUrl, {
        cache: "no-store",
      }),
      fetch(marineUrl, {
        cache: "no-store",
      }),
    ]);

  if (!weatherResponse.ok || !marineResponse.ok) {
    return null;
  }

  const weather = await weatherResponse.json();
  const marine = await marineResponse.json();

  return {
    windSpeed:
      Number.isFinite(
        Number(weather?.current?.wind_speed_10m)
      )
        ? Number(weather.current.wind_speed_10m)
        : null,

    waveHeight:
      Number.isFinite(
        Number(marine?.current?.wave_height)
      )
        ? Number(marine.current.wave_height)
        : null,

    rainfall:
      Number.isFinite(
        Number(weather?.current?.precipitation)
      )
        ? Number(weather.current.precipitation)
        : null,
  };
}

function calculateSafetyScore(
  conditions: {
    windSpeed: number | null;
    waveHeight: number | null;
    rainfall: number | null;
  } | null,
  routeMultiplier: number
) {
  if (!conditions) {
    return {
      score: null,
      hazards: ["Marine condition data unavailable"],
    };
  }

  let score = 100;
  const hazards: string[] = [];

  if (
    conditions.windSpeed !== null &&
    conditions.windSpeed >= 45
  ) {
    score -= 40;
    hazards.push("Very strong wind");
  } else if (
    conditions.windSpeed !== null &&
    conditions.windSpeed >= 35
  ) {
    score -= 30;
    hazards.push("Strong wind");
  } else if (
    conditions.windSpeed !== null &&
    conditions.windSpeed >= 25
  ) {
    score -= 18;
    hazards.push("Elevated wind");
  } else if (
    conditions.windSpeed !== null &&
    conditions.windSpeed >= 15
  ) {
    score -= 8;
  }

  if (
    conditions.waveHeight !== null &&
    conditions.waveHeight >= 4
  ) {
    score -= 40;
    hazards.push("Very high waves");
  } else if (
    conditions.waveHeight !== null &&
    conditions.waveHeight >= 3
  ) {
    score -= 30;
    hazards.push("High waves");
  } else if (
    conditions.waveHeight !== null &&
    conditions.waveHeight >= 2
  ) {
    score -= 18;
    hazards.push("Elevated waves");
  } else if (
    conditions.waveHeight !== null &&
    conditions.waveHeight >= 1.5
  ) {
    score -= 8;
  }

  if (
    conditions.rainfall !== null &&
    conditions.rainfall >= 25
  ) {
    score -= 15;
    hazards.push("Heavy rainfall");
  } else if (
    conditions.rainfall !== null &&
    conditions.rainfall >= 10
  ) {
    score -= 7;
    hazards.push("Rainfall");
  }

  // Route-specific exposure penalty.
  score -= routeMultiplier;

  score = Math.max(
    0,
    Math.min(100, Math.round(score))
  );

  return {
    score,
    hazards,
  };
}

/*
 * Check one route point against the existing
 * /api/geofence endpoint.
 */
async function checkGeofence(
  point: Point,
  request: Request
) {
  try {
    const url = new URL(
      `/api/geofence?lat=${point.latitude}&lon=${point.longitude}`,
      request.url
    );

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const destinationText =
      typeof body?.destination === "string"
        ? body.destination.trim()
        : "";

    if (!destinationText) {
      return NextResponse.json(
        {
          error: "Destination is required",
        },
        { status: 400 }
      );
    }

    /*
     * START = user's selected operating location.
     *
     * We deliberately do NOT hardcode Visakhapatnam.
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
        !Number.isFinite(Number(parsed.latitude)) ||
        !Number.isFinite(Number(parsed.longitude))
      ) {
        throw new Error("Invalid coordinates");
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

    /*
     * Convert destination text into coordinates.
     */
    const destination =
      await geocodeDestination(destinationText);

    /*
     * Get actual marine/weather conditions for the
     * selected operating area.
     */
    const conditions =
      await getMarineConditions(start);

    /*
     * Generate four different planning geometries.
     *
     * These are dynamic route candidates based on the
     * actual start/destination coordinates.
     */
    const routeDefinitions = [
      {
        id: "shortest",
        name: "Shortest Route" as const,
        tag: "Minimum geographic distance",
        offset: 0,
        speed: 24,
        exposure: 10,
      },
      {
        id: "fastest",
        name: "Fastest Route" as const,
        tag: "Minimum estimated travel time",
        offset: 0.025,
        speed: 27,
        exposure: 16,
      },
      {
        id: "safest",
        name: "Safest Route" as const,
        tag: "Lowest estimated hazard exposure",
        offset: 0.09,
        speed: 21,
        exposure: 0,
      },
      {
        id: "balanced",
        name: "Balanced Route" as const,
        tag: "Distance + time + safety balance",
        offset: 0.05,
        speed: 24,
        exposure: 6,
      },
    ];

    /*
     * Check every generated route geometry against
     * the existing geofence API.
     */
    const geofenceChecks = await Promise.all(
      routeDefinitions.map(async (definition) => {
        const geometry = interpolate(
          start,
          destination,
          definition.offset
        );

        const checks = await Promise.all(
          geometry.map((point) =>
            checkGeofence(point, request)
          )
        );

        return {
          routeId: definition.id,
          checks,
        };
      })
    );

    const routes: RouteCandidate[] =
      routeDefinitions.map((definition) => {
        const geometry = interpolate(
          start,
          destination,
          definition.offset
        );

        const distanceKm = routeDistance(geometry);

        const estimatedTimeMinutes =
          Math.max(
            1,
            Math.round(
              (distanceKm / definition.speed) * 60
            )
          );

        const fuelLitres =
          Number(
            (distanceKm * 0.43).toFixed(1)
          );

        const safety = calculateSafetyScore(
          conditions,
          definition.exposure
        );

        /*
         * Base marine/weather score.
         */
        const baseScore =
          safety.score === null
            ? 0
            : safety.score;

        /*
         * Get the geofence checks belonging to
         * this specific route.
         */
        const routeGeofence =
          geofenceChecks.find(
            (item) =>
              item.routeId === definition.id
          );

        const checks =
          routeGeofence?.checks ?? [];

        /*
         * Count confirmed geofence violations
         * and boundary approaches along the route.
         */
        const violationCount = checks.reduce(
          (count, check: any) =>
            count +
            Number(check?.violationCount ?? 0),
          0
        );

        const approachingCount = checks.reduce(
          (count, check: any) =>
            count +
            Number(check?.approachingCount ?? 0),
          0
        );

        const statuses = checks
          .map(
            (check: any) =>
              check?.geofenceStatus
          )
          .filter(Boolean);

        const geofenceStatus =
          statuses.includes("VIOLATION")
            ? "VIOLATION"
            : statuses.includes("APPROACHING")
            ? "APPROACHING"
            : statuses.length > 0
            ? statuses[0]
            : null;

        /*
         * Geofence-aware route scoring.
         *
         * A confirmed violation makes the route
         * effectively unusable.
         *
         * Approaching a boundary applies a smaller
         * penalty.
         *
         * Unavailable geofence data does NOT create
         * an artificial penalty.
         */
        const geofencePenalty =
          violationCount > 0
            ? 100
            : Math.min(
                20,
                approachingCount * 2
              );

        const score = Math.max(
          0,
          Math.min(
            100,
            baseScore - geofencePenalty
          )
        );

        const risk = riskLevel(score);

        const hazardExposure =
          risk === "CRITICAL"
            ? "CRITICAL"
            : risk === "HIGH"
            ? "HIGH"
            : risk === "MODERATE"
            ? "MODERATE"
            : "LOW";

        const hazards = [...safety.hazards];

        if (violationCount > 0) {
          hazards.push(
            "Route intersects a restricted geofence"
          );
        } else if (approachingCount > 0) {
          hazards.push(
            "Route approaches a geofence boundary"
          );
        }

        return {
          id: definition.id,
          name: definition.name,
          tag: definition.tag,
          geometry,
          distanceKm: Number(
            distanceKm.toFixed(1)
          ),
          estimatedTimeMinutes,
          fuelLitres,
          safetyScore: score,
          riskLevel: risk,
          hazardExposure,
          hazards,
          geofence: {
            available: checks.some(Boolean),
            checks,
            violationCount,
            approachingCount,
            status: geofenceStatus,
          },
          recommendation:
            violationCount > 0
              ? "Avoid this route because it intersects a restricted geofence."
              : risk === "CRITICAL"
              ? "Avoid this route under the available marine conditions."
              : risk === "HIGH"
              ? "This route has elevated marine risk. Consider a safer alternative."
              : risk === "MODERATE"
              ? "Proceed with caution and monitor marine conditions."
              : "Conditions are comparatively favourable for this route.",
        };
      });

    /*
     * Pick the safest candidate dynamically.
     *
     * This is NOT simply "Safe Route because its name says so".
     */
    const recommended =
      [...routes].sort(
        (a, b) =>
          b.safetyScore - a.safetyScore
      )[0];

    return NextResponse.json({
      live: true,

      source: {
        geocoding: "Open-Meteo Geocoding",
        marine: "Open-Meteo Marine",
        weather: "Open-Meteo Weather",
        geofence: "/api/geofence",
      },

      start: {
        name: start.name,
        latitude: start.latitude,
        longitude: start.longitude,
      },

      destination: {
        name: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
      },

      conditions,

      routes,

      recommendedRouteId:
        recommended?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Route optimization error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate marine routes.",
      },
      { status: 500 }
    );
  }
}