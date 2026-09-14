import { NextResponse } from "next/server";
import OpenAI from "openai";
import { analyseMarineQuery, type MarineQuery } from "@/lib/orca/intent";
import { searchRag } from "@/lib/rag";
import { fuseMarineEvidence } from "@/lib/marine/data-fusion";

type LanguageCode = "en" | "te" | "hi" | "ta" | "kn";

const SUPPORTED_LANGUAGES: LanguageCode[] = [
  "en",
  "te",
  "hi",
  "ta",
  "kn",
];

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/*
 * =========================================================
 * AUTOMATIC LANGUAGE DETECTION
 * =========================================================
 *
 * Detects the language from the actual characters typed by
 * the user.
 *
 * Telugu  -> te
 * Hindi   -> hi
 * Tamil   -> ta
 * Kannada -> kn
 * English -> en
 *
 * This means the frontend does NOT need to send a language.
 */

function detectLanguage(text: string): LanguageCode {
  const input = text.trim();

  if (!input) {
    return "en";
  }

  const counts = {
    te: 0,
    hi: 0,
    ta: 0,
    kn: 0,
  };

  for (const char of input) {
    const code = char.codePointAt(0);

    if (!code) continue;

    // Telugu: U+0C00 - U+0C7F
    if (code >= 0x0c00 && code <= 0x0c7f) {
      counts.te++;
    }

    // Devanagari: U+0900 - U+097F
    else if (code >= 0x0900 && code <= 0x097f) {
      counts.hi++;
    }

    // Tamil: U+0B80 - U+0BFF
    else if (code >= 0x0b80 && code <= 0x0bff) {
      counts.ta++;
    }

    // Kannada: U+0C80 - U+0CFF
    else if (code >= 0x0c80 && code <= 0x0cff) {
      counts.kn++;
    }
  }

  const highest = Math.max(
    counts.te,
    counts.hi,
    counts.ta,
    counts.kn
  );

  if (highest === 0) {
    return "en";
  }

  if (counts.te === highest) {
    return "te";
  }

  if (counts.hi === highest) {
    return "hi";
  }

  if (counts.ta === highest) {
    return "ta";
  }

  if (counts.kn === highest) {
    return "kn";
  }

  return "en";
}

const AGENT_REGISTRY = {
  "Planner / Orchestrator Agent": "Selects the minimum specialist workflow required for the query.",
  "Marine Data Agent": "Checks provenance, completeness, units and freshness of evidence.",
  "Weather Agent": "Analyzes atmospheric conditions and forecasts.",
  "Ocean Agent": "Analyzes waves, swell, SST and ocean conditions.",
  "Tide Agent": "Analyzes tide timing and height.",
  "Satellite Agent": "Handles satellite-derived marine products when a satellite connector is available.",
  "Fishing / PFZ Agent": "Analyzes INCOIS potential fishing zone evidence.",
  "Geospatial Agent": "Checks spatial boundaries and geofencing using PostGIS-backed services.",
  "Disaster / Risk Agent": "Analyzes active marine hazards.",
  "Route Optimization Agent": "Analyzes route distance, ETA, hazards and route risk.",
  "Scenario Simulation Agent": "Compares alternative marine operating scenarios when scenario inputs are available.",
  "Visualization Agent": "Prepares evidence for map/chart presentation.",
  "Explanation Agent": "Synthesizes validated findings into the user-facing answer.",
  "Validation / Safety Agent": "Checks evidence sufficiency, conflicts and unsupported claims.",
  "Alerts Agent": "Analyzes active alert conditions and changes.",
  "Reporting Agent": "Formats validated findings into structured marine reports.",
} as const;

function inferIntentFromText(query: string): string {
  const q = query.toLowerCase().trim();

  // Fishing-safety phrases. Keep this deterministic so a simple safety
  // question does not fall through to the GENERAL alert workflow if the
  // language/intent model is unavailable or uncertain.
  const fishingSafetyPatterns = [
    /safe.*fish/,
    /safe.*fishing/,
    /safe.*go fishing/,
    /can i.*fish/,
    /can we.*fish/,
    /should i.*fish/,
    /fishing.*safe/,
    /fish.*safe/,
    /go fishing.*tomorrow/,
    /fishing.*tomorrow/,
    /చేపలు.*పట్ట/, // Telugu
    /చేపల.*వేట/, // Telugu
    /వేటకు.*వెళ్ల/, // Telugu
    /மீன்.*பிடிக்க/, // Tamil
    /மீன்பிடி/, // Tamil
    /मछली.*पकड़/, // Hindi
    /मछली.*पकड़ने/, // Hindi
    /ಮೀನು.*ಹಿಡಿ/, // Kannada
    /ಮೀನುಗಾರ/, // Kannada
  ];

  if (fishingSafetyPatterns.some((pattern) => pattern.test(q))) {
    return "FISHING_SAFETY";
  }

  const fishingPfzPatterns = [
    /potential fishing zone/,
    /fishing zone/,
    /pfz/,
    /fishing ground/,
    /fishing area/,
    /మత్స్య.*ప్రాంత/,
    /ఫిషింగ్.*జోన్/,
  ];

  if (fishingPfzPatterns.some((pattern) => pattern.test(q))) {
    return "FISHING_PFZ";
  }

  const routePatterns = [
    /safe.*route/,
    /best.*route/,
    /route.*from.*to/,
    /route.*fishing/,
    /navigate/,
    /నావిగేషన్/,
    /మార్గం/,
  ];
  if (routePatterns.some((pattern) => pattern.test(q))) return "ROUTE";

  const tidePatterns = [/tide/, /high tide/, /low tide/, /తెరచాప/, /జ్వారం/, /அலை.*நிலை/, /ಉಬ್ಬರ/];
  if (tidePatterns.some((pattern) => pattern.test(q))) return "TIDE";

  const weatherPatterns = [/weather/, /forecast/, /rain/, /wind forecast/, /వాతావరణ/, /मौसम/, /வானிலை/, /ಹವಾಮಾನ/];
  if (weatherPatterns.some((pattern) => pattern.test(q))) return "WEATHER";

  const oceanPatterns = [/ocean condition/, /sea condition/, /wave/, /swell/, /sea surface temperature/, /sst/, /currents?/, /సముద్ర పరిస్థిత/, /అలల/, /समुद्र की स्थिति/, /लहर/, /கடல் நிலை/, /அலை/, /ಸಮುದ್ರ ಪರಿಸ್ಥಿತಿ/];
  if (oceanPatterns.some((pattern) => pattern.test(q))) return "OCEAN_CONDITIONS";

  const hazardPatterns = [/hazard/, /warning/, /cyclone/, /storm/, /dangerous sea/, /marine warning/, /ప్రమాద/, /తుఫాను/, /चक्रवात/, /चेतावनी/, /புயல்/, /எச்சரிக்கை/, /ಚಂಡಮಾರುತ/, /ಎಚ್ಚರಿಕೆ/];
  if (hazardPatterns.some((pattern) => pattern.test(q))) return "HAZARD";

  return "GENERAL";
}

async function resolveFollowUpQuery(
  query: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  if (!conversationHistory.length || !process.env.GROQ_API_KEY) return query;

  try {
    const result = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      temperature: 0,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content: `Rewrite the current marine query into one standalone query using the conversation history. Resolve references such as "it", "there", "that", "same place", "tomorrow", "later", and omitted subjects only when the history makes them clear. Preserve the user's intent. Do not answer the query. If the current query is already standalone, return it unchanged. Return ONLY the rewritten query.`,
        },
        {
          role: "user",
          content: `CONVERSATION HISTORY:\n${conversationHistory.slice(-10).map(m => `${m.role}: ${m.text}`).join("\n")}\n\nCURRENT QUERY:\n${query}`,
        },
      ],
    });
    const rewritten = result.choices[0]?.message?.content?.trim();
    return rewritten || query;
  } catch (error) {
    console.warn("ORCA follow-up resolution failed:", error);
    return query;
  }
}

function buildClarificationResponse({
  intent,
  analysis,
  query,
  cookie,
  conversationHistory,
}: {
  intent: string;
  analysis: MarineQuery;
  query: string;
  cookie: string;
  conversationHistory: ConversationMessage[];
}): string | null {
  const hasOperatingLocation = /orca-location=/.test(cookie);
  const historyText = conversationHistory.map((m) => m.text).join(" ");
  const combinedText = `${historyText} ${query}`.toLowerCase();

  // Do not guess a location when neither the current query nor the
  // existing operating-location context identifies one.
  const locationMissing =
    !hasOperatingLocation &&
    (!analysis.location ||
      /selected operating location|unknown|not specified|unspecified/i.test(
        analysis.location
      ));

  if (locationMissing && [
    "WEATHER",
    "OCEAN_CONDITIONS",
    "TIDE",
    "FISHING_PFZ",
    "FISHING_SAFETY",
    "HAZARD",
  ].includes(intent)) {
    return "Which coastal or marine location should I use? Please provide a place name or coordinates so I can check the correct marine conditions.";
  }

  // A route recommendation without a destination is unsafe to invent.
  // Ask only when the conversation does not already provide one.
  if (
    intent === "ROUTE" &&
    !/(?:\bto\b|destination|port|harbour|harbor|jetty|coordinates|\bfrom\b)/i.test(
      combinedText
    )
  ) {
    return "Where do you want to travel to? Please provide the destination (place name or coordinates) so I can evaluate the route.";
  }

  return null;
}


type ToolRoute =
  | "weather"
  | "ocean"
  | "tide"
  | "pfz"
  | "hazard"
  | "geofence"
  | "route"
  | "none";

const TOOL_TO_INTENT: Record<ToolRoute, string> = {
  weather: "WEATHER",
  ocean: "OCEAN_CONDITIONS",
  tide: "TIDE",
  pfz: "FISHING_PFZ",
  hazard: "HAZARD",
  geofence: "GENERAL",
  route: "ROUTE",
  none: "GENERAL",
};

