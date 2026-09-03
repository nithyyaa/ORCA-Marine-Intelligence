import OpenAI from "openai";

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
  language: string;
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedIntents: MarineIntent[] = [
  "FISHING_SAFETY",
  "FISHING_PFZ",
  "WEATHER",
  "OCEAN_CONDITIONS",
  "TIDE",
  "HAZARD",
  "ROUTE",
  "GENERAL",
];

function fallbackAnalysis(query: string): MarineQuery {
  return {
    originalQuery: query,
    intent: "GENERAL",
    location: "Current operating location",
    date: "Current",
    time: null,
    language: "en",
  };
}

export async function analyseMarineQuery(
  query: string,
  selectedLanguage = "en"
): Promise<MarineQuery> {
  if (!query.trim()) {
    return fallbackAnalysis(query);
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5.6-luna",

      input: [
        {
          role: "developer",
          content: `
You are ORCA's marine query understanding engine.

Your job is ONLY to understand the user's marine query and return structured information.

The user may write in:
- English
- Telugu
- Hindi
- Tamil
- Kannada

Do NOT depend on hardcoded keywords.

Understand the meaning of the query semantically, regardless of language.

Determine:

1. intent
2. location
3. date
4. time
5. language

Allowed intents:

FISHING_SAFETY
- Whether fishing or going to sea is safe
- Whether it is safe to go fishing
- Marine safety conditions

FISHING_PFZ
- Potential Fishing Zones
- Best fishing areas
- Where fish may be found
- Fishing suitability
- PFZ recommendations

WEATHER
- Weather
- Temperature
- Rain
- Wind
- Weather forecast

OCEAN_CONDITIONS
- Waves
- Sea state
- Ocean currents
- Sea surface temperature
- General ocean conditions

TIDE
- High tide
- Low tide
- Tide timing
- Tide conditions

HAZARD
- Cyclones
- Lightning
- Dangerous waves
- Strong winds
- Heavy rain
- Marine hazards
- Warnings or alerts

ROUTE
- Safest route
- Fastest route
- Route between locations
- Vessel navigation
- Route optimization

GENERAL
- Anything that does not clearly belong to the above categories

DATE RULES:

If the user means today/current conditions:
"Current"

If the user means tomorrow:
"Tomorrow"

If the user specifies another date, return that date in a clear form.

If no date is mentioned:
"Current"

TIME RULES:

Extract a specific requested time if present.

Examples:
"6 AM" -> "06:00"
"6 PM" -> "18:00"
"morning" -> "morning"
"evening" -> "evening"

If no time is specified:
null

LOCATION RULES:

Extract the location mentioned by the user.

If no location is mentioned:
"Current operating location"

LANGUAGE RULES:

Return the language of the user's query.

Use:
"en" for English
"te" for Telugu
"hi" for Hindi
"ta" for Tamil
"kn" for Kannada

The selected response language is provided separately.
Do not confuse the selected response language with the language of the user's query.

Return ONLY valid JSON matching the requested schema.
`,
        },
        {
          role: "user",
          content: `
Selected response language: ${selectedLanguage}

User query:
${query}
`,
        },
      ],

      text: {
        format: {
          type: "json_schema",
          name: "marine_query_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: allowedIntents,
              },
              location: {
                type: ["string", "null"],
              },
              date: {
                type: "string",
              },
              time: {
                type: ["string", "null"],
              },
              language: {
                type: "string",
              },
            },
            required: [
              "intent",
              "location",
              "date",
              "time",
              "language",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text);

    const intent: MarineIntent = allowedIntents.includes(
      parsed.intent as MarineIntent
    )
      ? parsed.intent
      : "GENERAL";

    return {
      originalQuery: query,
      intent,
      location:
        typeof parsed.location === "string" && parsed.location.trim()
          ? parsed.location
          : "Current operating location",
      date:
        typeof parsed.date === "string" && parsed.date.trim()
          ? parsed.date
          : "Current",
      time:
        typeof parsed.time === "string" && parsed.time.trim()
          ? parsed.time
          : null,
      language:
        typeof parsed.language === "string" && parsed.language.trim()
          ? parsed.language
          : selectedLanguage,
    };
  } catch (error) {
    console.error("ORCA AI query analysis failed:", error);

    return fallbackAnalysis(query);
  }
}