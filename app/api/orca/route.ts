import { NextResponse } from "next/server";

function detectIntent(query: string) {
  const q = query.toLowerCase();

  if (
    q.includes("safe") ||
    q.includes("risk") ||
    q.includes("danger")
  ) {
    return "SAFETY";
  }

  if (
    q.includes("fish") ||
    q.includes("pfz") ||
    q.includes("fishing zone")
  ) {
    return "FISHING";
  }

  if (
    q.includes("weather") ||
    q.includes("wind") ||
    q.includes("rain")
  ) {
    return "WEATHER";
  }

  if (
    q.includes("ocean") ||
    q.includes("wave") ||
    q.includes("sea") ||
    q.includes("sst")
  ) {
    return "OCEAN";
  }

  if (q.includes("tide")) {
    return "TIDE";
  }

  if (
    q.includes("route") ||
    q.includes("travel")
  ) {
    return "ROUTE";
  }

  return "GENERAL";
}

function extractTime(query: string) {
  const match = query.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i
  );

  if (!match) return null;

  return match[0];
}

function selectAgent(intent: string) {
  const agents: Record<string, string> = {
    SAFETY: "Validation/Safety Agent",
    FISHING: "Fishing/PFZ Agent",
    WEATHER: "Weather Agent",
    OCEAN: "Ocean Agent",
    TIDE: "Tide Agent",
    ROUTE: "Route Optimization Agent",
    GENERAL: "Planner/Orchestrator",
  };

  return agents[intent];
}

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Query is required" },
      { status: 400 }
    );
  }

  const intent = detectIntent(query);
  const time = extractTime(query);
  const agent = selectAgent(intent);

  let response =
    "I can help analyze marine conditions for Visakhapatnam.";
    if (intent === "GENERAL") {
  try {
    const alertsRes = await fetch(
      "http://localhost:3001/api/alerts",
      {
        cache: "no-store",
      }
    );

    const alerts = await alertsRes.json();

    if (alerts.live && alerts.alerts?.length) {
      const alert = alerts.alerts[0];

      response =
        `⚠️ Marine alert status for Visakhapatnam: ` +
        `${alert.title}. ${alert.message}`;
    } else {
      response =
        "No major marine alerts are currently available for Visakhapatnam.";
    }
  } catch {
    response =
      "⚠️ ORCA could not retrieve the latest marine alerts.";
  }
}

 if (intent === "SAFETY") {
  try {
    const safetyRes = await fetch(
      "http://localhost:3001/api/safety",
      {
        cache: "no-store",
      }
    );

    const safety = await safetyRes.json();

    if (safety.live) {
      response =
        `🛟 Marine Safety Assessment for Visakhapatnam: ` +
        `Risk level: ${safety.risk}. ` +
        `Safety score: ${safety.safetyScore}/100. ` +
        `Wind speed: ${safety.conditions.windSpeed} km/h. ` +
        `Wave height: ${safety.conditions.waveHeight} m. ` +
        `${safety.recommendation}`;
    } else {
      response =
        "⚠️ ORCA could not calculate the current marine safety conditions.";
    }
  } catch {
    response =
      "⚠️ ORCA could not connect to the marine safety service.";
  }
}
 if (intent === "FISHING") {
  try {
    const pfzRes = await fetch(
      "http://localhost:3001/api/pfz",
      {
        cache: "no-store",
      }
    );

    const pfz = await pfzRes.json();

    if (pfz.zones?.length) {
      const bestZone = pfz.zones
        .filter(
          (zone: {
            suitability: string;
          }) => zone.suitability === "HIGH"
        )
        .sort(
          (
            a: { confidence: number },
            b: { confidence: number }
          ) => b.confidence - a.confidence
        )[0];

      if (bestZone) {
        response =
          `🎣 Best potential fishing zone: ${bestZone.id}. ` +
          `Suitability is ${bestZone.suitability} ` +
          `with ${(bestZone.confidence * 100).toFixed(0)}% confidence. ` +
          `It is approximately ${bestZone.distanceFromCoast} km from the coast. ` +
          `Estimated catch potential: ${bestZone.estimatedCatchPotential}. ` +
          `SST: ${bestZone.factors.seaSurfaceTemperature}°C, ` +
          `chlorophyll: ${bestZone.factors.chlorophyll}.`;
      } else {
        response =
          "🎣 PFZ data was retrieved, but no highly suitable zone was found.";
      }
    } else {
      response =
        "⚠️ No potential fishing zone data is currently available.";
    }
  } catch {
    response =
      "⚠️ ORCA could not retrieve PFZ information.";
  }
}

  if (intent === "WEATHER") {
    try {
      const weatherRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=17.6868&longitude=83.2185&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FKolkata",
        { cache: "no-store" }
      );

      const weather = await weatherRes.json();

      response =
        `🌦️ Current weather for Visakhapatnam: ` +
        `${weather.current?.temperature_2m}°C with wind speed of ` +
        `${weather.current?.wind_speed_10m} km/h. ` +
        `Wind direction is ${weather.current?.wind_direction_10m}°.`;
    } catch {
      response = "⚠️ Unable to retrieve current weather data.";
    }
  }

  if (intent === "OCEAN") {
    try {
      const oceanRes = await fetch(
        "https://marine-api.open-meteo.com/v1/marine?latitude=17.6868&longitude=83.2185&current=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=Asia%2FKolkata",
        { cache: "no-store" }
      );

      const ocean = await oceanRes.json();

      response =
        `🌊 Current ocean conditions for Visakhapatnam: ` +
        `Wave height: ${ocean.current?.wave_height ?? "N/A"} m, ` +
        `wave direction: ${ocean.current?.wave_direction ?? "N/A"}°, ` +
        `wave period: ${ocean.current?.wave_period ?? "N/A"} s, ` +
        `sea surface temperature: ${ocean.current?.sea_surface_temperature ?? "N/A"}°C.`;
    } catch {
      response =
        "⚠️ Unable to retrieve current ocean conditions.";
    }
  }

 if (intent === "TIDE") {
  try {
    const tideRes = await fetch(
      "http://localhost:3001/api/tide",
      {
        cache: "no-store",
      }
    );

    const tide = await tideRes.json();

    if (tide.tides?.length) {
      const tideSummary = tide.tides
        .map(
          (t: {
            type: string;
            time: string;
            height: number;
          }) =>
            `${t.type} at ${t.time} (${t.height} m)`
        )
        .join(", ");

      response =
        `🌊 Tide conditions for Visakhapatnam: ${tideSummary}.`;
    } else {
      response =
        "⚠️ No tide information is currently available.";
    }
  } catch {
    response =
      "⚠️ ORCA could not retrieve tide information.";
  }
}

  if (intent === "ROUTE") {
  try {
    const routeRes = await fetch(
      "http://localhost:3001/api/route",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: "Visakhapatnam",
          destination: "PFZ-01",
        }),
        cache: "no-store",
      }
    );

    const routeData = await routeRes.json();

    if (routeData.route) {
      const route = routeData.route;

      response =
        `🧭 Route recommendation from ${route.start} to ${route.destination}: ` +
        `approximately ${route.distanceKm} km, ` +
        `estimated travel time ${route.estimatedTimeMinutes} minutes. ` +
        `Risk level: ${route.riskLevel}. ` +
        `Hazards: ${route.hazards.join(", ")}. ` +
        `${route.recommendation}`;
    } else {
      response =
        "⚠️ Unable to calculate the marine route.";
    }
  } catch {
    response =
      "⚠️ ORCA could not connect to the route optimization service.";
  }
}

  return NextResponse.json({
    response,
    intent,
    agent,
    extracted: {
      location: "Visakhapatnam, India",
      time,
    },
    confidence: 0.91,
    prototype: true,
  });
}