/**
 * Step 1.9: real OpenAI-compatible function calling through Groq.
 * The model may request a marine tool, but deterministic routing remains
 * the safety fallback when the model/tool API is unavailable.
 */
async function planMarineToolCall(
  query: string,
  conversationHistory: ConversationMessage[] = []
): Promise<{ tool: ToolRoute; reason: string } | null> {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const result = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      temperature: 0,
      max_tokens: 120,
      tool_choice: "auto",
      tools: [
        {
          type: "function",
          function: {
            name: "select_marine_tool",
            description: "Select the single marine data workflow required to answer the user's query.",
            parameters: {
              type: "object",
              properties: {
                tool: {
                  type: "string",
                  enum: ["weather", "ocean", "tide", "pfz", "hazard", "geofence", "route", "none"],
                },
                reason: {
                  type: "string",
                  description: "Short reason for selecting the tool.",
                },
              },
              required: ["tool", "reason"],
              additionalProperties: false,
            },
          },
        },
      ],
      messages: [
        {
          role: "system",
          content: "You are ORCA's tool router. Select only one tool. Never answer the user. Use conversation history to resolve follow-up references.",
        },
        {
          role: "user",
          content: `HISTORY:\n${conversationHistory.slice(-10).map(m => `${m.role}: ${m.text}`).join("\\n") || "None"}\n\nQUERY:\n${query}`,
        },
      ],
    });

    const toolCall = result.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") return null;

    if (toolCall.function.name !== "select_marine_tool") return null;

    const args = JSON.parse(toolCall.function.arguments || "{}");
    const tool = args?.tool as ToolRoute;
    const reason = typeof args?.reason === "string" ? args.reason.slice(0, 300) : "Tool selected by ORCA planner.";

    if (!(tool in TOOL_TO_INTENT)) return null;
    return { tool, reason };
  } catch (error) {
    console.warn("ORCA function-calling tool router failed:", error);
    return null;
  }
}


type AgentExecutionPlan = {
  selectedAgents: string[];
  reason: string;
  mode: "llm" | "deterministic-fallback";
};

const KNOWN_AGENT_NAMES = Object.keys(AGENT_REGISTRY);

// Item 2.3: only agents with a real execution adapter participate in the
// runtime plan. The remaining registry entries are intentionally kept as
// capabilities until their underlying data/workflow adapters are available.
const EXECUTABLE_AGENT_NAMES = new Set([
  "Weather Agent",
  "Ocean Agent",
  "Tide Agent",
  "Fishing / PFZ Agent",
  "Geospatial Agent",
  "Disaster / Risk Agent",
  "Route Optimization Agent",
  "Alerts Agent",
  "Marine Data Agent",
  "Validation / Safety Agent",
  "Explanation Agent",
]);

