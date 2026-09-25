/**
 * ORCA — Multi-Source Data Fusion
 *
 * Item 22.1
 *
 * This layer combines already-available ORCA service outputs.
 * It does NOT fetch data, create new marine measurements, or
 * replace the existing safety/fishing/route engines.
 *
 * Missing values remain null/UNAVAILABLE.
 */

export type FusionStatus =
  | "AVAILABLE"
  | "PARTIAL"
  | "CONFLICT"
  | "UNAVAILABLE";

export type FusionSource = {
  name: string;
  status: FusionStatus;
  observedAt: string | null;
  source: string | null;
};

export type FusionInput = {
  weather?: Record<string, unknown> | null;
  ocean?: Record<string, unknown> | null;
  tide?: Record<string, unknown> | null;
  hazards?: Record<string, unknown> | null;
  geofence?: Record<string, unknown> | null;
  pfz?: Record<string, unknown> | null;
};

export type FusionResult = {
  generatedAt: string;
  status: FusionStatus;

  sources: FusionSource[];

  safety: {
    available: boolean;
    windSpeed: number | null;
    waveHeight: number | null;
    tideAvailable: boolean;
    activeHazards: string[];
    geofenceStatus: string;
    relationship:
      | "WIND_WAVE_TIDE_AVAILABLE"
      | "PARTIAL"
      | "UNAVAILABLE";
  };

  fishing: {
    available: boolean;
    pfzAvailable: boolean;
    geofenceStatus: string;
    relationship:
      | "PFZ_GEOFENCE_AVAILABLE"
      | "PFZ_AVAILABLE_GEOFENCE_UNAVAILABLE"
      | "PARTIAL"
      | "UNAVAILABLE";
  };

  routeRisk: {
    available: boolean;
    hazardCount: number;
    geofenceStatus: string;
    relationship:
      | "HAZARD_GEOFENCE_AVAILABLE"
      | "HAZARD_AVAILABLE_GEOFENCE_UNAVAILABLE"
      | "PARTIAL"
      | "UNAVAILABLE";
  };

  conflicts: {
    detected: boolean;
    items: string[];
  };

  missingSources: string[];
  evidence: string[];
};

