export type MarineIntent =
  | "FISHING_SAFETY"
  | "FISHING_PFZ"
  | "WEATHER"
  | "OCEAN_CONDITIONS"
  | "TIDE"
  | "HAZARD"
  | "ROUTE"
  | "GENERAL";

export type MarineQuery = {
  originalQuery: string;
  intent: MarineIntent;
  location: string;
  date: string;
  time: string | null;
};

export function detectIntent(query: string): MarineIntent {
  const q = query.toLowerCase();

  if (
    q.includes("safe") ||
    q.includes("danger") ||
    q.includes("risk") ||
    q.includes("fish tomorrow") ||
    q.includes("fishing safety")
  ) {
    return "FISHING_SAFETY";
  }

  if (
    q.includes("pfz") ||
    q.includes("fishing zone") ||
    q.includes("fishing zones")
  ) {
    return "FISHING_PFZ";
  }

  if (
    q.includes("weather") ||
    q.includes("rain") ||
    q.includes("wind") ||
    q.includes("temperature")
  ) {
    return "WEATHER";
  }

  if (
    q.includes("ocean") ||
    q.includes("wave") ||
    q.includes("waves") ||
    q.includes("sst") ||
    q.includes("sea state") ||
    q.includes("current")
  ) {
    return "OCEAN_CONDITIONS";
  }

  if (q.includes("tide") || q.includes("high tide") || q.includes("low tide")) {
    return "TIDE";
  }

  if (
    q.includes("cyclone") ||
    q.includes("lightning") ||
    q.includes("hazard") ||
    q.includes("storm")
  ) {
    return "HAZARD";
  }

  if (
    q.includes("route") ||
    q.includes("destination") ||
    q.includes("navigate")
  ) {
    return "ROUTE";
  }

  return "GENERAL";
}

export function extractTime(query: string): string | null {
  const match = query.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i
  );

  if (!match) return null;

  const hour = match[1];
  const minute = match[2] ?? "00";
  const period = match[3].toUpperCase();

  return `${hour}:${minute} ${period}`;
}

export function extractDate(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("tomorrow")) return "Tomorrow";
  if (q.includes("today")) return "Today";
  if (q.includes("tonight")) return "Tonight";

  return "Current";
}

export function extractLocation(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("visakhapatnam") || q.includes("vizag")) {
    return "Visakhapatnam, India";
  }

  return "Visakhapatnam, India";
}

export function analyseMarineQuery(query: string): MarineQuery {
  return {
    originalQuery: query,
    intent: detectIntent(query),
    location: extractLocation(query),
    date: extractDate(query),
    time: extractTime(query),
  };
}