function deterministicAgentPlan(intent: string): AgentExecutionPlan {
  const plans: Record<string, string[]> = {
    WEATHER: ["Weather Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
    OCEAN_CONDITIONS: ["Ocean Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
    TIDE: ["Tide Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
    FISHING_PFZ: ["Fishing / PFZ Agent", "Ocean Agent", "Geospatial Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
    FISHING_SAFETY: ["Weather Agent", "Ocean Agent", "Tide Agent", "Fishing / PFZ Agent", "Disaster / Risk Agent", "Geospatial Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
    HAZARD: ["Weather Agent", "Ocean Agent", "Disaster / Risk Agent", "Geospatial Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
    ROUTE: ["Weather Agent", "Ocean Agent", "Fishing / PFZ Agent", "Route Optimization Agent", "Geospatial Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
    GENERAL: ["Alerts Agent", "Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"],
  };

  const selectedAgents = (plans[intent] ?? plans.GENERAL).filter((name) =>
    EXECUTABLE_AGENT_NAMES.has(name)
  );

  return {
    selectedAgents,
    reason: `Deterministic safe fallback plan for ${intent}.`,
    mode: "deterministic-fallback",
  };
}

/**
 * Item 2.2: the Planner now produces a structured multi-agent execution plan.
 * The plan is advisory in this step; Item 2.3 will make execution depend on it.
 */
async function createAgentExecutionPlan(
  query: string,
  intent: string,
  conversationHistory: ConversationMessage[] = []
): Promise<AgentExecutionPlan> {
  const fallback = deterministicAgentPlan(intent);

  if (!process.env.GROQ_API_KEY) return fallback;

  try {
    const result = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      temperature: 0,
      max_tokens: 220,
      tool_choice: "auto",
      tools: [
        {
          type: "function",
          function: {
            name: "create_agent_execution_plan",
            description: "Select the minimum set of ORCA agents required to answer the marine query safely.",
            parameters: {
              type: "object",
              properties: {
                selectedAgents: {
                  type: "array",
                  items: { type: "string", enum: [...KNOWN_AGENT_NAMES] },
                  minItems: 1,
                  maxItems: 12,
                },
                reason: {
                  type: "string",
                  description: "Short explanation of why these agents are needed.",
                },
              },
              required: ["selectedAgents", "reason"],
              additionalProperties: false,
            },
          },
        },
      ],
      messages: [
        {
          role: "system",
          content: `You are ORCA's Planner / Orchestrator Agent.\n\nSelect the minimum specialist agents needed for the query.\nNever select agents merely for display.\nAlways include Marine Data Agent, Validation / Safety Agent and Explanation Agent for a live-data answer.\nFor risk/safety/route queries, include Disaster / Risk Agent when risk evidence is required.\nUse only agents from the supplied function schema.\nDo not answer the user.`,
        },
        {
          role: "user",
          content: `INTENT: ${intent}\nQUERY: ${query}\nHISTORY:\n${conversationHistory.slice(-10).map((m) => `${m.role}: ${m.text}`).join("\n") || "None"}`,
        },
      ],
    });

    const toolCall = result.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") return fallback;
    if (toolCall.function.name !== "create_agent_execution_plan") return fallback;

    const args = JSON.parse(toolCall.function.arguments || "{}");
    const requested = Array.isArray(args?.selectedAgents) ? args.selectedAgents : [];
    const selectedAgents = requested.filter(
      (name: unknown): name is string =>
        typeof name === "string" &&
        KNOWN_AGENT_NAMES.includes(name) &&
        EXECUTABLE_AGENT_NAMES.has(name)
    );

    // Downstream synthesis/validation agents are mandatory for safe responses.
    for (const mandatory of ["Marine Data Agent", "Validation / Safety Agent", "Explanation Agent"]) {
      if (!selectedAgents.includes(mandatory)) selectedAgents.push(mandatory);
    }

    if (["FISHING_SAFETY", "HAZARD", "ROUTE"].includes(intent) && !selectedAgents.includes("Disaster / Risk Agent")) {
      selectedAgents.push("Disaster / Risk Agent");
    }

    if (selectedAgents.length === 0) return fallback;

    return {
      selectedAgents: selectedAgents.slice(0, 12),
      reason: typeof args?.reason === "string"
        ? args.reason.trim().slice(0, 400)
        : "Planner-selected multi-agent workflow.",
      mode: "llm",
    };
  } catch (error) {
    console.warn("ORCA agent execution planning failed:", error);
    return fallback;
  }
}

async function resolveIntent(
  query: string,
  initialIntent: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  const allowedIntents = [
    "WEATHER",
    "OCEAN_CONDITIONS",
    "TIDE",
    "FISHING_PFZ",
    "FISHING_SAFETY",
    "HAZARD",
    "ROUTE",
    "GENERAL",
  ];

  if (initialIntent !== "GENERAL" || !process.env.GROQ_API_KEY) {
    return initialIntent;
  }

  try {
    const result = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      temperature: 0,
      max_tokens: 40,
      messages: [
        {
          role: "system",
          content: `
You are ORCA's multilingual intent-routing planner.
Classify the user's marine query into exactly ONE of:
${allowedIntents.join(", ")}

Understand Telugu, Hindi, Tamil, Kannada and English.
Return ONLY the intent name.
FISHING_SAFETY means questions about whether it is safe to fish, travel or operate at a specified time.
FISHING_PFZ means finding, locating or evaluating potential fishing zones.
WEATHER means weather/forecast.
OCEAN_CONDITIONS means waves, swell, SST, currents or sea state.
TIDE means tides.
HAZARD means cyclone, lightning, dangerous sea conditions or warnings.
ROUTE means safest/best route or route optimization.
GENERAL means the query does not require one of the above marine workflows.
      `.trim(),
        },
        {
          role: "user",
          content: `CONVERSATION HISTORY:
${conversationHistory
  .slice(-10)
  .map((message) => `${message.role}: ${message.text}`)
  .join("\n") || "No previous conversation."}

CURRENT QUERY:
${query}`,
        },
      ],
    });

    const candidate = result.choices[0]?.message?.content?.trim().toUpperCase();
    return allowedIntents.includes(candidate ?? "")
      ? candidate!
      : initialIntent;
  } catch (error) {
    console.warn("ORCA multilingual intent routing failed:", error);
    return initialIntent;
  }
}

function selectAgent(intent: string) {
  const agents: Record<string, string> = {
    FISHING_SAFETY: "Validation / Safety Agent",
    FISHING_PFZ: "Fishing / PFZ Agent",
    WEATHER: "Weather Agent",
    OCEAN_CONDITIONS: "Ocean Agent",
    TIDE: "Tide Agent",
    HAZARD: "Disaster / Risk Agent",
    ROUTE: "Route Optimization Agent",
    GENERAL: "Planner / Orchestrator Agent",
  };

  return agents[intent] ?? "Planner / Orchestrator Agent";
}



type AgentStatus = "running" | "completed" | "failed";

type AgentTrace = {
  name: string;
  status: AgentStatus;
  reason: string;
};

// Item 2.4: every agent publishes a structured evidence envelope instead of
// passing opaque prose to the next agent. This keeps provenance, status and
// source evidence together while still allowing compact LLM context.
type InterAgentEvidence = {
  producer: string;
  evidenceId: string;
  status: "available" | "failed";
  evidenceType: "live-data" | "analysis" | "validation" | "synthesis";
  observedAt: string;
  source: string;
  data: unknown;
  analysis?: string;
  error?: string;
};

type ConversationMessage = {
  role: "user" | "orca";
  text: string;
};

function addAgentTrace(
  trace: AgentTrace[],
  name: string,
  reason: string,
  status: AgentStatus = "completed"
) {
  trace.push({ name, status, reason });
}

function compactAgentEvidence(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[truncated]";

  if (typeof value === "string") {
    return value.length > 1800 ? `${value.slice(0, 1800)}…[truncated]` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 12).map((item) => compactAgentEvidence(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(input)) {
      const normalized = key.toLowerCase();

      // PFZ geometries and raw payloads can contain thousands of coordinates.
      // They are useful to the map, but not to the reasoning model.
      if (
        normalized === "geometry" ||
        normalized === "coordinates" ||
        normalized === "raw" ||
        normalized === "html" ||
        normalized === "features"
      ) {
        if (Array.isArray(item)) {
          output[key] = `[${item.length} items omitted from LLM context]`;
        } else {
          output[key] = "[omitted from LLM context]";
        }
        continue;
      }

      output[key] = compactAgentEvidence(item, depth + 1);
    }

    return output;
  }

  return value;
}

function deterministicAgentSummary(name: string, data: unknown): string {
  const d = (data && typeof data === "object") ? data as Record<string, unknown> : {};
  const location = typeof d.location === "string" ? d.location : "the selected location";

  if (name === "Weather Agent") {
    const parts: string[] = [];
    if (d.temperature !== undefined && d.temperature !== null) parts.push(`temperature ${d.temperature}°C`);
    if (d.temperatureMin !== undefined && d.temperatureMax !== undefined) {
      parts.push(`temperature range ${d.temperatureMin}–${d.temperatureMax}°C`);
    }
    if (d.windSpeed !== undefined && d.windSpeed !== null) parts.push(`wind speed ${d.windSpeed} km/h`);
    if (d.windDirection !== undefined && d.windDirection !== null) parts.push(`wind direction ${d.windDirection}°`);
    if (d.precipitationProbability !== undefined && d.precipitationProbability !== null) parts.push(`precipitation probability ${d.precipitationProbability}%`);
    if (parts.length === 0) return `Weather data was retrieved for ${location}, but no supported weather measurements were available.`;
    return `Live weather evidence for ${location}: ${parts.join(", ")}.`;
  }

  if (name === "Ocean Agent") {
    const parts: string[] = [];
    if (d.waveHeight !== undefined && d.waveHeight !== null) parts.push(`wave height ${d.waveHeight} m`);
    if (d.waveDirection !== undefined && d.waveDirection !== null) parts.push(`wave direction ${d.waveDirection}°`);
    if (d.wavePeriod !== undefined && d.wavePeriod !== null) parts.push(`wave period ${d.wavePeriod} s`);
    if (d.sst !== undefined && d.sst !== null) parts.push(`SST ${d.sst}°C`);
    return parts.length ? `Live ocean evidence for ${location}: ${parts.join(", ")}.` : `Ocean data was retrieved for ${location}, but supported measurements were unavailable.`;
  }

  if (name === "Tide Agent") {
    const tides = Array.isArray(d.tides) ? d.tides.slice(0, 6) : [];
    if (tides.length) {
      return `Live tide evidence for ${location}: ${tides.map((t: any) => `${t.type ?? "tide"} ${t.time ?? "time unavailable"} at ${t.height ?? "N/A"} m`).join("; ")}.`;
    }
    return `Tide data was retrieved for ${location}, but no tide events were available.`;
  }

  if (name === "Fishing / PFZ Agent") {
    const zones = Array.isArray(d.zones) ? d.zones : Array.isArray(d) ? d : [];
    return `PFZ evidence was retrieved for ${location}: ${zones.length} zone record(s) available. The source-provided suitability and environmental fields are not inferred when absent.`;
  }

  if (name === "Disaster / Risk Agent") {
    const alerts = Array.isArray(d.alerts) ? d.alerts : [];
    const risk = d.riskLevel ?? d.risk ?? "not determined";
    return `Hazard evidence for ${location}: risk level ${risk}; ${alerts.length} alert record(s) supplied by the hazard service.`;
  }

  if (name === "Geospatial Agent") {
    return `Geospatial evidence was retrieved for ${location}. EEZ/geofence status: ${d.insideEEZ ?? "unavailable"}; boundary distance: ${d.distanceKm ?? "unavailable"} km.`;
  }

  if (name === "Alerts Agent") {
    const alerts = Array.isArray(d.alerts) ? d.alerts : [];
    return `Alert evidence was retrieved for ${location}: ${alerts.length} active alert record(s) supplied by the alerts service.`;
  }

  return `${name} received live evidence and preserved the source data without inventing unavailable values.`;
}

function deterministicMarineDataSummary(evidence: Record<string, unknown>): string {
  const names = Object.keys(evidence);
  if (!names.length) return "No specialist evidence was available for normalization.";
  return `Marine Data quality pass: ${names.length} specialist source(s) returned evidence. Preserve reported measurements, source provenance and timestamps; do not infer missing values. Sources reviewed: ${names.join(", ")}.`;
}

function deterministicValidationSummary(evidence: Record<string, string>): string {
  const entries = Object.entries(evidence);
  const failed = entries.filter(([, value]) => /\bfailed\b/i.test(value));
  if (!entries.length) return "Validation: insufficient evidence for a safe answer.";
  if (failed.length) return `Validation: partial evidence. ${failed.length} agent result(s) reported failure; unsupported claims must be omitted.`;
  return `Validation: evidence is internally usable for this query. ${entries.length} agent result(s) are available; missing measurements must remain unavailable rather than inferred.`;
}

function deterministicWeatherAnswer(query: string, data: unknown): string | null {
  const d = (data && typeof data === "object") ? data as Record<string, unknown> : {};
  const location = typeof d.location === "string" ? d.location : "the selected location";
  const forecast = Boolean(d.forecast);
  const parts: string[] = [];
  if (forecast && d.temperatureMin !== undefined && d.temperatureMax !== undefined) {
    parts.push(`temperature ${d.temperatureMin}–${d.temperatureMax}°C`);
  } else if (d.temperature !== undefined && d.temperature !== null) {
    parts.push(`temperature ${d.temperature}°C`);
  }
  if (d.windSpeed !== undefined && d.windSpeed !== null) parts.push(`wind ${d.windSpeed} km/h`);
  if (d.windDirection !== undefined && d.windDirection !== null) parts.push(`wind direction ${d.windDirection}°`);
  if (d.precipitationProbability !== undefined && d.precipitationProbability !== null) parts.push(`precipitation probability ${d.precipitationProbability}%`);
  if (!parts.length) return null;
  return `${forecast ? "Weather forecast" : "Current weather"} for ${location}: ${parts.join(", ")}.`;
}

function deterministicFishingPfzAnswer(query: string, data: unknown): string | null {
  const d = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const zones = Array.isArray(d.zones) ? d.zones : [];
  if (!zones.length) {
    return "No PFZ records were returned by the live INCOIS PFZ service for the selected location. I cannot infer fishing-zone availability when the source returns no zones.";
  }

  const origin = d.location && typeof d.location === "object"
    ? d.location as Record<string, unknown>
    : {};
  const originLat = Number(origin.latitude);
  const originLon = Number(origin.longitude);

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => value * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const ranked = zones
    .map((zone: unknown, index: number) => {
      const z = zone && typeof zone === "object" ? zone as Record<string, unknown> : {};
      const lat = Number(z.latitude);
      const lon = Number(z.longitude);
      const distance = Number.isFinite(originLat) && Number.isFinite(originLon) && Number.isFinite(lat) && Number.isFinite(lon)
        ? haversineKm(originLat, originLon, lat, lon)
        : null;
      return { z, index, distance };
    })
    .sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY))
    .slice(0, 5);

  const lines = ranked.map(({ z, index, distance }) => {
    const sector = typeof z.sector === "string" && z.sector.trim() ? z.sector.trim() : "sector unavailable";
    const lat = Number(z.latitude);
    const lon = Number(z.longitude);
    const coords = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : "coordinates unavailable";
    const distanceText = distance !== null ? `, about ${distance.toFixed(1)} km from the selected location` : "";
    return `${index + 1}. ${sector} — ${coords}${distanceText}`;
  });

  return `INCOIS returned ${zones.length} live PFZ record(s) for the selected location. The nearest available records are:\n${lines.join("\n")}\nThe PFZ service does not provide a validated suitability score in this response, so ORCA does not invent one.`;
}

function deterministicFishingSafetyAnswer(
  query: string,
  evidence: Record<string, unknown>
): string | null {
  const weather = evidence["Weather Agent"] as Record<string, unknown> | undefined;
  const ocean = evidence["Ocean Agent"] as Record<string, unknown> | undefined;
  const tide = evidence["Tide Agent"] as Record<string, unknown> | undefined;
  const hazard = evidence["Disaster / Risk Agent"] as Record<string, unknown> | undefined;
  const geofence = evidence["Geospatial Agent"] as Record<string, unknown> | undefined;
  const pfz = evidence["Fishing / PFZ Agent"] as Record<string, unknown> | undefined;

  const risk = typeof hazard?.riskLevel === "string" ? hazard.riskLevel : null;
  const hazards = Array.isArray(hazard?.hazards) ? hazard.hazards : [];
  const waveHeight = typeof ocean?.waveHeight === "number" ? ocean.waveHeight : null;
  const windSpeed = typeof weather?.windSpeed === "number" ? weather.windSpeed : null;
  const rain = typeof weather?.precipitationProbability === "number" ? weather.precipitationProbability : null;
  const insideEEZ = typeof geofence?.insideEEZ === "boolean" ? geofence.insideEEZ : null;
  const pfzZones = Array.isArray(pfz?.zones) ? pfz.zones : [];
  const pfzAvailable = pfzZones.length > 0;

  const location = typeof weather?.location === "string"
    ? weather.location
    : typeof ocean?.location === "string"
      ? ocean.location
      : "the selected location";

  const riskUpper = risk?.toUpperCase() ?? "UNKNOWN";
  let recommendation: string;
  if (["CRITICAL", "HIGH"].includes(riskUpper)) {
    recommendation = "Based on the available hazard evidence, fishing should be avoided until conditions improve and official marine advisories are checked.";
  } else if (riskUpper === "MODERATE") {
    recommendation = "Conditions require caution. Check the latest official marine advisory and vessel-specific limits before departing.";
  } else if (riskUpper === "LOW") {
    recommendation = "The available evidence does not indicate a major hazard, but this is not a guarantee of safety; check official advisories before departure.";
  } else {
    recommendation = "A complete safety determination is not possible because some required evidence is unavailable.";
  }

  const evidenceLines: string[] = [];
  if (risk) evidenceLines.push(`Risk service: ${risk}.`);
  if (windSpeed !== null) evidenceLines.push(`Wind: ${windSpeed} km/h.`);
  if (waveHeight !== null) evidenceLines.push(`Wave height: ${waveHeight} m.`);
  if (rain !== null) evidenceLines.push(`Precipitation probability: ${rain}%.`);
  if (hazards.length) evidenceLines.push(`${hazards.length} active hazard record(s) were supplied.`);
  if (insideEEZ !== null) evidenceLines.push(`EEZ status: ${insideEEZ ? "inside" : "outside"}.`);
  if (tide?.tides && Array.isArray(tide.tides)) evidenceLines.push(`Tide service supplied ${tide.tides.length} tide event(s).`);
  if (pfzAvailable) evidenceLines.push(`INCOIS supplied ${pfzZones.length} PFZ record(s).`);

  if (!evidenceLines.length) return null;

  const limitations: string[] = [];
  if (!pfzAvailable) limitations.push("PFZ evidence was unavailable in this run");
  if (risk === null) limitations.push("a consolidated risk level was unavailable");
  const limitationText = limitations.length
    ? ` Limitation: ${limitations.join("; ")}.`
    : "";

  return `Marine fishing safety assessment for ${location}: ${recommendation}\n${evidenceLines.join(" ")}${limitationText}`;
}

async function runAIAgent(
  name: string,
  role: string,
  task: string,
  context: string,
  maxTokens = 350
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const primaryModel = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const models = [primaryModel, "llama-3.1-8b-instant"].filter(
    (model, index, all) => all.indexOf(model) === index
  );

  let lastError: unknown = null;

  for (const model of models) {
    try {
      const result = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content: `
You are the ${name} in ORCA, a multi-agent marine intelligence system.

ROLE:
${role}

RULES:
1. Analyze only the supplied evidence.
2. Never invent missing marine measurements.
3. Clearly distinguish measured data from interpretation.
4. Be concise and factual.
5. Your output will be passed to other ORCA agents.
6. Do not address the user directly.
7. Do not translate; respond in English for inter-agent communication.
            `.trim(),
          },
          {
            role: "user",
            content: `TASK:\n${task}\n\nEVIDENCE:\n${context}`,
          },
        ],
      });

      const text = result.choices[0]?.message?.content?.trim();
      if (!text) throw new Error(`${name} returned an empty response.`);

      if (model !== primaryModel) {
        console.warn(`ORCA ${name}: used fallback model ${model}.`);
      }

      return text;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ORCA ${name} failed with model ${model}:`, message);

      // Give a transient rate-limit/network condition a short recovery window
      // before trying the lightweight fallback model. Do not loop repeatedly.
      if (/429|rate.?limit|timeout|timed out|503|502|network/i.test(message)) {
        await new Promise((resolve) => setTimeout(resolve, 1800));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${name} failed.`);
}