function numberOrNull(value: unknown): number | null {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function stringOrNull(
  value: unknown
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function sourceStatus(
  value:
    | Record<string, unknown>
    | null
    | undefined
): FusionStatus {
  if (!value) return "UNAVAILABLE";

  const explicitStatus =
    stringOrNull(value.status)?.toUpperCase();

  if (
    explicitStatus === "UNAVAILABLE" ||
    explicitStatus === "FAILED"
  ) {
    return "UNAVAILABLE";
  }

  const hasError =
    typeof value.error === "string" ||
    value.live === false ||
    value.available === false;

  if (hasError) return "UNAVAILABLE";

  /*
   * A source should not be considered AVAILABLE merely
   * because its response contains metadata. Look for
   * actual usable evidence fields first.
   */
  const evidenceKeys = Object.keys(value).filter(
    (key) =>
      ![
        "source",
        "generatedAt",
        "retrievedAt",
        "updatedAt",
        "observedAt",
        "time",
        "status",
        "live",
      ].includes(key)
  );

  const hasUsableEvidence = evidenceKeys.some(
    (key) => {
      const field = value[key];

      if (
        field === null ||
        field === undefined ||
        field === ""
      ) {
        return false;
      }

      if (
        typeof field === "number" &&
        !Number.isFinite(field)
      ) {
        return false;
      }

      if (
        Array.isArray(field) &&
        field.length === 0
      ) {
        return false;
      }

      return true;
    }
  );

  return hasUsableEvidence
    ? "AVAILABLE"
    : "PARTIAL";
}

function sourceName(
  value:
    | Record<string, unknown>
    | null
    | undefined
): string | null {
  if (!value) return null;

  return stringOrNull(value.source);
}

function observedAt(
  value:
    | Record<string, unknown>
    | null
    | undefined
): string | null {
  if (!value) return null;

  for (const key of [
    "time",
    "observedAt",
    "generatedAt",
    "retrievedAt",
    "updatedAt",
  ]) {
    const candidate = stringOrNull(
      value[key]
    );

    if (candidate) return candidate;
  }

  return null;
}

function hazardNames(
  hazards:
    | Record<string, unknown>
    | null
    | undefined
): string[] {
  if (!hazards) return [];

  const items = Array.isArray(hazards.alerts)
    ? hazards.alerts
    : Array.isArray(hazards.hazards)
      ? hazards.hazards
      : [];

  return items
    .map((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const record =
        item as Record<string, unknown>;

      const severity =
        stringOrNull(record.severity);

      const title =
        stringOrNull(record.title) ??
        stringOrNull(record.type) ??
        "Marine hazard";

      return severity
        ? `${title} (${severity})`
        : title;
    })
    .filter(
      (value): value is string =>
        value !== null
    );
}

function geofenceStatus(
  geofence:
    | Record<string, unknown>
    | null
    | undefined
): string {
  if (!geofence) return "UNAVAILABLE";

  if (
    geofence.insideEEZ === true ||
    geofence.inside === true
  ) {
    return "INSIDE";
  }

  if (
    geofence.insideEEZ === false ||
    geofence.inside === false
  ) {
    return "OUTSIDE";
  }

  const warning =
    stringOrNull(geofence.warning);

  return warning
    ? warning.toUpperCase()
    : "UNAVAILABLE";
}

export function fuseMarineEvidence(
  input: FusionInput
): FusionResult {
  const generatedAt =
    new Date().toISOString();

  const weatherStatus =
    sourceStatus(input.weather);

  const oceanStatus =
    sourceStatus(input.ocean);

  const tideStatus =
    sourceStatus(input.tide);

  const hazardStatus =
    sourceStatus(input.hazards);

  const geofenceSourceStatus =
    sourceStatus(input.geofence);

  const pfzStatus =
    sourceStatus(input.pfz);

  const sources: FusionSource[] = [
    {
      name: "Weather",
      status: weatherStatus,
      observedAt:
        observedAt(input.weather),
      source:
        sourceName(input.weather),
    },
    {
      name: "Ocean",
      status: oceanStatus,
      observedAt:
        observedAt(input.ocean),
      source:
        sourceName(input.ocean),
    },
    {
      name: "Tide",
      status: tideStatus,
      observedAt:
        observedAt(input.tide),
      source:
        sourceName(input.tide),
    },
    {
      name: "Hazards",
      status: hazardStatus,
      observedAt:
        observedAt(input.hazards),
      source:
        sourceName(input.hazards),
    },
    {
      name: "Geofence",
      status:
        geofenceSourceStatus,
      observedAt:
        observedAt(input.geofence),
      source:
        sourceName(input.geofence),
    },
    {
      name: "PFZ",
      status: pfzStatus,
      observedAt:
        observedAt(input.pfz),
      source:
        sourceName(input.pfz),
    },
  ];

  const weatherCurrent =
    input.weather?.current &&
    typeof input.weather.current ===
      "object"
      ? (input.weather.current as Record<
          string,
          unknown
        >)
      : null;

  const oceanCurrent =
    input.ocean?.current &&
    typeof input.ocean.current ===
      "object"
      ? (input.ocean.current as Record<
          string,
          unknown
        >)
      : null;

  const windSpeed = numberOrNull(
    input.weather?.windSpeed ??
      weatherCurrent?.windSpeed
  );

  const waveHeight = numberOrNull(
    input.ocean?.waveHeight ??
      oceanCurrent?.waveHeight
  );

  const tideAvailable =
    input.tide != null &&
    tideStatus !== "UNAVAILABLE";

  const activeHazards =
    hazardNames(input.hazards);

  const currentGeofenceStatus =
    geofenceStatus(input.geofence);

  const safetyInputs = [
    windSpeed !== null,
    waveHeight !== null,
    tideAvailable,
  ].filter(Boolean).length;

  const safetyRelationship =
    safetyInputs === 3
      ? "WIND_WAVE_TIDE_AVAILABLE"
      : safetyInputs > 0
        ? "PARTIAL"
        : "UNAVAILABLE";

  const pfzAvailable =
    pfzStatus !== "UNAVAILABLE";

  const geofenceAvailable =
    geofenceSourceStatus !==
    "UNAVAILABLE";

  const fishingRelationship =
    pfzAvailable &&
    geofenceAvailable
      ? "PFZ_GEOFENCE_AVAILABLE"
      : pfzAvailable
        ? "PFZ_AVAILABLE_GEOFENCE_UNAVAILABLE"
        : geofenceAvailable
          ? "PARTIAL"
          : "UNAVAILABLE";

  const hazardAvailable =
    hazardStatus !== "UNAVAILABLE";

  const routeRelationship =
    hazardAvailable &&
    geofenceAvailable
      ? "HAZARD_GEOFENCE_AVAILABLE"
      : hazardAvailable
        ? "HAZARD_AVAILABLE_GEOFENCE_UNAVAILABLE"
        : geofenceAvailable
          ? "PARTIAL"
          : "UNAVAILABLE";

  const availableSources =
    sources.filter(
      (source) =>
        source.status !==
        "UNAVAILABLE"
    ).length;

  const missingSources =
    sources
      .filter(
        (source) =>
          source.status ===
          "UNAVAILABLE"
      )
      .map(
        (source) => source.name
      );

  const conflicts: string[] = [];

  // Only compare measurements that represent the same physical quantity.
  // Do not manufacture conflicts between unrelated datasets.
  const hazardConditions =
    input.hazards?.conditions &&
    typeof input.hazards.conditions ===
      "object"
      ? (input.hazards.conditions as Record<
          string,
          unknown
        >)
      : null;

  const hazardWind =
    numberOrNull(
      hazardConditions?.windSpeed
    );

  const hazardWave =
    numberOrNull(
      hazardConditions?.waveHeight
    );

  if (
    windSpeed !== null &&
    hazardWind !== null &&
    Math.abs(
      windSpeed - hazardWind
    ) > 5
  ) {
    conflicts.push(
      `Wind conflict: Weather reports ${windSpeed} km/h while Hazard evidence reports ${hazardWind} km/h.`
    );
  }

  if (
    waveHeight !== null &&
    hazardWave !== null &&
    Math.abs(
      waveHeight - hazardWave
    ) > 0.5
  ) {
    conflicts.push(
      `Wave conflict: Ocean reports ${waveHeight} m while Hazard evidence reports ${hazardWave} m.`
    );
  }

  const overallStatus: FusionStatus =
    availableSources === 0
      ? "UNAVAILABLE"
      : conflicts.length > 0
        ? "CONFLICT"
        : availableSources ===
            sources.length
          ? "AVAILABLE"
          : "PARTIAL";

  const evidence: string[] = [];

  if (
    missingSources.length > 0
  ) {
    evidence.push(
      `Unavailable source(s): ${missingSources.join(", ")}. Missing evidence was not converted to zero or assumed safe.`
    );
  }

  if (conflicts.length > 0) {
    evidence.push(
      `${conflicts.length} comparable measurement conflict(s) detected. Conflicting evidence is preserved rather than silently resolved.`
    );
  }

  if (
    safetyRelationship ===
    "WIND_WAVE_TIDE_AVAILABLE"
  ) {
    evidence.push(
      "Wind, wave and tide evidence are jointly available for safety analysis."
    );
  } else if (
    safetyRelationship ===
    "PARTIAL"
  ) {
    evidence.push(
      "Safety fusion is partial because one or more wind, wave or tide inputs are unavailable."
    );
  } else {
    evidence.push(
      "Safety fusion is unavailable because no usable wind, wave or tide inputs were supplied."
    );
  }

  if (
    pfzAvailable &&
    geofenceAvailable
  ) {
    evidence.push(
      "PFZ and geofence evidence can be evaluated together for spatial validity."
    );
  } else {
    evidence.push(
      "PFZ/geofence fusion is limited by unavailable source data."
    );
  }

  if (activeHazards.length > 0) {
    evidence.push(
      `${activeHazards.length} hazard condition(s) are present in the supplied hazard feed.`
    );
  } else if (
    hazardStatus === "AVAILABLE"
  ) {
    evidence.push(
      "Hazard feed is available with no active hazard entries supplied."
    );
  } else {
    evidence.push(
      "Hazard evidence is unavailable."
    );
  }

  return {
    generatedAt,
    status: overallStatus,
    sources,

    safety: {
      available:
        safetyRelationship !==
        "UNAVAILABLE",
      windSpeed,
      waveHeight,
      tideAvailable,
      activeHazards,
      geofenceStatus:
        currentGeofenceStatus,
      relationship:
        safetyRelationship,
    },

    fishing: {
      available:
        fishingRelationship !==
        "UNAVAILABLE",
      pfzAvailable,
      geofenceStatus:
        currentGeofenceStatus,
      relationship:
        fishingRelationship,
    },

    routeRisk: {
      available:
        routeRelationship !==
        "UNAVAILABLE",
      hazardCount:
        activeHazards.length,
      geofenceStatus:
        currentGeofenceStatus,
      relationship:
        routeRelationship,
    },

    conflicts: {
      detected:
        conflicts.length > 0,
      items: conflicts,
    },

    missingSources,
    evidence,
  };
}