import { NextResponse } from "next/server";

type AlertSeverity =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL";

type Alert = {
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  value?: number | null;
  previousValue?: number | null;
  unit?: string;
  source?: string;
};

// Prototype state used to detect changes between requests.
let previousConditions: {
  windSpeed: number | null;
  waveHeight: number | null;
  overallSeverity: AlertSeverity | "SAFE";
} | null = null;

export async function GET(request: Request) {
  try {
    const baseUrl = new URL(request.url).origin;
    const cookie = request.headers.get("cookie") ?? "";

    const fetchOptions = {
      cache: "no-store" as const,
      headers: {
        Cookie: cookie,
      },
    };

    const [weatherRes, oceanRes] =
      await Promise.all([
        fetch(`${baseUrl}/api/weather`, fetchOptions),
        fetch(`${baseUrl}/api/ocean`, fetchOptions),
      ]);

      const weather = await weatherRes.json();
      const ocean = await oceanRes.json();

      const geofenceRes =
        typeof weather.latitude === "number" &&
        typeof weather.longitude === "number"
          ? await fetch(
              `${baseUrl}/api/geofence?lat=${weather.latitude}&lon=${weather.longitude}`,
              fetchOptions
            ).catch(() => null)
          : null;

    if (!weatherRes.ok || !oceanRes.ok) {
      return NextResponse.json({
        live: false,
        alerts: [],
        message:
          "Marine hazard data is currently unavailable.",
      });
    }

    const geofence =
      geofenceRes?.ok
        ? await geofenceRes.json()
        : null;

    const alerts: Alert[] = [];

    const windSpeed =
      typeof weather.windSpeed === "number"
        ? weather.windSpeed
        : null;

    const waveHeight =
      typeof ocean.waveHeight === "number"
        ? ocean.waveHeight
        : null;

    const rainfall =
      typeof weather.rainfall === "number"
        ? weather.rainfall
        : null;

    /*
     * WIND HAZARDS
     */

    if (windSpeed !== null) {
      if (windSpeed >= 45) {
        alerts.push({
          type: "EXTREME_WIND",
          severity: "CRITICAL",
          title: "Critical Wind Hazard",
          message: `Wind speed is ${windSpeed} km/h. Marine operations should be avoided.`,
          value: windSpeed,
          unit: "km/h",
          source: weather.source,
        });
      } else if (windSpeed >= 35) {
        alerts.push({
          type: "HIGH_WIND",
          severity: "HIGH",
          title: "High Wind Warning",
          message: `Wind speed is ${windSpeed} km/h. Small-vessel operations may be unsafe.`,
          value: windSpeed,
          unit: "km/h",
          source: weather.source,
        });
      } else if (windSpeed >= 20) {
        alerts.push({
          type: "STRONG_WIND",
          severity: "MODERATE",
          title: "Strong Wind",
          message: `Wind speed is ${windSpeed} km/h. Exercise caution at sea.`,
          value: windSpeed,
          unit: "km/h",
          source: weather.source,
        });
      }
    }

    /*
     * WAVE HAZARDS
     */

    if (waveHeight !== null) {
      if (waveHeight >= 4) {
        alerts.push({
          type: "EXTREME_WAVES",
          severity: "CRITICAL",
          title: "Critical Wave Hazard",
          message: `Wave height is ${waveHeight} m. Sea conditions are potentially dangerous.`,
          value: waveHeight,
          unit: "m",
          source: ocean.source,
        });
      } else if (waveHeight >= 3) {
        alerts.push({
          type: "HIGH_WAVES",
          severity: "HIGH",
          title: "High Wave Alert",
          message: `Wave height is ${waveHeight} m. Dangerous sea conditions may exist.`,
          value: waveHeight,
          unit: "m",
          source: ocean.source,
        });
      } else if (waveHeight >= 1.5) {
        alerts.push({
          type: "ROUGH_SEA",
          severity: "MODERATE",
          title: "Rough Sea Conditions",
          message: `Wave height is ${waveHeight} m. Mariners should exercise caution.`,
          value: waveHeight,
          unit: "m",
          source: ocean.source,
        });
      }
    }

    /*
     * RAINFALL
     *
     * Only actual rainfall is used.
     * Precipitation probability is NOT treated as rainfall.
     */

    if (rainfall !== null) {
      if (rainfall >= 50) {
        alerts.push({
          type: "HEAVY_RAIN",
          severity: "HIGH",
          title: "Heavy Rainfall Warning",
          message: `Rainfall is ${rainfall} mm. Visibility and marine conditions may deteriorate.`,
          value: rainfall,
          unit: "mm",
          source: weather.source,
        });
      } else if (rainfall >= 25) {
        alerts.push({
          type: "HEAVY_RAIN",
          severity: "MODERATE",
          title: "Heavy Rainfall",
          message: `Rainfall is ${rainfall} mm. Exercise caution due to reduced visibility.`,
          value: rainfall,
          unit: "mm",
          source: weather.source,
        });
      }
    }

    /*
     * CYCLONE
     *
     * Only generate this alert if actual cyclone-risk
     * data exists.
     */

    const cycloneAvailable =
      typeof weather.cycloneRisk === "number";

    if (
      cycloneAvailable &&
      weather.cycloneRisk >= 75
    ) {
      alerts.push({
        type: "CYCLONE",
        severity: "CRITICAL",
        title: "Cyclone Hazard",
        message:
          "Cyclone conditions indicate critical marine risk.",
        value: weather.cycloneRisk,
        unit: "risk score",
        source: weather.source,
      });
    } else if (
      cycloneAvailable &&
      weather.cycloneRisk >= 50
    ) {
      alerts.push({
        type: "CYCLONE",
        severity: "HIGH",
        title: "Cyclone Warning",
        message:
          "Cyclone activity may affect marine operations.",
        value: weather.cycloneRisk,
        unit: "risk score",
        source: weather.source,
      });
    }

    /*
     * LIGHTNING
     *
     * Only generate this alert if actual lightning-risk
     * data exists.
     */

    const lightningAvailable =
      typeof weather.lightningRisk === "number";

    if (
      lightningAvailable &&
      weather.lightningRisk >= 75
    ) {
      alerts.push({
        type: "LIGHTNING",
        severity: "HIGH",
        title: "Lightning Hazard",
        message:
          "Elevated lightning risk detected. Exercise caution at sea.",
        value: weather.lightningRisk,
        unit: "risk score",
        source: weather.source,
      });
    }

    /*
     * GEOFENCE / RESTRICTED ZONE
     */

    const geofenceWarning =
      typeof geofence?.warning === "string"
        ? geofence.warning
        : null;

    if (geofenceWarning === "OUTSIDE_EEZ") {
      alerts.push({
        type: "GEOFENCE_VIOLATION",
        severity: "HIGH",
        title: "Restricted Maritime Zone",
        message:
          "Current operating location is outside the Indian EEZ.",
        source: geofence?.source,
      });
    } else if (
      geofenceWarning &&
      geofenceWarning !== "SAFE"
    ) {
      alerts.push({
        type: "GEOFENCE_WARNING",
        severity: "MODERATE",
        title: "Geofence Warning",
        message:
          "The vessel is approaching or operating near a restricted maritime boundary.",
        source: geofence?.source,
      });
    }

    /*
     * DETERMINE CURRENT OVERALL SEVERITY
     */

    let overallSeverity:
      | "SAFE"
      | "MODERATE"
      | "HIGH"
      | "CRITICAL" = "SAFE";

    if (
      alerts.some(
        (alert) => alert.severity === "CRITICAL"
      )
    ) {
      overallSeverity = "CRITICAL";
    } else if (
      alerts.some(
        (alert) => alert.severity === "HIGH"
      )
    ) {
      overallSeverity = "HIGH";
    } else if (
      alerts.some(
        (alert) => alert.severity === "MODERATE"
      )
    ) {
      overallSeverity = "MODERATE";
    }

    /*
     * PROACTIVE CHANGE DETECTION
     *
     * Detect increasing wind, increasing waves,
     * and increasing overall risk.
     */

    if (previousConditions) {
      const previousWind =
        previousConditions.windSpeed;

      const previousWave =
        previousConditions.waveHeight;

      if (
        windSpeed !== null &&
        previousWind !== null &&
        windSpeed > previousWind + 2
      ) {
        alerts.push({
          type: "WIND_INCREASE",
          severity: "MODERATE",
          title: "Wind Conditions Worsening",
          message: `Wind increased from ${previousWind} km/h to ${windSpeed} km/h.`,
          value: windSpeed,
          previousValue: previousWind,
          unit: "km/h",
          source: weather.source,
        });
      }

      if (
        waveHeight !== null &&
        previousWave !== null &&
        waveHeight > previousWave + 0.2
      ) {
        alerts.push({
          type: "WAVE_INCREASE",
          severity: "MODERATE",
          title: "Wave Conditions Worsening",
          message: `Wave height increased from ${previousWave} m to ${waveHeight} m.`,
          value: waveHeight,
          previousValue: previousWave,
          unit: "m",
          source: ocean.source,
        });
      }

     const severityRank = {
  SAFE: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4,
};

      if (
        severityRank[overallSeverity] >
        severityRank[previousConditions.overallSeverity]
      ) {
        alerts.push({
          type: "RISK_INCREASE",
          severity: overallSeverity === "CRITICAL"
            ? "CRITICAL"
            : overallSeverity === "HIGH"
              ? "HIGH"
              : "MODERATE",
          title: "Marine Risk Increased",
          message: `Overall marine risk increased from ${previousConditions.overallSeverity} to ${overallSeverity}.`,
        });
      }
    }

    /*
     * SAVE CURRENT STATE FOR THE NEXT CHECK.
     */

    previousConditions = {
      windSpeed,
      waveHeight,
      overallSeverity,
    };

    /*
     * If no hazards exist, provide a clear status.
     */

    if (alerts.length === 0) {
      alerts.push({
        type: "NO_MAJOR_ALERT",
        severity: "LOW",
        title: "No Major Marine Alerts",
        message:
          "No major hazards were detected from the currently available marine data.",
      });
    }

    return NextResponse.json({
      live: true,

      location: weather.location ?? "Unknown",

      latitude: weather.latitude ?? null,
      longitude: weather.longitude ?? null,

      overallSeverity,

      generatedAt: new Date().toISOString(),

      alerts,

      proactiveMonitoring: {
        enabled: true,
        previousStateAvailable:
          previousConditions !== null,
        checks: [
          "Risk increase",
          "Wind increase",
          "Wave increase",
          "Cyclone",
          "Lightning",
          "Restricted-zone warning",
        ],
      },

      dataAvailability: {
        wind: windSpeed !== null,
        waves: waveHeight !== null,
        rainfall: rainfall !== null,
        cyclone: cycloneAvailable,
        lightning: lightningAvailable,
        geofence: geofence !== null,
      },

      conditions: {
        windSpeed,
        waveHeight,
        rainfall,
      },

      sources: {
        weather: weather.source ?? null,
        ocean: ocean.source ?? null,
        geofence: geofence?.source ?? null,
      },
    });
  } catch (error) {
    console.error("Marine alerts error:", error);

    return NextResponse.json(
      {
        live: false,
        alerts: [],
        error: "Unable to generate marine alerts",
      },
      { status: 500 }
    );
  }
}