async function fetchInternalJson(
  url: string,
  options: RequestInit
) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`${url} failed with status ${res.status}`);
  }
  return res.json();
}

async function fetchInternalJsonWithRetry(
  url: string,
  options: RequestInit,
  attempts = 2
) {
  let lastError: unknown = null;
  const totalAttempts = Math.max(1, attempts);

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      return await fetchInternalJson(url, options);
    } catch (error) {
      lastError = error;
      console.warn(
        `ORCA data fetch attempt ${attempt}/${totalAttempts} failed for ${url}.`,
        error instanceof Error ? error.message : error
      );

      if (attempt < totalAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${url} failed`);
}

// ITEM 2.6: specialist failures are isolated. Live data calls retry before
// failure is published; LLM failures already use model fallback plus
// deterministic evidence summaries. Downstream agents consume explicit
// failed envelopes instead of aborting the entire workflow.

async function runAgenticWorkflow({
  intent,
  query,
  baseUrl,
  internalFetchOptions,
  cookie,
  conversationHistory,
  analysis,
  agentExecutionPlan,
}: {
  intent: string;
  query: string;
  baseUrl: string;
  internalFetchOptions: RequestInit;
  cookie: string;
  conversationHistory: ConversationMessage[];
  analysis: MarineQuery;
  agentExecutionPlan: AgentExecutionPlan;
}) {
  const trace: AgentTrace[] = [];
  const outputs: Record<string, string> = {};
  const rawEvidence: Record<string, unknown> = {};
  const interAgentEvidence: Record<string, InterAgentEvidence> = {};

  const publishEvidence = (entry: InterAgentEvidence) => {
    interAgentEvidence[entry.producer] = entry;
  };

  const buildEvidencePacket = () =>
    Object.values(interAgentEvidence).map((entry) => ({
      evidenceId: entry.evidenceId,
      producer: entry.producer,
      status: entry.status,
      evidenceType: entry.evidenceType,
      observedAt: entry.observedAt,
      source: entry.source,
      data: compactAgentEvidence(entry.data),
      analysis: entry.analysis ?? null,
      error: entry.error ?? null,
    }));
  const resolvedContext = `Resolved intent: ${analysis.intent}\nResolved location: ${analysis.location}\nResolved date: ${analysis.date}\nResolved time: ${analysis.time ?? "none"}`;

  const conversationContext =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-10)
          .map((message) => `${message.role}: ${message.text}`)
          .join("\n")
      : "No previous conversation.";

  const selected = new Set(agentExecutionPlan.selectedAgents);

  addAgentTrace(
    trace,
    "Planner / Orchestrator Agent",
    `Created ${agentExecutionPlan.mode} execution plan for ${intent}: ${agentExecutionPlan.selectedAgents.join(", ")}. Dependency order: specialists → Marine Data → Risk (when needed) → Validation → Explanation.`
  );

  const runSpecialist = async (
    name: string,
    role: string,
    task: string,
    dataPromise: Promise<unknown>
  ) => {
    try {
      const data = await dataPromise;
      rawEvidence[name] = data;
      const compactData = compactAgentEvidence(data);
      try {
        const result = await runAIAgent(
          name,
          role,
          `${task}\n\nRESOLVED QUERY CONTEXT:\n${resolvedContext}\n\nCONVERSATION CONTEXT:\n${conversationContext}`,
          JSON.stringify(compactData)
        );
        outputs[name] = result;
        publishEvidence({
          producer: name,
          evidenceId: `${name.replace(/\W+/g, "-").toLowerCase()}-${Date.now()}`,
          status: "available",
          evidenceType: "analysis",
          observedAt: new Date().toISOString(),
          source: typeof (data as any)?.source === "string" ? (data as any).source : "internal ORCA data service",
          data,
          analysis: result,
        });
        addAgentTrace(trace, name, "Retrieved live data and published structured evidence for downstream agents.");
      } catch (aiError) {
        const message = aiError instanceof Error ? aiError.message : "Unknown AI error";
        outputs[name] = deterministicAgentSummary(name, data);
        publishEvidence({
          producer: name,
          evidenceId: `${name.replace(/\W+/g, "-").toLowerCase()}-${Date.now()}`,
          status: "available",
          evidenceType: "live-data",
          observedAt: new Date().toISOString(),
          source: typeof (data as any)?.source === "string" ? (data as any).source : "internal ORCA data service",
          data,
          analysis: outputs[name],
        });
        addAgentTrace(trace, name, `LLM analysis unavailable; published live evidence with deterministic fallback (${message}).`);
      }
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      outputs[name] = `${name} failed: ${message}`;
      publishEvidence({
        producer: name,
        evidenceId: `${name.replace(/\W+/g, "-").toLowerCase()}-${Date.now()}`,
        status: "failed",
        evidenceType: "live-data",
        observedAt: new Date().toISOString(),
        source: "internal ORCA data service",
        data: null,
        error: message,
      });
      addAgentTrace(
        trace,
        name,
        `Agent failed after retry/fallback handling: ${message}. Published a failed evidence envelope so downstream agents can continue safely.`,
        "failed"
      );
      return null;
    }
  };

  const weather = async () =>
    runSpecialist(
      "Weather Agent",
      "Analyze atmospheric conditions relevant to marine operations.",
      `Analyze weather for this user query: ${query}. Use the resolved date and time context when interpreting the request. Focus on temperature, wind, precipitation and forecast timing.`,
      fetchInternalJsonWithRetry(
        `${baseUrl}/api/weather${analysis.date === "Tomorrow" ? "?date=tomorrow" : ""}`,
        internalFetchOptions,
        2
      )
    );

  const ocean = async () =>
    runSpecialist(
      "Ocean Agent",
      "Analyze waves, swell, sea state and sea-surface conditions.",
      `Analyze ocean conditions relevant to this user query: ${query}. Use the resolved date, time and location context when interpreting the request. Focus on wave height, direction, period and SST where available.`,
      fetchInternalJsonWithRetry(`${baseUrl}/api/ocean`, internalFetchOptions, 2)
    );

  const tide = async () =>
    runSpecialist(
      "Tide Agent",
      "Analyze tide timing and height and explain marine-operational implications.",
      `Analyze tide information relevant to this user query: ${query}. Use the resolved date, time and location context when interpreting the request.`,
      fetchInternalJsonWithRetry(`${baseUrl}/api/tide`, internalFetchOptions, 2)
    );

  const fishing = async () => {
    const locationCookie = cookie.match(/orca-location=([^;]+)/)?.[1];
    let pfzUrl = `${baseUrl}/api/pfz`;

    if (locationCookie) {
      try {
        const location = JSON.parse(decodeURIComponent(locationCookie));
        const latitude = Number(location.latitude);
        const longitude = Number(location.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          pfzUrl = `${baseUrl}/api/pfz?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
        }
      } catch {
        // Keep the existing PFZ endpoint fallback when the location cookie is malformed.
      }
    }

    return runSpecialist(
      "Fishing / PFZ Agent",
      "Analyze potential fishing zones and fishing suitability using available PFZ/environmental evidence.",
      `Analyze PFZ/fishing information relevant to this user query: ${query}. Use the resolved location and date context when interpreting the request. Never invent a suitability score if the source does not provide one.`,
      fetchInternalJsonWithRetry(pfzUrl, internalFetchOptions, 2)
    );
  };

  const hazard = async () =>
    runSpecialist(
      "Disaster / Risk Agent",
      "Analyze active marine hazards and classify operational risk from available live evidence.",
      `Analyze hazards for this user query: ${query}. Use the resolved date, time and location context when interpreting the request. Identify detected hazards, risk level and safety implications. Only report cyclone/lightning information when actual evidence is supplied.`,
      fetchInternalJsonWithRetry(`${baseUrl}/api/hazard`, internalFetchOptions, 2)
    );

  const geospatial = async () => {
    try {
      const locationCookie = cookie.match(/orca-location=([^;]+)/)?.[1];

      if (!locationCookie) {
        throw new Error("Operating location is not configured");
      }

      const location = JSON.parse(decodeURIComponent(locationCookie));
      const latitude = Number(location.latitude);
      const longitude = Number(location.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Invalid operating location coordinates");
      }

      return runSpecialist(
        "Geospatial Agent",
        "Analyze maritime spatial boundaries and geofence status using PostGIS-backed spatial evidence.",
        `Check the operating location for spatial/geofence implications relevant to this query: ${query}. Use the resolved location context when interpreting the request. Focus on EEZ status, boundary distance and warnings.`,
        fetchInternalJsonWithRetry(
          `${baseUrl}/api/geofence?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
          internalFetchOptions,
          2
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown geospatial error";
      outputs["Geospatial Agent"] = `Geospatial Agent failed: ${message}`;
      addAgentTrace(trace, "Geospatial Agent", `Agent failed: ${message}`, "failed");
      return null;
    }
  };

  const route = async () =>
    runSpecialist(
      "Route Optimization Agent",
      "Analyze the route service result for distance, ETA, hazards and route risk.",
      `Analyze the available route recommendation for this user query: ${query}. Use the resolved location, date and time context when interpreting the request.`,
      fetchInternalJsonWithRetry(`${baseUrl}/api/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          start: "Selected Operating Location",
          destination: "PFZ-01",
        }),
        cache: "no-store",
      })
    );

  const alerts = async () =>
    runSpecialist(
      "Alerts Agent",
      "Analyze active marine alert conditions and warning status.",
      `Analyze active marine alerts relevant to this query: ${query}. Distinguish detected alerts from unavailable alert categories and do not infer missing warnings.`,
      fetchInternalJsonWithRetry(`${baseUrl}/api/alerts`, internalFetchOptions, 2)
    );

  // Phase 1: execute only the independent domain specialists selected by the
  // Planner. They can run concurrently because none depends on another
  // specialist's output.
  const specialistTasks: Promise<unknown>[] = [];

  if (selected.has("Weather Agent")) specialistTasks.push(weather());
  if (selected.has("Ocean Agent")) specialistTasks.push(ocean());
  if (selected.has("Tide Agent")) specialistTasks.push(tide());
  if (selected.has("Fishing / PFZ Agent")) specialistTasks.push(fishing());
  if (selected.has("Disaster / Risk Agent")) specialistTasks.push(hazard());
  if (selected.has("Geospatial Agent")) specialistTasks.push(geospatial());
  if (selected.has("Route Optimization Agent")) specialistTasks.push(route());
  if (selected.has("Alerts Agent")) specialistTasks.push(alerts());

  await Promise.all(specialistTasks);

  // Item 22.4: fuse the already-retrieved specialist evidence before
  // provenance/risk/validation synthesis. The fusion layer does not fetch
  // data or invent missing values; it only relates the available sources.
  try {
    const fusedEvidence = fuseMarineEvidence({
      weather: (rawEvidence["Weather Agent"] as Record<string, unknown> | null) ?? null,
      ocean: (rawEvidence["Ocean Agent"] as Record<string, unknown> | null) ?? null,
      tide: (rawEvidence["Tide Agent"] as Record<string, unknown> | null) ?? null,
      hazards: (rawEvidence["Disaster / Risk Agent"] as Record<string, unknown> | null) ?? null,
      geofence: (rawEvidence["Geospatial Agent"] as Record<string, unknown> | null) ?? null,
      pfz: (rawEvidence["Fishing / PFZ Agent"] as Record<string, unknown> | null) ?? null,
    });

    rawEvidence["Multi-Source Data Fusion"] = fusedEvidence;

    publishEvidence({
      producer: "Multi-Source Data Fusion",
      evidenceId: `fusion-${Date.now()}`,
      status: "available",
      evidenceType: "synthesis",
      observedAt: fusedEvidence.generatedAt,
      source: "ORCA multi-source fusion layer",
      data: fusedEvidence,
      analysis: fusedEvidence.evidence.join(" "),
    });

    addAgentTrace(
      trace,
      "Multi-Source Data Fusion",
      `Fused ${fusedEvidence.sources.length} marine source(s) with explicit provenance, missing-source and conflict handling.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fusion error";
    publishEvidence({
      producer: "Multi-Source Data Fusion",
      evidenceId: `fusion-${Date.now()}`,
      status: "failed",
      evidenceType: "synthesis",
      observedAt: new Date().toISOString(),
      source: "ORCA multi-source fusion layer",
      data: null,
      error: message,
    });

    addAgentTrace(
      trace,
      "Multi-Source Data Fusion",
      `Fusion failed; downstream agents retain the original specialist evidence without invented values (${message}).`,
      "failed"
    );
  }

  // Phase 2: Marine Data depends on specialist outputs and the fusion result, so it cannot start
  // before Phase 1 has completed.
  if (selected.has("Marine Data Agent")) {
    const availableEvidence = JSON.stringify(buildEvidencePacket());

    try {
      outputs["Marine Data Agent"] = await runAIAgent(
        "Marine Data Agent",
        "Normalize and assess the provenance, completeness, units and freshness of marine evidence supplied by specialist agents.",
        `Review the structured specialist evidence for this query: ${query}. Each item contains producer, evidenceId, status, observedAt, source, data and analysis. Identify sources, timestamps, missing fields and conflicting measurements. Do not invent values.`,
        availableEvidence || "[]"
      );
      publishEvidence({
        producer: "Marine Data Agent",
        evidenceId: `marine-data-${Date.now()}`,
        status: "available",
        evidenceType: "validation",
        observedAt: new Date().toISOString(),
        source: "ORCA inter-agent evidence bus",
        data: buildEvidencePacket(),
        analysis: outputs["Marine Data Agent"],
      });
      addAgentTrace(trace, "Marine Data Agent", "Reviewed provenance, completeness and consistency after specialist execution.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown marine data error";
      outputs["Marine Data Agent"] = deterministicMarineDataSummary(rawEvidence);
      publishEvidence({
        producer: "Marine Data Agent",
        evidenceId: `marine-data-${Date.now()}`,
        status: "available",
        evidenceType: "validation",
        observedAt: new Date().toISOString(),
        source: "ORCA inter-agent evidence bus",
        data: buildEvidencePacket(),
        analysis: outputs["Marine Data Agent"],
      });
      addAgentTrace(trace, "Marine Data Agent", `LLM analysis unavailable; published provenance pass with deterministic fallback (${message}).`);
    }
  }

  // Phase 3: Risk is conditional. Only safety-critical workflows enter this
  // synthesis stage. It consumes the structured evidence published by the
  // independent specialists and the Marine Data quality pass.
  const riskNeeded = ["FISHING_SAFETY", "HAZARD", "ROUTE"].includes(intent);
  const riskSelected = selected.has("Disaster / Risk Agent");
  const shouldRunRiskPipeline = riskNeeded && riskSelected;

  if (shouldRunRiskPipeline) {
    const evidenceBeforeRisk = JSON.stringify(buildEvidencePacket());

    try {
      outputs["Risk Agent"] = await runAIAgent(
        "Risk Agent",
        "Combine specialist outputs into a transparent marine risk assessment.",
        `Determine the operational risk for this query: ${query}. Use the structured evidence envelopes and their producer/source/status fields. State the risk level only when supported by evidence. Explain the main contributing factors and uncertainties.`,
        evidenceBeforeRisk || "[]"
      );
      publishEvidence({
        producer: "Risk Agent",
        evidenceId: `risk-${Date.now()}`,
        status: "available",
        evidenceType: "synthesis",
        observedAt: new Date().toISOString(),
        source: "ORCA inter-agent evidence bus",
        data: buildEvidencePacket(),
        analysis: outputs["Risk Agent"],
      });
      addAgentTrace(trace, "Risk Agent", "Combined structured specialist and Marine Data evidence after dependencies finished; downstream validation is now unblocked.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown risk synthesis error";
      outputs["Risk Agent"] = `Risk Agent failed: ${message}`;
      publishEvidence({
        producer: "Risk Agent",
        evidenceId: `risk-${Date.now()}`,
        status: "failed",
        evidenceType: "synthesis",
        observedAt: new Date().toISOString(),
        source: "ORCA inter-agent evidence bus",
        data: buildEvidencePacket(),
        error: message,
      });
      addAgentTrace(trace, "Risk Agent", `Risk synthesis failed: ${message}`, "failed");
    }
  }

  // Phase 4: Validation is the mandatory safety gate. For risk workflows it
  // executes only after the conditional Risk stage above has completed (or
  // published a failed evidence envelope). For non-risk workflows it validates
  // the specialist + Marine Data evidence directly.
  const validationReady =
    selected.has("Validation / Safety Agent") &&
    (!shouldRunRiskPipeline || Boolean(interAgentEvidence["Risk Agent"]));

  let validationPassed = false;

  if (validationReady) {
    const validationContext = JSON.stringify(buildEvidencePacket());

    try {
      outputs["Validation / Safety Agent"] = await runAIAgent(
        "Validation / Safety Agent",
        "Check consistency, missing data, unsupported claims and safety-critical uncertainty.",
        `Validate the structured evidence for this query: ${query}. Check producer/source/status fields, evidence completeness, conflicts and unsupported claims. Identify whether the evidence is sufficient for a recommendation. Do not turn missing evidence into a positive or negative claim.`,
        validationContext || "[]",
        300
      );
      publishEvidence({
        producer: "Validation / Safety Agent",
        evidenceId: `validation-${Date.now()}`,
        status: "available",
        evidenceType: "validation",
        observedAt: new Date().toISOString(),
        source: "ORCA inter-agent evidence bus",
        data: buildEvidencePacket(),
        analysis: outputs["Validation / Safety Agent"],
      });
      validationPassed = true;
      addAgentTrace(trace, "Validation / Safety Agent", shouldRunRiskPipeline
        ? "Validated the complete specialist → Marine Data → Risk evidence chain before explanation."
        : "Validated the complete specialist → Marine Data evidence chain before explanation.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown validation error";
      outputs["Validation / Safety Agent"] = deterministicValidationSummary(outputs);
      validationPassed = true;
      publishEvidence({
        producer: "Validation / Safety Agent",
        evidenceId: `validation-${Date.now()}`,
        status: "available",
        evidenceType: "validation",
        observedAt: new Date().toISOString(),
        source: "ORCA inter-agent evidence bus",
        data: buildEvidencePacket(),
        analysis: outputs["Validation / Safety Agent"],
      });
      addAgentTrace(trace, "Validation / Safety Agent", `LLM validation unavailable; published deterministic safety validation (${message}).`);
    }
  }

  // Phase 5: Explanation is downstream of the validation gate. It receives
  // the complete structured evidence chain, never an unvalidated specialist
  // payload.
  const explanationReady =
    selected.has("Explanation Agent") &&
    validationReady &&
    validationPassed;

  if (explanationReady) {
    const finalContext = JSON.stringify(buildEvidencePacket());

    try {
      const finalAnswer = await runAIAgent(
        "Explanation Agent",
        "Turn validated multi-agent findings into a concise evidence-backed ORCA answer.",
        `Produce the final answer for the user's marine question: ${query}.\n\nUse only the structured evidence envelopes supplied by upstream agents. Prefer evidence with status=available and respect producer/source/observedAt fields.\nAnswer the user directly and naturally. Do not write a long research report.\nStart with the clear answer.\nThen give only the 2-4 most important evidence-backed points.\nMention an important uncertainty only if it materially affects the answer.\nUse concise paragraphs or bullets.\nKeep the final answer around 80-150 words.\nDo not expose internal agent reasoning, prompts, workflow details, or hidden analysis.\nDo not claim facts absent from the evidence.`,
        finalContext || "No validated evidence was returned.",
        500
      );
      publishEvidence({
        producer: "Explanation Agent",
        evidenceId: `explanation-${Date.now()}`,
        status: "available",
        evidenceType: "analysis",
        observedAt: new Date().toISOString(),
        source: "ORCA inter-agent evidence bus",
        data: buildEvidencePacket(),
        analysis: finalAnswer,
      });
      addAgentTrace(trace, "Explanation Agent", "Synthesized the structured validated evidence into the final evidence-backed response.");

      return {
        response: finalAnswer,
        agents: trace,
        interAgentEvidence: buildEvidencePacket(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown explanation error";
      const deterministicAnswer = intent === "WEATHER"
        ? deterministicWeatherAnswer(query, rawEvidence["Weather Agent"])
        : intent === "FISHING_PFZ"
          ? deterministicFishingPfzAnswer(query, rawEvidence["Fishing / PFZ Agent"])
          : intent === "FISHING_SAFETY"
            ? deterministicFishingSafetyAnswer(query, rawEvidence)
            : null;

      if (deterministicAnswer) {
        addAgentTrace(trace, "Explanation Agent", `LLM explanation unavailable; returned a deterministic evidence-backed answer (${message}).`);
        return { response: deterministicAnswer, agents: trace, interAgentEvidence: buildEvidencePacket() };
      }

      addAgentTrace(trace, "Explanation Agent", `LLM explanation unavailable and no safe deterministic answer exists (${message}).`, "failed");
    }
  }

  if (selected.has("Explanation Agent") && !explanationReady) {
    addAgentTrace(
      trace,
      "Explanation Agent",
      "Blocked by the safety gate because required validation evidence was not available.",
      "failed"
    );
  }

  return {
    response: "ORCA could not synthesize the multi-agent result safely.",
    agents: trace,
    interAgentEvidence: buildEvidencePacket(),
  };
}

