export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type RiskFactor = {
  name: string;
  score: number;
  contribution: number;
  weight: number;
  level: RiskLevel;
  reason: string;
};

export type SafetyResult = {
  safetyScore: number;
  risk: RiskLevel;
  confidence: number;
  factors: RiskFactor[];
  recommendation: string;
  model: "Prototype Risk Model";
  availableFactorCount: number;
  expectedFactorCount: number;
};

const WEIGHTS = {
  Wind: 0.25,
  Wave: 0.30,
  Rainfall: 0.10,
  "Sea State": 0.10,
  Lightning: 0.10,
  Cyclone: 0.10,
  Tide: 0.05,
} as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function riskLevel(score: number): RiskLevel {
  if (score <= 25) return "CRITICAL";
  if (score <= 50) return "HIGH";
  if (score <= 75) return "MODERATE";
  return "LOW";
}

function factorLevel(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

function windRisk(value?: number | null) {
  if (!Number.isFinite(value)) return null;
  const wind = Number(value);
  if (wind >= 45) return 100;
  if (wind >= 35) return 85;
  if (wind >= 25) return 60;
  if (wind >= 15) return 30;
  return 10;
}

function waveRisk(value?: number | null) {
  if (!Number.isFinite(value)) return null;
  const wave = Number(value);
  if (wave >= 4) return 100;
  if (wave >= 3) return 85;
  if (wave >= 2) return 60;
  if (wave >= 1.5) return 35;
  return 10;
}

function rainRisk(value?: number | null) {
  if (!Number.isFinite(value)) return null;
  const rain = Number(value);
  if (rain >= 80) return 100;
  if (rain >= 60) return 70;
  if (rain >= 30) return 40;
  return 10;
}

function seaStateRisk(state?: string | null) {
  if (!state) return null;
  const value = state.toLowerCase();
  if (value.includes("phenomenal") || value.includes("very rough") || value.includes("high")) return 90;
  if (value.includes("rough")) return 70;
  if (value.includes("moderate")) return 40;
  if (value.includes("slight")) return 20;
  if (value.includes("calm")) return 5;
  return null;
}

function addFactor(
  factors: RiskFactor[],
  name: string,
  score: number | null,
  reason: string,
) {
  if (score === null || !Number.isFinite(score)) return;
  const weight = WEIGHTS[name as keyof typeof WEIGHTS];
  factors.push({
    name,
    score,
    contribution: 0,
    weight,
    level: factorLevel(score),
    reason,
  });
}

export function calculateMarineSafety(input: {
  windSpeed?: number | null;
  waveHeight?: number | null;
  rainfall?: number | null;
  seaState?: string | null;
  lightningRisk?: number | null;
  cycloneRisk?: number | null;
  tideRisk?: number | null;
  insideEEZ?: boolean | null;
  geofenceRisk?: number | null;
}): SafetyResult {
  const factors: RiskFactor[] = [];

  addFactor(factors, "Wind", windRisk(input.windSpeed), `Wind speed: ${input.windSpeed ?? "unavailable"} km/h`);
  addFactor(factors, "Wave", waveRisk(input.waveHeight), `Wave height: ${input.waveHeight ?? "unavailable"} m`);
  addFactor(factors, "Rainfall", rainRisk(input.rainfall), `Rain probability: ${input.rainfall ?? "unavailable"}%`);
  addFactor(factors, "Sea State", seaStateRisk(input.seaState), `Sea state: ${input.seaState ?? "unavailable"}`);
  addFactor(factors, "Lightning", input.lightningRisk ?? null, "Lightning hazard assessment");
  addFactor(factors, "Cyclone", input.cycloneRisk ?? null, "Cyclone hazard assessment");
  addFactor(factors, "Tide", input.tideRisk ?? null, "Tidal condition assessment");

  // Normalize by the weights of factors that are actually available.
  // This prevents missing data from silently becoming zero-risk data.
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);

  for (const factor of factors) {
    factor.contribution = totalWeight > 0
      ? Math.round((factor.score * factor.weight / totalWeight) * 100) / 100
      : 0;
  }

  let weightedRisk =
    totalWeight > 0
      ? factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight
      : null;

  let safetyScore = weightedRisk === null ? 0 : Math.round(clamp(100 - weightedRisk));

  // Geofence is an operational constraint rather than a weather factor.
  if (Number.isFinite(input.geofenceRisk)) {
    safetyScore = Math.round(clamp(safetyScore - Number(input.geofenceRisk)));
  }

  const risk = riskLevel(safetyScore);

  const expectedFactorCount = Object.keys(WEIGHTS).length;
  const availableFactorCount = factors.length;
  const confidence = Math.round((availableFactorCount / expectedFactorCount) * 100);

  let recommendation = "Current marine conditions appear favourable based on the available data.";
  if (risk === "MODERATE") {
    recommendation = "Exercise caution and monitor marine conditions before departure.";
  } else if (risk === "HIGH") {
    recommendation = "Fishing is not recommended under the current marine conditions.";
  } else if (risk === "CRITICAL") {
    recommendation = "Avoid departure. Current conditions indicate critical marine risk.";
  }

  if (availableFactorCount === 0) {
    recommendation = "Marine risk cannot be assessed because required live conditions are unavailable.";
  } else if (confidence < 60) {
    recommendation += " Risk confidence is reduced because some marine factors are unavailable.";
  }

  return {
    safetyScore,
    risk,
    confidence,
    factors,
    recommendation,
    model: "Prototype Risk Model",
    availableFactorCount,
    expectedFactorCount,
  };
}
