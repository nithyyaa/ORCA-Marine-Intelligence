import { NextResponse } from "next/server";

type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
type OverallSeverity = Severity | "SAFE";

type Hazard = {
  type: string;
  severity: Severity;
  title: string;
  message: string;
  value?: number | null;
  previousValue?: number | null;
  unit?: string;
  source?: string;
  observedAt?: string;
  expiresAt?: string | null;
  confidence?: number | null;
  location?: string | null;
  prediction?: boolean;
};

const severityRank: Record<OverallSeverity, number> = {
  SAFE: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function maxSeverity(a: OverallSeverity, b: OverallSeverity): OverallSeverity {
  return severityRank[a] >= severityRank[b] ? a : b;
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function tagValue(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : null;
}

function locationMatches(area: string, location: string): boolean {
  const a = area.toLowerCase();
  const l = location.toLowerCase();
  const words = l.split(/[,\s]+/).filter((x) => x.length >= 4).slice(0, 4);
  return words.some((word) => a.includes(word));
}

async function fetchCycloneAlerts(location: string): Promise<{
  hazards: Hazard[];
  available: boolean;
  source: string | null;
}> {
  const feeds = [
    {
      url: "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml",
      source: "NDMA SACHET CAP / IMD alert feed",
    },
    {
      url: "https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml",
      source: "IMD CAP feed",
    },
  ];

  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url, { cache: "no-store" });
      if (!response.ok) continue;

      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
      const hazards: Hazard[] = [];

      for (const item of items) {
        const title = tagValue(item, "title") ?? "";
        const description = tagValue(item, "description") ?? "";
        const area = tagValue(item, "areaDesc") ?? "";
        const event = tagValue(item, "event") ?? "";
        const text = `${title} ${description} ${area} ${event}`.toLowerCase();

        if (!/(cyclone|cyclonic storm|deep depression|depression)/i.test(text)) continue;
        if (area && !locationMatches(area, location) && !/india|nationwide|all india/i.test(area)) continue;

        const severe = /extremely severe|very severe|super cyclonic|severe cyclonic/i.test(text);
        const severity: Severity = severe ? "CRITICAL" : "HIGH";

        hazards.push({
          type: "CYCLONE",
          severity,
          title: severe ? "Severe Cyclone Warning" : "Cyclone Warning",
          message: `${title || event || "Cyclone-related official alert"}${area ? ` Area: ${area}.` : "."}`,
          source: feed.source,
          observedAt: new Date().toISOString(),
          expiresAt: null,
          confidence: 95,
          location: area || location,
          prediction: true,
        });
      }

      return { hazards: hazards.slice(0, 5), available: true, source: feed.source };
    } catch {
      continue;
    }
  }

  return { hazards: [], available: false, source: null };
}

async function fetchLightning(latitude: number, longitude: number): Promise<{
  hazards: Hazard[];
  available: boolean;
}> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/ecmwf");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("hourly", "lightning_density");
    url.searchParams.set("forecast_hours", "2");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { hazards: [], available: false };

    const data = await response.json();
    const values = Array.isArray(data?.hourly?.lightning_density)
      ? data.hourly.lightning_density
      : [];
    const value = values.map(num).filter((v: number | null): v is number => v !== null)[0] ?? null;

    if (value === null) return { hazards: [], available: false };

    let severity: Severity | null = null;
    if (value > 0.5) severity = "CRITICAL";
    else if (value > 0.1) severity = "HIGH";
    else if (value > 0.01) severity = "MODERATE";

    if (!severity) return { hazards: [], available: true };

    return {
      available: true,
      hazards: [{
        type: "LIGHTNING",
        severity,
        title: "Lightning Hazard",
        message: `Forecast lightning density is ${value}. Exercise caution at sea.`,
        value,
        unit: "lightning density",
        source: "Open-Meteo ECMWF",
        observedAt: new Date().toISOString(),
        expiresAt: null,
        confidence: 75,
        location: `${latitude}, ${longitude}`,
        prediction: true,
      }],
    };
  } catch {
    return { hazards: [], available: false };
  }
}

async function fetchDirectWeather(latitude: number, longitude: number): Promise<{
  precipitation: number | null;
  weatherCode: number | null;
  available: boolean;
}> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "precipitation,weather_code");
    url.searchParams.set("hourly", "precipitation,weather_code");
    url.searchParams.set("forecast_hours", "2");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { precipitation: null, weatherCode: null, available: false };

    const data = await response.json();
    const currentPrecipitation = num(data?.current?.precipitation);
    const currentWeatherCode = num(data?.current?.weather_code);
    const hourlyPrecipitation = Array.isArray(data?.hourly?.precipitation)
      ? data.hourly.precipitation.map(num).find((v: number | null): v is number => v !== null) ?? null
      : null;
    const hourlyWeatherCode = Array.isArray(data?.hourly?.weather_code)
      ? data.hourly.weather_code.map(num).find((v: number | null): v is number => v !== null) ?? null
      : null;

    return {
      precipitation: currentPrecipitation ?? hourlyPrecipitation,
      weatherCode: currentWeatherCode ?? hourlyWeatherCode,
      available: true,
    };
  } catch {
    return { precipitation: null, weatherCode: null, available: false };
  }
}