function getLanguageName(language: LanguageCode) {
  try {
    const displayNames = new Intl.DisplayNames(["en"], {
      type: "language",
    });

    return displayNames.of(language) ?? language;
  } catch {
    return language;
  }
}

function isMarineKnowledgeQuery(query: string) {
  const q = query.toLowerCase();

  const keywords = [
    "advisory",
    "advisories",
    "bulletin",
    "bulletins",
    "marine warning",
    "ocean forecast",
    "ocean state forecast",
    "official forecast",
    "incois",
    "high wave",
    "swell",
    "cyclone bulletin",
    "marine information",
  ];

  return keywords.some((keyword) => q.includes(keyword));
}

async function retrieveMarineKnowledge() {
  const sourceUrl =
    "https://www.incois.gov.in/oceanservices/osfforecast.jsp";

  try {
    const sourceRes = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "ORCA-Marine-Intelligence/1.0",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!sourceRes.ok) {
      throw new Error(`INCOIS request failed: ${sourceRes.status}`);
    }

    const html = await sourceRes.text();

    const cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();

    const lower = cleanText.toLowerCase();

    const markers = [
      "ocean state forecast",
      "advisory",
      "forecast",
      "wave",
      "swell",
      "warning",
    ];

    const matchIndex = markers
      .map((marker) => lower.indexOf(marker))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];

    const evidence =
      matchIndex !== undefined
        ? cleanText.slice(
            Math.max(0, matchIndex - 150),
            matchIndex + 850
          )
        : cleanText.slice(0, 1000);

    return {
      available: true,
      source: "INCOIS",
      sourceUrl,
      retrievedAt: new Date().toISOString(),
      evidence,
    };
  } catch (error) {
    console.warn("Marine knowledge retrieval failed:", error);

    return {
      available: false,
      source: "INCOIS",
      sourceUrl,
      retrievedAt: new Date().toISOString(),
      evidence: null,
    };
  }
}

