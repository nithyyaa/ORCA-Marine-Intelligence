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

export type ConversationMessage = {
  role: "user" | "orca";
  text: string;
};

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
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

function fallbackAnalysis(
  query: string,
  selectedLanguage = "en"
): MarineQuery {
  return {
    originalQuery: query,
    intent: "GENERAL",
    location: "Current operating location",
    date: "Current",
    time: null,
    language: selectedLanguage,
  };
}

export async function analyseMarineQuery(
  query: string,
  selectedLanguage = "en",
  conversationHistory: ConversationMessage[] = []
): Promise<MarineQuery> {
  if (!query.trim()) {
    return fallbackAnalysis(query, selectedLanguage);
  }

  try {
    const recentHistory = conversationHistory
      .slice(-10)
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "orca") &&
          typeof message.text === "string" &&
          message.text.trim()
      )
      .map(
        (message) =>
          `${message.role === "user" ? "User" : "ORCA"}: ${message.text
            .trim()
            .slice(0, 1200)}`
      )
      .join("\n");

    const conversationContext = recentHistory
      ? `
Previous conversation:

${recentHistory}

Use this previous conversation ONLY when it is relevant to understanding
the current user query.

The current query may be a follow-up such as:
- "What about tomorrow?"
- "And the waves?"
- "Is it safe?"
- "What about there?"
- "How about evening?"

Resolve references such as location, date, time, activity, or topic from the
previous conversation when the current query depends on them.

The current user query has priority if it explicitly provides new information.
Do not blindly copy information from previous turns when the current query
changes it.
`
      : `
There is no previous conversation context.
Treat the current query as a standalone query.
`;

    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
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

You are also given previous conversation context when available.

Use that context to resolve follow-up questions and references.

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

FOLLOW-UP CONTEXT RULES:

If the current query is incomplete but clearly refers to the previous
conversation, use the previous conversation to resolve the missing context.

Examples:

Previous:
User: "What is the weather in Vizag?"
Current:
"What about tomorrow?"

Return:
intent = WEATHER
location = Vizag
date = Tomorrow

Previous:
User: "Is fishing safe in Vizag?"
Current:
"What about evening?"

Return:
intent = FISHING_SAFETY
location = Vizag
time = evening

Previous:
User: "What are the waves near Chennai?"
Current:
"And tomorrow?"

Return:
intent = OCEAN_CONDITIONS
location = Chennai
date = Tomorrow

If the current query contains a new location, date, time, or topic,
prefer the new information.

Do not invent context that is not supported by the current query or
previous conversation.

DATE RULES:

If the user means today/current conditions:
"Current"

If the user means tomorrow:
"Tomorrow"

If the user specifies another date, return that date in a clear form.

If no date is mentioned in the current query but the previous conversation
clearly establishes the date being discussed, preserve that context.

If no date is available:
"Current"

TIME RULES:

Extract a specific requested time if present.

Examples:
"6 AM" -> "06:00"
"6 PM" -> "18:00"
"morning" -> "morning"
"evening" -> "evening"

If the current query does not specify a time but the previous conversation
clearly establishes the time being discussed, preserve that context.

If no time is specified:
null

LOCATION RULES:

Extract the location mentioned by the user.

If the current query does not mention a location but clearly refers to a
location from the previous conversation, preserve that location.

If no location is mentioned anywhere:
"Current operating location"

LANGUAGE RULES:

Return the language of the user's current query.

Use:
"en" for English
"te" for Telugu
"hi" for Hindi
"ta" for Tamil
"kn" for Kannada

The selected response language is provided separately.
Do not confuse the selected response language with the language of the user's query.

Return ONLY valid JSON.

The JSON MUST have exactly these fields:

{
  "intent": "FISHING_SAFETY | FISHING_PFZ | WEATHER | OCEAN_CONDITIONS | TIDE | HAZARD | ROUTE | GENERAL",
  "location": "string",
  "date": "string",
  "time": "string or null",
  "language": "en | te | hi | ta | kn"
}
`,
        },
        {
          role: "user",
          content: `
Selected response language: ${selectedLanguage}

${conversationContext}

Current user query:
${query}
`,
        },
      ],

      response_format: {
        type: "json_object",
      },

      temperature: 0.1,
      max_tokens: 300,
    });

    const output = response.choices[0]?.message?.content;

    if (!output) {
      throw new Error("Groq returned an empty response.");
    }

    const parsed = JSON.parse(output);

    const intent: MarineIntent = allowedIntents.includes(
      parsed.intent as MarineIntent
    )
      ? parsed.intent
      : "GENERAL";

    const validLanguages = ["en", "te", "hi", "ta", "kn"];

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
        typeof parsed.language === "string" &&
        validLanguages.includes(parsed.language)
          ? parsed.language
          : selectedLanguage,
    };
  } catch (error) {
    console.error("ORCA Llama/Groq query analysis failed:", error);

    return fallbackAnalysis(query, selectedLanguage);
  }
}