async function fetchDirectMarine(latitude: number, longitude: number): Promise<{
  waveHeight: number | null;
  available: boolean;
}> {
  try {
    const url = new URL("https://marine-api.open-meteo.com/v1/marine");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "wave_height");
    url.searchParams.set("hourly", "wave_height");
    url.searchParams.set("forecast_hours", "2");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { waveHeight: null, available: false };

    const data = await response.json();
    const currentWave = num(data?.current?.wave_height);
    const hourlyWave = Array.isArray(data?.hourly?.wave_height)
      ? data.hourly.wave_height.map(num).find((v: number | null): v is number => v !== null) ?? null
      : null;

    return {
      waveHeight: currentWave ?? hourlyWave,
      available: currentWave !== null || hourlyWave !== null,
    };
  } catch {
    return { waveHeight: null, available: false };
  }
}

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";
  const fetchOptions = {
    cache: "no-store" as const,
    headers: { Cookie: cookie },
  };

  try {
    const [weatherRes, oceanRes] = await Promise.all([
      fetch(`${baseUrl}/api/weather`, fetchOptions),
      fetch(`${baseUrl}/api/ocean`, fetchOptions),
    ]);

    const weather = await weatherRes.json();
    const ocean = await oceanRes.json();

    const latitude = num(weather?.latitude);
    const longitude = num(weather?.longitude);

    const geofenceRes =
      latitude !== null && longitude !== null
        ? await fetch(
            `${baseUrl}/api/geofence?lat=${latitude}&lon=${longitude}`,
            fetchOptions
          ).catch(() => null)
        : null;

    if (!weatherRes.ok || !oceanRes.ok) {
      return NextResponse.json({
        live: false,
        alerts: [],
        hazards: [],
        message: "Marine hazard data is currently unavailable.",
      });
    }

    const geofence = geofenceRes?.ok ? await geofenceRes.json() : null;
    const location = weather?.location ?? "Selected location";
    const observedAt = new Date().toISOString();
    const hazards: Hazard[] = [];

    const windSpeed = num(weather?.windSpeed);
    const directMarine = latitude !== null && longitude !== null
      ? await fetchDirectMarine(latitude, longitude)
      : { waveHeight: null, available: false };
    const waveHeight = num(ocean?.waveHeight) ?? directMarine.waveHeight;

    if (windSpeed !== null) {
      if (windSpeed >= 45) hazards.push({ type: "EXTREME_WIND", severity: "CRITICAL", title: "Critical Wind Hazard", message: `Wind speed is ${windSpeed} km/h. Marine operations should be avoided.`, value: windSpeed, unit: "km/h", source: weather.source, observedAt, confidence: 90, location });
      else if (windSpeed >= 35) hazards.push({ type: "HIGH_WIND", severity: "HIGH", title: "High Wind Warning", message: `Wind speed is ${windSpeed} km/h. Small-vessel operations may be unsafe.`, value: windSpeed, unit: "km/h", source: weather.source, observedAt, confidence: 90, location });
      else if (windSpeed >= 20) hazards.push({ type: "STRONG_WIND", severity: "MODERATE", title: "Strong Wind", message: `Wind speed is ${windSpeed} km/h. Exercise caution at sea.`, value: windSpeed, unit: "km/h", source: weather.source, observedAt, confidence: 90, location });
    }

    if (waveHeight !== null) {
      if (waveHeight >= 4) hazards.push({ type: "EXTREME_WAVES", severity: "CRITICAL", title: "Critical Wave Hazard", message: `Wave height is ${waveHeight} m. Sea conditions are potentially dangerous.`, value: waveHeight, unit: "m", source: ocean.source, observedAt, confidence: 90, location });
      else if (waveHeight >= 3) hazards.push({ type: "HIGH_WAVES", severity: "HIGH", title: "High Wave Alert", message: `Wave height is ${waveHeight} m. Dangerous sea conditions may exist.`, value: waveHeight, unit: "m", source: ocean.source, observedAt, confidence: 90, location });
      else if (waveHeight >= 1.5) hazards.push({ type: "ROUGH_SEA", severity: "MODERATE", title: "Rough Sea Conditions", message: `Wave height is ${waveHeight} m. Mariners should exercise caution.`, value: waveHeight, unit: "m", source: ocean.source, observedAt, confidence: 90, location });
    }

    const directWeather = latitude !== null && longitude !== null
      ? await fetchDirectWeather(latitude, longitude)
      : { precipitation: null, weatherCode: null, available: false };

    const rainfall = directWeather.precipitation;
    if (rainfall !== null) {
      if (rainfall >= 50) hazards.push({ type: "HEAVY_RAIN", severity: "HIGH", title: "Heavy Rainfall Warning", message: `Rainfall is ${rainfall} mm. Visibility and marine conditions may deteriorate.`, value: rainfall, unit: "mm", source: "Open-Meteo", observedAt, confidence: 90, location });
      else if (rainfall >= 25) hazards.push({ type: "HEAVY_RAIN", severity: "MODERATE", title: "Heavy Rainfall", message: `Rainfall is ${rainfall} mm. Exercise caution due to reduced visibility.`, value: rainfall, unit: "mm", source: "Open-Meteo", observedAt, confidence: 90, location });
    }

    if (directWeather.weatherCode !== null && directWeather.weatherCode >= 95) {
      hazards.push({
        type: "THUNDERSTORM",
        severity: directWeather.weatherCode >= 99 ? "HIGH" : "MODERATE",
        title: "Thunderstorm Hazard",
        message: "Thunderstorm conditions are indicated by the current weather model.",
        value: directWeather.weatherCode,
        unit: "WMO weather code",
        source: "Open-Meteo",
        observedAt,
        confidence: 80,
        location,
        prediction: true,
      });
    }

    if (waveHeight !== null && waveHeight >= 2 || windSpeed !== null && windSpeed >= 30) {
      hazards.push({
        type: "HAZARDOUS_SEA",
        severity: waveHeight !== null && waveHeight >= 4 || windSpeed !== null && windSpeed >= 45 ? "CRITICAL" : "HIGH",
        title: "Hazardous Sea Conditions",
        message: "Combined wind and wave conditions may create unsafe marine conditions.",
        source: "Open-Meteo weather/marine data",
        observedAt,
        confidence: 85,
        location,
      });
    }

    const cyclone = latitude !== null && longitude !== null
      ? await fetchCycloneAlerts(location)
      : { hazards: [], available: false, source: null };
    hazards.push(...cyclone.hazards);

    const lightning = latitude !== null && longitude !== null
      ? await fetchLightning(latitude, longitude)
      : { hazards: [], available: false };
    hazards.push(...lightning.hazards);

    const geofenceWarning = typeof geofence?.warning === "string" ? geofence.warning : null;
    if (geofenceWarning === "OUTSIDE_EEZ") {
      hazards.push({ type: "GEOFENCE_VIOLATION", severity: "HIGH", title: "Restricted Maritime Zone", message: "Current operating location is outside the Indian EEZ.", source: geofence?.source, observedAt, confidence: 100, location });
    } else if (geofenceWarning && geofenceWarning !== "SAFE") {
      hazards.push({ type: "GEOFENCE_WARNING", severity: "MODERATE", title: "Geofence Warning", message: "The vessel is approaching or operating near a restricted maritime boundary.", source: geofence?.source, observedAt, confidence: 100, location });
    }

    let overallSeverity: OverallSeverity = "SAFE";
    for (const hazard of hazards) overallSeverity = maxSeverity(overallSeverity, hazard.severity);

    const alerts = hazards.length > 0 ? hazards : [{
      type: "NO_MAJOR_ALERT",
      severity: "LOW" as Severity,
      title: "No Major Marine Alerts",
      message: "No major hazards were detected from the currently available marine data.",
      observedAt,
      confidence: 70,
      location,
    }];

    return NextResponse.json({
      live: true,
      location,
      latitude,
      longitude,
      overallSeverity,
      riskLevel: overallSeverity,
      recommendation:
        overallSeverity === "CRITICAL"
          ? "Avoid marine operations and follow official warnings."
          : overallSeverity === "HIGH"
            ? "Exercise strong caution and check official marine advisories before operating."
            : overallSeverity === "MODERATE"
              ? "Exercise caution and continue monitoring marine conditions."
              : "No major hazards detected from the available evidence.",
      generatedAt: observedAt,
      hazards,
      alerts,
      proactiveMonitoring: {
        enabled: true,
        checks: ["Risk increase", "Wind increase", "Wave increase", "Cyclone", "Lightning", "Restricted-zone warning"],
      },
      dataAvailability: {
        wind: windSpeed !== null,
        waves: waveHeight !== null,
        rainfall: rainfall !== null,
        cyclone: cyclone.available,
        lightning: lightning.available,
        geofence: geofence !== null,
      },
      conditions: { windSpeed, waveHeight, rainfall },
      sources: {
        weather: weather.source ?? "Open-Meteo",
        ocean: ocean.source ?? (directMarine.available ? "Open-Meteo Marine API (direct fallback)" : "Open-Meteo Marine API"),
        rainfall: "Open-Meteo",
        cyclone: cyclone.source ?? (cyclone.available ? "NDMA SACHET CAP / IMD alert feed" : null),
        lightning: lightning.available ? "Open-Meteo ECMWF" : null,
        geofence: geofence?.source ?? null,
      },
      prototypeModel: true,
    });
  } catch (error) {
    console.error("Marine hazard error:", error);
    return NextResponse.json(
      { live: false, alerts: [], hazards: [], error: "Unable to generate marine alerts" },
      { status: 500 }
    );
  }
}