function buildKnowledgeResponse(
  knowledge: Awaited<ReturnType<typeof retrieveMarineKnowledge>>,
  ragResults: Awaited<ReturnType<typeof searchRag>>
) {
  if (ragResults.length > 0) {
    const evidence = ragResults
      .map(
        (doc, index) =>
          `Source ${index + 1}: ${
            doc.title ?? "Marine document"
          }. ${doc.content}`
      )
      .join("\n\n");

    return [
      "Official INCOIS marine information retrieved from the ORCA knowledge base.",
      evidence,
    ].join("\n\n");
  }

  if (!knowledge.available) {
    return "Official INCOIS marine information could not be retrieved right now.";
  }

  return [
    "Official INCOIS marine information retrieved.",
    `Source: ${knowledge.source}`,
    `Retrieved at: ${knowledge.retrievedAt}`,
    `Evidence: ${
      knowledge.evidence ?? "No readable evidence was returned."
    }`,
  ].join(" ");
}

/*
 * =========================================================
 * TRANSLATION
 * =========================================================
 *
 * Uses Llama through Groq.
 *
 * This means the response-generation and translation
 * pipeline does not require OPENAI_API_KEY.
 */
async function translateResponse(
  responseText: string,
  language: LanguageCode
): Promise<string> {
  if (language === "en" || !responseText.trim()) {
    return responseText;
  }

  if (!process.env.GROQ_API_KEY) {
    console.error(
      "ORCA multilingual response failed: GROQ_API_KEY is not configured."
    );
    return responseText;
  }

  const languageNames: Record<LanguageCode, string> = {
    en: "English",
    te: "Telugu",
    hi: "Hindi",
    ta: "Tamil",
    kn: "Kannada",
  };

  const targetLanguage = languageNames[language];

  try {
    const result = await openai.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      reasoning_effort: "none",
      temperature: 0.1,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: `
You are ORCA's multilingual marine intelligence translator.

Translate the complete response into ${targetLanguage}.

Return ONLY the final translated answer.
Do not output analysis, reasoning, explanations, alternatives, or <think> tags.

Rules:
1. Translate all natural-language text.
2. Keep the answer concise and natural.
3. Preserve the meaning and recommendation exactly.
4. Preserve every number, decimal, coordinate, date, time, percentage and measurement value.
5. Preserve units, URLs, source names such as INCOIS and technical identifiers.
6. Preserve Markdown formatting such as bold text and bullet points.
7. Do not add information.
8. Do not remove information.
9. Do not summarize or expand the answer.
10. The final response MUST be entirely in ${targetLanguage}, except for proper nouns, URLs, units and technical identifiers where appropriate.

Target language: ${targetLanguage}
          `.trim(),
        },
        {
          role: "user",
          content: responseText,
        },
      ],
    });

    let translated = result.choices[0]?.message?.content?.trim() || "";

    if (!translated) {
      throw new Error("Translation model returned an empty response.");
    }

    // Never expose model reasoning if it is returned despite the instruction.
    translated = translated
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim();

    if (/^<think>/i.test(translated)) {
      const endIndex = translated.search(/<\/think>/i);
      if (endIndex >= 0) {
        translated = translated
          .slice(endIndex + "</think>".length)
          .trim();
      }
    }

    if (!translated) {
      throw new Error("Translation response was empty after cleanup.");
    }

    console.log(
      `ORCA translation successful: English -> ${targetLanguage}`
    );

    return translated;
  } catch (error) {
    console.error(
      `ORCA translation to ${targetLanguage} failed:`,
      error
    );

    return responseText;
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const query =
      "query" in body
        ? (body as { query?: unknown }).query
        : undefined;

    const conversationHistory: ConversationMessage[] =
      "conversationHistory" in body &&
      Array.isArray((body as { conversationHistory?: unknown }).conversationHistory)
        ? (
            (body as {
              conversationHistory?: unknown[];
            }).conversationHistory ?? []
          )
            .filter(
              (message): message is { role: "user" | "orca"; text: string } =>
                typeof message === "object" &&
                message !== null &&
                "role" in message &&
                "text" in message &&
                (((message as { role?: unknown }).role === "user") ||
                  ((message as { role?: unknown }).role === "orca")) &&
                typeof (message as { text?: unknown }).text === "string"
            )
            .slice(-10)
            .map((message) => ({
              role: message.role,
              text: message.text.trim().slice(0, 2000),
            }))
        : [];

    /*
     * =========================================================
     * LANGUAGE
     * =========================================================
     *
     * If frontend explicitly provides a supported language,
     * use it.
     *
     * Otherwise automatically detect the language from query.
     *
     * This keeps compatibility with the existing frontend.
     */

    const requestedLanguage =
      "language" in body
        ? (body as { language?: unknown }).language
        : undefined;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const detectedLanguage = detectLanguage(query);

    // If the user actually types in a supported Indian language,
    // that language takes priority so ORCA replies in the language
    // the user communicated with. The selector is used when the
    // query itself is English.
    const selectedLanguage: LanguageCode =
      detectedLanguage !== "en"
        ? detectedLanguage
        : typeof requestedLanguage === "string" &&
          SUPPORTED_LANGUAGES.includes(
            requestedLanguage as LanguageCode
          )
        ? (requestedLanguage as LanguageCode)
        : "en";

    console.log(
      `ORCA language detected: ${selectedLanguage}`
    );

    const baseUrl = new URL(request.url).origin;
    const cookie = request.headers.get("cookie") ?? "";

    const internalFetchOptions = {
      cache: "no-store" as const,
      headers: {
        Cookie: cookie,
      },
    };

    const resolvedQuery = await resolveFollowUpQuery(
      query,
      conversationHistory
    );

    const analysis = await analyseMarineQuery(
      resolvedQuery,
      selectedLanguage,
      conversationHistory
    );

    const deterministicIntent = inferIntentFromText(resolvedQuery);

    const intent =
      deterministicIntent !== "GENERAL"
        ? deterministicIntent
        : await resolveIntent(
          resolvedQuery,
          analysis.intent,
          conversationHistory
        );

    const toolPlan = await planMarineToolCall(
      resolvedQuery,
      conversationHistory
    );

    if (toolPlan) {
      console.log(`ORCA function call selected: ${toolPlan.tool}`);
    }

    const agentExecutionPlan = await createAgentExecutionPlan(
      resolvedQuery,
      intent,
      conversationHistory
    );

    console.log(
      `ORCA agent execution plan (${agentExecutionPlan.mode}): ${agentExecutionPlan.selectedAgents.join(" -> ")}`
    );

    const clarification = buildClarificationResponse({
      intent,
      analysis,
      query: resolvedQuery,
      cookie,
      conversationHistory,
    });

    if (clarification) {
      return NextResponse.json({
        response: await translateResponse(clarification, selectedLanguage),
        intent,
        agent: selectAgent(intent),
        agents: [
          {
            name: "Planner / Orchestrator Agent",
            status: "completed",
            reason: "Detected missing information required for a safe marine response and requested clarification instead of guessing.",
          },
        ],
        language: selectedLanguage,
        languageName: getLanguageName(selectedLanguage),
        extracted: {
          location: analysis.location,
          time: analysis.time,
          date: analysis.date,
      },
        confidence: 1,
        needsClarification: true,
        clarificationReason: "Required marine context is missing.",
        agentExecutionPlan,
        availableAgents: Object.keys(AGENT_REGISTRY),
        knowledge: null,
        prototype: true,
      });
    }

    const agent = selectAgent(intent);

    console.log(`ORCA final routed intent: ${intent}`);

    /*
     * =========================================================
     * RAG SEARCH
     * =========================================================
     */

    let ragResults: Awaited<ReturnType<typeof searchRag>> = [];

    if (isMarineKnowledgeQuery(resolvedQuery)) {
      try {
        ragResults = await searchRag(resolvedQuery, 3, 0.35);

        console.log(
          `ORCA RAG: ${ragResults.length} relevant documents found.`
        );

        if (ragResults.length > 0) {
          console.log(
            "ORCA RAG top similarity:",
            ragResults[0].similarity
          );
        }
      } catch (error) {
        console.warn(
          "ORCA RAG retrieval failed:",
          error
        );
      }
    } else {
      console.log("ORCA RAG: skipped for this query.");
    }

    let response =
      "I can help analyze marine conditions for your selected operating location.";

    let agentTrace: AgentTrace[] = [];

    const agenticResult = await runAgenticWorkflow({
      intent,
      query: resolvedQuery,
      baseUrl,
      internalFetchOptions,
      cookie,
      conversationHistory,
      analysis,
      agentExecutionPlan,
    });

    if (agenticResult) {
      response = agenticResult.response;
      agentTrace = agenticResult.agents;
    }


    let knowledge:
      | Awaited<ReturnType<typeof retrieveMarineKnowledge>>
      | null = null;

    /*
     * =========================================================
     * MARINE KNOWLEDGE / RAG
     * =========================================================
     */

    if (!agenticResult && isMarineKnowledgeQuery(resolvedQuery)) {
      if (ragResults.length > 0) {
        knowledge = {
          available: true,
          source: "INCOIS",
          sourceUrl: ragResults[0].source,
          retrievedAt: new Date().toISOString(),
          evidence: ragResults
            .map((doc) => doc.content)
            .join("\n\n"),
        };

        response = buildKnowledgeResponse(
          knowledge,
          ragResults
        );
      } else {
        knowledge = await retrieveMarineKnowledge();

        response = buildKnowledgeResponse(
          knowledge,
          ragResults
        );
      }
    } else if (!agenticResult && intent === "GENERAL") {
      try {
        const alertsRes = await fetch(
          `${baseUrl}/api/alerts`,
          internalFetchOptions
        );

        if (!alertsRes.ok) {
          throw new Error("Alerts API failed");
        }

        const alerts = await alertsRes.json();

        const alert =
          alerts?.live &&
          Array.isArray(alerts.alerts)
            ? alerts.alerts[0]
            : null;

        response = alert
          ? `Marine alert status: ${alert.title}. ${alert.message}`
          : "No major marine alerts are currently available.";
      } catch {
        response =
          "ORCA could not retrieve the latest marine alerts.";
      }
    } else if (!agenticResult && intent === "FISHING_SAFETY") {
      try {
        const safetyRes = await fetch(
          `${baseUrl}/api/safety`,
          internalFetchOptions
        );

        if (!safetyRes.ok) {
          throw new Error("Safety API failed");
        }

        const safety = await safetyRes.json();

        if (safety?.live) {
          const location =
            safety.location ?? "selected location";

          const risk =
            safety.risk ?? "UNKNOWN";

          const score =
            safety.safetyScore ?? "N/A";

          const wind =
            safety.conditions?.windSpeed ?? "N/A";

          const waves =
            safety.conditions?.waveHeight ?? "N/A";

          const sst =
            safety.conditions
              ?.seaSurfaceTemperature ?? "N/A";

          response = [
            `Marine Safety Assessment for ${location}:`,
            `Risk level: ${risk}.`,
            `Safety score: ${score}/100.`,
            `Wind speed: ${wind} km/h.`,
            `Wave height: ${waves} m.`,
            `Sea surface temperature: ${sst}°C.`,
            safety.recommendation ??
              "No additional recommendation was provided.",
          ].join(" ");
        } else {
          response =
            "ORCA could not calculate the current marine safety conditions.";
        }
      } catch {
        response =
          "ORCA could not connect to the marine safety service.";
      }
    } else if (!agenticResult && intent === "FISHING_PFZ") {
      try {
        const pfzRes = await fetch(
          `${baseUrl}/api/pfz`,
          internalFetchOptions
        );

        if (!pfzRes.ok) {
          throw new Error("PFZ API failed");
        }

        const pfz = await pfzRes.json();

        if (
          Array.isArray(pfz?.zones) &&
          pfz.zones.length > 0
        ) {
          const bestZone = pfz.zones[0];

          response = [
            `INCOIS reports ${pfz.zones.length} potential fishing zone feature${
              pfz.zones.length === 1 ? "" : "s"
            }.`,
            `Nearest available PFZ: ${bestZone.id}.`,
            `Location: ${bestZone.latitude}, ${bestZone.longitude}.`,
            `Distance from selected operating location: ${
              bestZone.distanceFromCoast ?? "N/A"
            } km.`,
            `PFZ line length: ${
              bestZone.length ?? "N/A"
            } km.`,
            `Sector: ${
              bestZone.sector || "Not specified"
            }.`,
            `Forecast year: ${
              bestZone.year ?? "N/A"
            }.`,
            `Julian day: ${
              bestZone.julianDay ?? "N/A"
            }.`,
            `This recommendation is based on live INCOIS PFZ feature data. INCOIS does not provide a suitability or confidence score in this dataset.`,
          ].join(" ");
        } else {
          response =
            "No potential fishing zone data is currently available.";
        }
      } catch {
        response =
          "ORCA could not retrieve PFZ information.";
      }
    } else if (!agenticResult && intent === "WEATHER") {
      try {
        const weatherUrl =
          analysis.date === "Tomorrow"
            ? `${baseUrl}/api/weather?date=tomorrow`
            : `${baseUrl}/api/weather`;

        const weatherRes = await fetch(
          weatherUrl,
          internalFetchOptions
        );

        if (!weatherRes.ok) {
          throw new Error("Weather API failed");
        }

        const weather = await weatherRes.json();

        if (weather.forecast) {
          response = [
            `Weather forecast for ${weather.location}:`,
            `temperature from ${weather.temperatureMin}°C to ${weather.temperatureMax}°C.`,
            `Maximum wind speed: ${weather.windSpeed} km/h.`,
            `Precipitation probability: ${weather.precipitationProbability}%.`,
          ].join(" ");
        } else {
          response = [
            `Current weather for ${weather.location}:`,
            `${weather.temperature}°C.`,
            `Wind speed: ${weather.windSpeed} km/h.`,
            `Wind direction: ${weather.windDirection}°`,
          ].join(" ");
        }
      } catch {
        response =
          "Unable to retrieve weather data.";
      }
    } else if (!agenticResult && intent === "OCEAN_CONDITIONS") {
      try {
        const oceanRes = await fetch(
          `${baseUrl}/api/ocean`,
          internalFetchOptions
        );

        if (!oceanRes.ok) {
          throw new Error("Ocean API failed");
        }

        const ocean = await oceanRes.json();

        response = [
          `Current ocean conditions for ${ocean.location}:`,
          `Wave height: ${
            ocean.waveHeight ?? "N/A"
          } m.`,
          `Wave direction: ${
            ocean.waveDirection ?? "N/A"
          }°.`,
          `Wave period: ${
            ocean.wavePeriod ?? "N/A"
          } s.`,
          `Sea surface temperature: ${
            ocean.sst ?? "N/A"
          }°C.`,
        ].join(" ");
      } catch {
        response =
          "Unable to retrieve current ocean conditions.";
      }
    } else if (!agenticResult && intent === "TIDE") {
      try {
        const tideRes = await fetch(
          `${baseUrl}/api/tide`,
          internalFetchOptions
        );

        if (!tideRes.ok) {
          throw new Error("Tide API failed");
        }

        const tide = await tideRes.json();

        if (
          Array.isArray(tide?.tides) &&
          tide.tides.length > 0
        ) {
          const tideSummary = tide.tides
            .map(
              (item: {
                type?: string;
                time?: string;
                height?: number;
              }) =>
                `${item.type ?? "Tide"} at ${
                  item.time ?? "unknown time"
                } (${item.height ?? "N/A"} m)`
            )
            .join(", ");

          response = `Tide conditions for ${tide.location}: ${tideSummary}.`;
        } else {
          response =
            "No tide information is currently available.";
        }
      } catch {
        response =
          "ORCA could not retrieve tide information.";
      }
    } else if (!agenticResult && intent === "HAZARD") {
      try {
        const hazardRes = await fetch(
          `${baseUrl}/api/hazard`,
          internalFetchOptions
        );

        if (!hazardRes.ok) {
          throw new Error("Hazard API failed");
        }

        const hazard = await hazardRes.json();

        if (hazard?.live) {
          const location =
            hazard.location ?? "selected location";

          const risk =
            hazard.riskLevel ?? "UNKNOWN";

          const hazards = Array.isArray(hazard.hazards)
            ? hazard.hazards
            : [];

          if (hazards.length > 0) {
            const hazardSummary = hazards
              .map(
                (item: {
                  type?: string;
                  severity?: string;
                  message?: string;
                }) =>
                  `${item.type ?? "Marine hazard"}: ${
                    item.message ?? "Hazard detected"
                  }`
              )
              .join(" ");

            response = [
              `Marine hazard assessment for ${location}:`,
              `Risk level: ${risk}.`,
              hazardSummary,
              hazard.recommendation ??
                "Please check official marine warnings before operating.",
            ].join(" ");
          } else {
            response = [
              `Marine hazard assessment for ${location}:`,
              `Risk level: ${risk}.`,
              "No active hazards were detected from the available live marine and weather data.",
              hazard.recommendation ??
                "Continue monitoring official marine advisories.",
            ].join(" ");
          }
        } else {
          response =
            "ORCA could not retrieve the latest marine hazard conditions.";
        }
      } catch (error) {
        console.error(
          "ORCA hazard retrieval failed:",
          error
        );

        response =
          "ORCA could not connect to the marine hazard service.";
      }
    } else if (!agenticResult && intent === "ROUTE") {
      try {
        const routeRes = await fetch(
          `${baseUrl}/api/route`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
            },
            body: JSON.stringify({
              start: "Selected Operating Location",
              destination: "PFZ-01",
            }),
            cache: "no-store",
          }
        );

        if (!routeRes.ok) {
          throw new Error("Route API failed");
        }

        const routeData = await routeRes.json();
        const route = routeData?.route;

        if (route) {
          response = [
            `Route recommendation from ${route.start} to ${route.destination}:`,
            `approximately ${route.distanceKm} km,`,
            `estimated travel time ${route.estimatedTimeMinutes} minutes.`,
            `Risk level: ${route.riskLevel}.`,
            `Hazards: ${
              Array.isArray(route.hazards)
                ? route.hazards.join(", ")
                : "None reported"
            }.`,
            route.recommendation ??
              "No additional route recommendation was provided.",
          ].join(" ");
        } else {
          response =
            "Unable to calculate the marine route.";
        }
      } catch {
        response =
          "ORCA could not connect to the route optimization service.";
      }
    }

    /*
     * =========================================================
     * FINAL TRANSLATION
     * =========================================================
     */

    const translatedResponse =
      await translateResponse(
        response,
        selectedLanguage
      );

    const executedAgents = agentTrace
      .filter(
        (item) =>
          item.status === "completed" &&
          item.name !== "Planner / Orchestrator Agent"
      )
      .map((item) => item.name);

    const failedAgents = agentTrace
      .filter((item) => item.status === "failed")
      .map((item) => item.name);

    const followUpsByIntent: Record<string, string[]> = {
      WEATHER: [
        "Would you like the ocean conditions for the same time and location?",
        "Would you like a marine safety assessment for this location?",
      ],
      OCEAN_CONDITIONS: [
        "Would you like the weather and wind conditions for the same location?",
        "Would you like a marine safety assessment?",
      ],
      TIDE: [
        "Would you like the weather and wave conditions for the same location?",
      ],
      FISHING_PFZ: [
        "Would you like the nearest PFZ ranked by distance?",
        "Would you like the safety conditions around the PFZ?",
      ],
      FISHING_SAFETY: [
        "Would you like the nearest suitable fishing zone?",
        "Would you like a safer route to the fishing area?",
      ],
      HAZARD: [
        "Would you like a marine safety score for the same location?",
        "Would you like to check a safer route?",
      ],
      ROUTE: [
        "Would you like to compare the route alternatives by risk and ETA?",
      ],
      GENERAL: [
        "Would you like current weather, ocean conditions, or marine hazards?",
      ],
    };

    const evidenceBacked = executedAgents.length > 0 && failedAgents.length === 0;

    // Confidence is derived from execution quality instead of being a fixed
    // placeholder. This is response/evidence confidence, not model certainty.
    const completedCount = executedAgents.length;
    const failedCount = failedAgents.length;
    const totalAgentCount = completedCount + failedCount;
    const executionCompleteness =
      totalAgentCount > 0 ? completedCount / totalAgentCount : 0;

    let responseConfidence = 0.45 + executionCompleteness * 0.35;

    if (evidenceBacked) responseConfidence += 0.10;
    if (analysis.location && analysis.location !== "Unknown") {
      responseConfidence += 0.05;
    }
    if (analysis.date && analysis.date !== "Unknown") {
      responseConfidence += 0.03;
    }
    if (toolPlan) responseConfidence += 0.02;

    responseConfidence = Math.min(0.95, Math.max(0.20, responseConfidence));

    const evidenceSummary = {
      status: evidenceBacked ? "supported" : "partial",
      confidence: Number(responseConfidence.toFixed(2)),
      basis: [
        `${completedCount} agent${completedCount === 1 ? "" : "s"} completed`,
        failedCount > 0
          ? `${failedCount} agent${failedCount === 1 ? "" : "s"} failed`
          : "no participating agents failed",
        "final response synthesized from available agent evidence",
      ],
      limitation:
        failedCount > 0
          ? "One or more evidence sources or agents failed; treat the response as partial."
          : null,
      generatedAt: new Date().toISOString(),
    };

    const executionSummary = {
      intent,
      agentsExecuted: executedAgents,
      agentsFailed: failedAgents,
      evidenceBacked,
      extractedContext: {
        location: analysis.location,
        date: analysis.date,
        time: analysis.time ?? null,
      },
    };

    return NextResponse.json({
      response: translatedResponse,
      executionSummary,
      followUps: followUpsByIntent[intent] ?? [],

      intent,

      agent,

      agents: agentTrace,

      language: selectedLanguage,

      languageName:
        getLanguageName(selectedLanguage),

      extracted: {
        location: analysis.location,
        time: analysis.time,
        date: analysis.date,
      },

      confidence: evidenceSummary.confidence,
      evidenceSummary,

      toolCall: toolPlan
        ? { name: "select_marine_tool", tool: toolPlan.tool, reason: toolPlan.reason }
        : null,
      agentExecutionPlan,

      // Full agent catalog is exposed for diagnostics/documentation;
      // `agents` contains only agents actually executed for this query.
      availableAgents: Object.keys(AGENT_REGISTRY),

      knowledge: knowledge
        ? {
            available: knowledge.available,
            source: knowledge.source,
            sourceUrl: knowledge.sourceUrl,
            retrievedAt: knowledge.retrievedAt,
            evidence: knowledge.evidence,
          }
        : null,

      prototype: true,
    });
  } catch (error) {
    console.error("ORCA API error:", error);

    return NextResponse.json(
      {
        error: "Unable to process ORCA request",
      },
      {
        status: 500,
      }
    );
  }
}