import { NextRequest, NextResponse } from "next/server";

const SARVAM_API_URL = "https://api.sarvam.ai/text-to-speech/stream";

const LANGUAGE_CODES: Record<string, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  kn: "kn-IN",
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "SARVAM_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const language =
      typeof body?.language === "string" ? body.language.toLowerCase() : "en";

    if (!text) {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 }
      );
    }

    if (text.length > 3500) {
      return NextResponse.json(
        { error: "Text is too long for Sarvam TTS. Maximum is 3500 characters." },
        { status: 400 }
      );
    }

    const languageCode = LANGUAGE_CODES[language];

    if (!languageCode) {
      return NextResponse.json(
        {
          error:
            "Unsupported language. Supported languages: en, te, hi, ta, kn.",
        },
        { status: 400 }
      );
    }

    const sarvamResponse = await fetch(SARVAM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model: "bulbul:v3",
        language_code: languageCode,
        speaker: "shubh",
        output_audio_codec: "mp3",
        output_audio_bitrate: "128k",
        pace: 1,
      }),
      cache: "no-store",
    });

    if (!sarvamResponse.ok) {
      let errorMessage = `Sarvam TTS request failed with status ${sarvamResponse.status}.`;

      try {
        const errorBody = await sarvamResponse.json();
        if (errorBody?.error?.message) {
          errorMessage = errorBody.error.message;
        }
      } catch {
        // Keep the generic error message when Sarvam does not return JSON.
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: sarvamResponse.status }
      );
    }

    return new NextResponse(sarvamResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Sarvam TTS error:", error);

    return NextResponse.json(
      { error: "Unable to generate speech right now." },
      { status: 500 }
    );
  }
}
