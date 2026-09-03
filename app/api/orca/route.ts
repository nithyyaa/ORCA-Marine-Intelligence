import { NextResponse } from "next/server";
import { analyseMarineQuery } from "@/lib/orca/intent";

function selectAgent(intent: string) {
  const agents: Record<string, string> = {
    FISHING_SAFETY: "Validation/Safety Agent",
    FISHING_PFZ: "Fishing/PFZ Agent",
    WEATHER: "Weather Agent",
    OCEAN_CONDITIONS: "Ocean Agent",
    TIDE: "Tide Agent",
    HAZARD: "Disaster/Risk Agent",
    ROUTE: "Route Optimization Agent",
    GENERAL: "Planner/Orchestrator",
  };

  return agents[intent];
}

function getLanguageName(language: string) {
  const languages: Record<string, string> = {
    en: "English",
    te: "Telugu",
    hi: "Hindi",
    ta: "Tamil",
    kn: "Kannada",
  };

  return languages[language] ?? "English";
}

export async function POST(request: Request) {
  try {
    const { query, language = "en" } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const supportedLanguages = ["en", "te", "hi", "ta", "kn"];

    const selectedLanguage = supportedLanguages.includes(language)
      ? language
      : "en";

    const baseUrl = new URL(request.url).origin;

    const cookie = request.headers.get("cookie") ?? "";

    const internalFetchOptions = {
      cache: "no-store" as const,
      headers: {
        Cookie: cookie,
      },
    };

    const analysis = await analyseMarineQuery(query, language);
    const intent = analysis.intent;
    const agent = selectAgent(intent);

    let response =
      "I can help analyze marine conditions for your selected operating location.";

    /*
     * GENERAL
     */
    if (intent === "GENERAL") {
      try {
        const alertsRes = await fetch(
          `${baseUrl}/api/alerts`,
          internalFetchOptions
        );

        const alerts = await alertsRes.json();

        if (alerts.live && alerts.alerts?.length) {
          const alert = alerts.alerts[0];

          if (selectedLanguage === "te") {
            response =
              `⚠️ సముద్ర హెచ్చరిక: ${alert.title}. ${alert.message}`;
          } else if (selectedLanguage === "hi") {
            response =
              `⚠️ समुद्री चेतावनी: ${alert.title}. ${alert.message}`;
          } else if (selectedLanguage === "ta") {
            response =
              `⚠️ கடல் எச்சரிக்கை: ${alert.title}. ${alert.message}`;
          } else if (selectedLanguage === "kn") {
            response =
              `⚠️ ಸಮುದ್ರ ಎಚ್ಚರಿಕೆ: ${alert.title}. ${alert.message}`;
          } else {
            response =
              `⚠️ Marine alert status: ${alert.title}. ${alert.message}`;
          }
        } else {
          if (selectedLanguage === "te") {
            response =
              "ప్రస్తుతం ఎలాంటి ప్రధాన సముద్ర హెచ్చరికలు అందుబాటులో లేవు.";
          } else if (selectedLanguage === "hi") {
            response =
              "वर्तमान में कोई प्रमुख समुद्री चेतावनी उपलब्ध नहीं है।";
          } else if (selectedLanguage === "ta") {
            response =
              "தற்போது முக்கியமான கடல் எச்சரிக்கைகள் எதுவும் கிடைக்கவில்லை.";
          } else if (selectedLanguage === "kn") {
            response =
              "ಪ್ರಸ್ತುತ ಯಾವುದೇ ಪ್ರಮುಖ ಸಮುದ್ರ ಎಚ್ಚರಿಕೆಗಳು ಲಭ್ಯವಿಲ್ಲ.";
          } else {
            response =
              "No major marine alerts are currently available.";
          }
        }
      } catch {
        if (selectedLanguage === "te") {
          response =
            "⚠️ ORCA తాజా సముద్ర హెచ్చరికలను పొందలేకపోయింది.";
        } else if (selectedLanguage === "hi") {
          response =
            "⚠️ ORCA नवीनतम समुद्री चेतावनियां प्राप्त नहीं कर सका।";
        } else if (selectedLanguage === "ta") {
          response =
            "⚠️ ORCA சமீபத்திய கடல் எச்சரிக்கைகளைப் பெற முடியவில்லை.";
        } else if (selectedLanguage === "kn") {
          response =
            "⚠️ ORCA ಇತ್ತೀಚಿನ ಸಮುದ್ರ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        } else {
          response =
            "⚠️ ORCA could not retrieve the latest marine alerts.";
        }
      }
    }

    /*
     * FISHING SAFETY
     */
    if (intent === "FISHING_SAFETY") {
      try {
        const safetyRes = await fetch(
          `${baseUrl}/api/safety`,
          internalFetchOptions
        );

        const safety = await safetyRes.json();

        if (safety.live) {
          const location = safety.location;
          const risk = safety.risk;
          const score = safety.safetyScore;
          const wind = safety.conditions.windSpeed;
          const waves = safety.conditions.waveHeight;
          const sst =
            safety.conditions.seaSurfaceTemperature ?? "N/A";

          if (selectedLanguage === "te") {
            response =
              `🛟 ${location} కోసం సముద్ర భద్రతా అంచనా: ` +
              `ప్రమాద స్థాయి: ${risk}. ` +
              `భద్రతా స్కోర్: ${score}/100. ` +
              `గాలి వేగం: ${wind} km/h. ` +
              `అలల ఎత్తు: ${waves} m. ` +
              `సముద్ర ఉపరితల ఉష్ణోగ్రత: ${sst}°C. ` +
              `${risk === "HIGH"
                ? "ప్రస్తుత పరిస్థితుల్లో చేపల వేటకు వెళ్లడం సిఫార్సు చేయబడదు."
                : risk === "MODERATE"
                ? "జాగ్రత్త వహించండి. మరింత సురక్షితమైన సముద్ర పరిస్థితుల కోసం వేచి ఉండటం మంచిది."
                : "ప్రస్తుత పరిస్థితులు చేపల వేటకు అనుకూలంగా కనిపిస్తున్నాయి."
              }`;
          } else if (selectedLanguage === "hi") {
            response =
              `🛟 ${location} के लिए समुद्री सुरक्षा आकलन: ` +
              `जोखिम स्तर: ${risk}. ` +
              `सुरक्षा स्कोर: ${score}/100. ` +
              `हवा की गति: ${wind} km/h. ` +
              `लहरों की ऊंचाई: ${waves} m. ` +
              `समुद्र की सतह का तापमान: ${sst}°C. ` +
              `${risk === "HIGH"
                ? "वर्तमान परिस्थितियों में मछली पकड़ने की सलाह नहीं दी जाती है।"
                : risk === "MODERATE"
                ? "सावधानी बरतें। अधिक सुरक्षित समुद्री परिस्थितियों की प्रतीक्षा करने पर विचार करें।"
                : "वर्तमान परिस्थितियां मछली पकड़ने के लिए अनुकूल दिखाई देती हैं।"
              }`;
          } else if (selectedLanguage === "ta") {
            response =
              `🛟 ${location} கடல் பாதுகாப்பு மதிப்பீடு: ` +
              `ஆபத்து நிலை: ${risk}. ` +
              `பாதுகாப்பு மதிப்பெண்: ${score}/100. ` +
              `காற்றின் வேகம்: ${wind} km/h. ` +
              `அலை உயரம்: ${waves} m. ` +
              `கடல் மேற்பரப்பு வெப்பநிலை: ${sst}°C. ` +
              `${risk === "HIGH"
                ? "தற்போதைய சூழ்நிலையில் மீன்பிடிக்க பரிந்துரைக்கப்படவில்லை."
                : risk === "MODERATE"
                ? "எச்சரிக்கையுடன் செயல்படுங்கள். பாதுகாப்பான கடல் நிலைமைகளுக்காக காத்திருக்கவும்."
                : "தற்போதைய சூழ்நிலைகள் மீன்பிடிக்க ஏற்றதாகத் தெரிகின்றன."
              }`;
          } else if (selectedLanguage === "kn") {
            response =
              `🛟 ${location} ಸಮುದ್ರ ಸುರಕ್ಷತಾ ಮೌಲ್ಯಮಾಪನ: ` +
              `ಅಪಾಯ ಮಟ್ಟ: ${risk}. ` +
              `ಸುರಕ್ಷತಾ ಸ್ಕೋರ್: ${score}/100. ` +
              `ಗಾಳಿಯ ವೇಗ: ${wind} km/h. ` +
              `ಅಲೆಗಳ ಎತ್ತರ: ${waves} m. ` +
              `ಸಮುದ್ರ ಮೇಲ್ಮೈ ತಾಪಮಾನ: ${sst}°C. ` +
              `${risk === "HIGH"
                ? "ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಮೀನುಗಾರಿಕೆಗೆ ಹೋಗಲು ಶಿಫಾರಸು ಮಾಡಲಾಗುವುದಿಲ್ಲ."
                : risk === "MODERATE"
                ? "ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ. ಹೆಚ್ಚು ಸುರಕ್ಷಿತ ಸಮುದ್ರ ಪರಿಸ್ಥಿತಿಗಳಿಗಾಗಿ ಕಾಯುವುದನ್ನು ಪರಿಗಣಿಸಿ."
                : "ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಗಳು ಮೀನುಗಾರಿಕೆಗೆ ಅನುಕೂಲಕರವಾಗಿ ಕಾಣುತ್ತಿವೆ."
              }`;
          } else {
            response =
              `🛟 Marine Safety Assessment for ${location}: ` +
              `Risk level: ${risk}. ` +
              `Safety score: ${score}/100. ` +
              `Wind speed: ${wind} km/h. ` +
              `Wave height: ${waves} m. ` +
              `Sea surface temperature: ${sst}°C. ` +
              `${safety.recommendation}`;
          }
        } else {
          if (selectedLanguage === "te") {
            response =
              "⚠️ ORCA ప్రస్తుత సముద్ర భద్రతా పరిస్థితులను లెక్కించలేకపోయింది.";
          } else if (selectedLanguage === "hi") {
            response =
              "⚠️ ORCA वर्तमान समुद्री सुरक्षा स्थितियों की गणना नहीं कर सका।";
          } else if (selectedLanguage === "ta") {
            response =
              "⚠️ ORCA தற்போதைய கடல் பாதுகாப்பு நிலைமைகளை கணக்கிட முடியவில்லை.";
          } else if (selectedLanguage === "kn") {
            response =
              "⚠️ ORCA ಪ್ರಸ್ತುತ ಸಮುದ್ರ ಸುರಕ್ಷತಾ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಲೆಕ್ಕಹಾಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
          } else {
            response =
              "⚠️ ORCA could not calculate the current marine safety conditions.";
          }
        }
      } catch {
        if (selectedLanguage === "te") {
          response =
            "⚠️ ORCA సముద్ర భద్రతా సేవకు కనెక్ట్ కాలేకపోయింది.";
        } else if (selectedLanguage === "hi") {
          response =
            "⚠️ ORCA समुद्री सुरक्षा सेवा से कनेक्ट नहीं कर सका।";
        } else if (selectedLanguage === "ta") {
          response =
            "⚠️ ORCA கடல் பாதுகாப்பு சேவையுடன் இணைக்க முடியவில்லை.";
        } else if (selectedLanguage === "kn") {
          response =
            "⚠️ ORCA ಸಮುದ್ರ ಸುರಕ್ಷತಾ ಸೇವೆಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        } else {
          response =
            "⚠️ ORCA could not connect to the marine safety service.";
        }
      }
    }

    /*
     * FISHING / PFZ
     */
    if (intent === "FISHING_PFZ") {
      try {
        const pfzRes = await fetch(
          `${baseUrl}/api/pfz`,
          internalFetchOptions
        );

        const pfz = await pfzRes.json();

        if (pfz.zones?.length) {
          const bestZone = pfz.zones
            .filter(
              (zone: { suitability: string }) =>
                zone.suitability === "HIGH"
            )
            .sort(
              (
                a: { confidence: number },
                b: { confidence: number }
              ) => b.confidence - a.confidence
            )[0];

          if (bestZone) {
            const confidence =
              (bestZone.confidence * 100).toFixed(0);

            if (selectedLanguage === "te") {
              response =
                `🎣 ఉత్తమ సంభావ్య చేపల వేట ప్రాంతం: ${bestZone.id}. ` +
                `అనుకూలత: ${bestZone.suitability}. ` +
                `నమ్మక స్థాయి: ${confidence}%. ` +
                `తీరం నుండి దూరం: ${bestZone.distanceFromCoast} km. ` +
                `అంచనా క్యాచ్ సామర్థ్యం: ${bestZone.estimatedCatchPotential}. ` +
                `SST: ${bestZone.factors.seaSurfaceTemperature}°C, ` +
                `క్లోరోఫిల్: ${bestZone.factors.chlorophyll}.`;
            } else if (selectedLanguage === "hi") {
              response =
                `🎣 सबसे अच्छा संभावित मछली पकड़ने का क्षेत्र: ${bestZone.id}. ` +
                `उपयुक्तता: ${bestZone.suitability}. ` +
                `विश्वास स्तर: ${confidence}%. ` +
                `तट से दूरी: ${bestZone.distanceFromCoast} km. ` +
                `अनुमानित पकड़ क्षमता: ${bestZone.estimatedCatchPotential}. ` +
                `SST: ${bestZone.factors.seaSurfaceTemperature}°C, ` +
                `क्लोरोफिल: ${bestZone.factors.chlorophyll}.`;
            } else if (selectedLanguage === "ta") {
              response =
                `🎣 சிறந்த சாத்தியமான மீன்பிடி பகுதி: ${bestZone.id}. ` +
                `பொருத்தம்: ${bestZone.suitability}. ` +
                `நம்பகத்தன்மை: ${confidence}%. ` +
                `கரையிலிருந்து தூரம்: ${bestZone.distanceFromCoast} km. ` +
                `மதிப்பிடப்பட்ட பிடிப்பு திறன்: ${bestZone.estimatedCatchPotential}. ` +
                `SST: ${bestZone.factors.seaSurfaceTemperature}°C, ` +
                `குளோரோபில்: ${bestZone.factors.chlorophyll}.`;
            } else if (selectedLanguage === "kn") {
              response =
                `🎣 ಅತ್ಯುತ್ತಮ ಸಂಭಾವ್ಯ ಮೀನುಗಾರಿಕಾ ವಲಯ: ${bestZone.id}. ` +
                `ಸೂಕ್ತತೆ: ${bestZone.suitability}. ` +
                `ವಿಶ್ವಾಸ ಮಟ್ಟ: ${confidence}%. ` +
                `ಕರಾವಳಿಯಿಂದ ದೂರ: ${bestZone.distanceFromCoast} km. ` +
                `ಅಂದಾಜು ಹಿಡಿತ ಸಾಮರ್ಥ್ಯ: ${bestZone.estimatedCatchPotential}. ` +
                `SST: ${bestZone.factors.seaSurfaceTemperature}°C, ` +
                `ಕ್ಲೋರೊಫಿಲ್: ${bestZone.factors.chlorophyll}.`;
            } else {
              response =
                `🎣 Best potential fishing zone: ${bestZone.id}. ` +
                `Suitability is ${bestZone.suitability} ` +
                `with ${confidence}% confidence. ` +
                `It is approximately ${bestZone.distanceFromCoast} km from the coast. ` +
                `Estimated catch potential: ${bestZone.estimatedCatchPotential}. ` +
                `SST: ${bestZone.factors.seaSurfaceTemperature}°C, ` +
                `chlorophyll: ${bestZone.factors.chlorophyll}.`;
            }
          } else {
            if (selectedLanguage === "te") {
              response =
                "🎣 PFZ డేటా విజయవంతంగా పొందబడింది, కానీ ప్రస్తుతం అత్యంత అనుకూలమైన చేపల వేట ప్రాంతం కనుగొనబడలేదు.";
            } else if (selectedLanguage === "hi") {
              response =
                "🎣 PFZ डेटा सफलतापूर्वक प्राप्त किया गया, लेकिन अभी कोई अत्यधिक उपयुक्त मछली पकड़ने का क्षेत्र नहीं मिला।";
            } else if (selectedLanguage === "ta") {
              response =
                "🎣 PFZ தரவு பெறப்பட்டது, ஆனால் தற்போது மிகவும் ஏற்ற மீன்பிடிப் பகுதி எதுவும் கிடைக்கவில்லை.";
            } else if (selectedLanguage === "kn") {
              response =
                "🎣 PFZ ಡೇಟಾವನ್ನು ಪಡೆಯಲಾಗಿದೆ, ಆದರೆ ಪ್ರಸ್ತುತ ಹೆಚ್ಚು ಸೂಕ್ತವಾದ ಮೀನುಗಾರಿಕೆ ಪ್ರದೇಶ ಕಂಡುಬಂದಿಲ್ಲ.";
            } else {
              response =
                "🎣 PFZ data was retrieved, but no highly suitable zone was found.";
            }
          }
        } else {
          if (selectedLanguage === "te") {
            response =
              "⚠️ ప్రస్తుతం సంభావ్య చేపల వేట ప్రాంతాల డేటా అందుబాటులో లేదు.";
          } else if (selectedLanguage === "hi") {
            response =
              "⚠️ वर्तमान में संभावित मछली पकड़ने वाले क्षेत्रों का डेटा उपलब्ध नहीं है।";
          } else if (selectedLanguage === "ta") {
            response =
              "⚠️ தற்போது சாத்தியமான மீன்பிடிப் பகுதிகளின் தரவு கிடைக்கவில்லை.";
          } else if (selectedLanguage === "kn") {
            response =
              "⚠️ ಪ್ರಸ್ತುತ ಸಂಭಾವ್ಯ ಮೀನುಗಾರಿಕಾ ಪ್ರದೇಶಗಳ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ.";
          } else {
            response =
              "⚠️ No potential fishing zone data is currently available.";
          }
        }
      } catch {
        if (selectedLanguage === "te") {
          response =
            "⚠️ ORCA PFZ సమాచారాన్ని పొందలేకపోయింది.";
        } else if (selectedLanguage === "hi") {
          response =
            "⚠️ ORCA PFZ जानकारी प्राप्त नहीं कर सका।";
        } else if (selectedLanguage === "ta") {
          response =
            "⚠️ ORCA PFZ தகவலைப் பெற முடியவில்லை.";
        } else if (selectedLanguage === "kn") {
          response =
            "⚠️ ORCA PFZ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        } else {
          response =
            "⚠️ ORCA could not retrieve PFZ information.";
        }
      }
    }

    /*
     * WEATHER
     */
    if (intent === "WEATHER") {
      try {
        const weatherUrl =
          analysis.date === "Tomorrow"
            ? `${baseUrl}/api/weather?date=tomorrow`
            : `${baseUrl}/api/weather`;

        const weatherRes = await fetch(
          weatherUrl,
          internalFetchOptions
        );

        const weather = await weatherRes.json();

        if (!weatherRes.ok) {
          throw new Error("Weather API failed");
        }

        if (weather.forecast) {
          if (selectedLanguage === "te") {
            response =
              `🌦️ ${weather.location} రేపటి వాతావరణ అంచనా: ` +
              `ఉష్ణోగ్రత ${weather.temperatureMin}°C నుండి ${weather.temperatureMax}°C వరకు ఉంటుంది. ` +
              `గరిష్ఠ గాలి వేగం: ${weather.windSpeed} km/h. ` +
              `వర్షపాతం సంభావ్యత: ${weather.precipitationProbability}%.`;
          } else if (selectedLanguage === "hi") {
            response =
              `🌦️ ${weather.location} के लिए कल का मौसम पूर्वानुमान: ` +
              `तापमान ${weather.temperatureMin}°C से ${weather.temperatureMax}°C तक रहेगा। ` +
              `अधिकतम हवा की गति: ${weather.windSpeed} km/h. ` +
              `वर्षा की संभावना: ${weather.precipitationProbability}%.`;
          } else if (selectedLanguage === "ta") {
            response =
              `🌦️ ${weather.location} நாளைய வானிலை முன்னறிவிப்பு: ` +
              `வெப்பநிலை ${weather.temperatureMin}°C முதல் ${weather.temperatureMax}°C வரை இருக்கும். ` +
              `அதிகபட்ச காற்றின் வேகம்: ${weather.windSpeed} km/h. ` +
              `மழைக்கான வாய்ப்பு: ${weather.precipitationProbability}%.`;
          } else if (selectedLanguage === "kn") {
            response =
              `🌦️ ${weather.location} ನಾಳೆಯ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ: ` +
              `ತಾಪಮಾನ ${weather.temperatureMin}°C ರಿಂದ ${weather.temperatureMax}°C ವರೆಗೆ ಇರುತ್ತದೆ. ` +
              `ಗರಿಷ್ಠ ಗಾಳಿಯ ವೇಗ: ${weather.windSpeed} km/h. ` +
              `ಮಳೆಯ ಸಾಧ್ಯತೆ: ${weather.precipitationProbability}%.`;
          } else {
            response =
              `🌦️ Weather forecast for ${weather.location} tomorrow: ` +
              `temperature from ${weather.temperatureMin}°C to ` +
              `${weather.temperatureMax}°C. ` +
              `Maximum wind speed: ${weather.windSpeed} km/h. ` +
              `Precipitation probability: ${weather.precipitationProbability}%.`;
          }
        } else {
          if (selectedLanguage === "te") {
            response =
              `🌦️ ${weather.location} ప్రస్తుత వాతావరణం: ` +
              `${weather.temperature}°C. ` +
              `గాలి వేగం ${weather.windSpeed} km/h. ` +
              `గాలి దిశ ${weather.windDirection}°.`;
          } else if (selectedLanguage === "hi") {
            response =
              `🌦️ ${weather.location} का वर्तमान मौसम: ` +
              `${weather.temperature}°C. ` +
              `हवा की गति ${weather.windSpeed} km/h. ` +
              `हवा की दिशा ${weather.windDirection}°.`;
          } else if (selectedLanguage === "ta") {
            response =
              `🌦️ ${weather.location} தற்போதைய வானிலை: ` +
              `${weather.temperature}°C. ` +
              `காற்றின் வேகம் ${weather.windSpeed} km/h. ` +
              `காற்றின் திசை ${weather.windDirection}°.`;
          } else if (selectedLanguage === "kn") {
            response =
              `🌦️ ${weather.location} ಪ್ರಸ್ತುತ ಹವಾಮಾನ: ` +
              `${weather.temperature}°C. ` +
              `ಗಾಳಿಯ ವೇಗ ${weather.windSpeed} km/h. ` +
              `ಗಾಳಿಯ ದಿಕ್ಕು ${weather.windDirection}°.`;
          } else {
            response =
              `🌦️ Current weather for ${weather.location}: ` +
              `${weather.temperature}°C with wind speed of ` +
              `${weather.windSpeed} km/h. ` +
              `Wind direction is ${weather.windDirection}°.`;
          }
        }
      } catch {
        if (selectedLanguage === "te") {
          response =
            "⚠️ వాతావరణ డేటాను పొందడం సాధ్యం కాలేదు.";
        } else if (selectedLanguage === "hi") {
          response =
            "⚠️ मौसम डेटा प्राप्त नहीं किया जा सका।";
        } else if (selectedLanguage === "ta") {
          response =
            "⚠️ வானிலை தரவைப் பெற முடியவில்லை.";
        } else if (selectedLanguage === "kn") {
          response =
            "⚠️ ಹವಾಮಾನ ಡೇಟಾವನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        } else {
          response =
            "⚠️ Unable to retrieve weather data.";
        }
      }
    }

    /*
     * OCEAN CONDITIONS
     */
    if (intent === "OCEAN_CONDITIONS") {
      try {
        const oceanRes = await fetch(
          `${baseUrl}/api/ocean`,
          internalFetchOptions
        );

        const ocean = await oceanRes.json();

        if (!oceanRes.ok) {
          throw new Error("Ocean API failed");
        }

        if (selectedLanguage === "te") {
          response =
            `🌊 ${ocean.location} ప్రస్తుత సముద్ర పరిస్థితులు: ` +
            `అలల ఎత్తు: ${ocean.waveHeight ?? "N/A"} m, ` +
            `అలల దిశ: ${ocean.waveDirection ?? "N/A"}°, ` +
            `అలల కాలం: ${ocean.wavePeriod ?? "N/A"} s, ` +
            `సముద్ర ఉపరితల ఉష్ణోగ్రత: ${ocean.sst ?? "N/A"}°C.`;
        } else if (selectedLanguage === "hi") {
          response =
            `🌊 ${ocean.location} की वर्तमान समुद्री परिस्थितियां: ` +
            `लहरों की ऊंचाई: ${ocean.waveHeight ?? "N/A"} m, ` +
            `लहरों की दिशा: ${ocean.waveDirection ?? "N/A"}°, ` +
            `लहर अवधि: ${ocean.wavePeriod ?? "N/A"} s, ` +
            `समुद्र की सतह का तापमान: ${ocean.sst ?? "N/A"}°C.`;
        } else if (selectedLanguage === "ta") {
          response =
            `🌊 ${ocean.location} தற்போதைய கடல் நிலைமைகள்: ` +
            `அலை உயரம்: ${ocean.waveHeight ?? "N/A"} m, ` +
            `அலை திசை: ${ocean.waveDirection ?? "N/A"}°, ` +
            `அலை காலம்: ${ocean.wavePeriod ?? "N/A"} s, ` +
            `கடல் மேற்பரப்பு வெப்பநிலை: ${ocean.sst ?? "N/A"}°C.`;
        } else if (selectedLanguage === "kn") {
          response =
            `🌊 ${ocean.location} ಪ್ರಸ್ತುತ ಸಮುದ್ರ ಪರಿಸ್ಥಿತಿಗಳು: ` +
            `ಅಲೆಗಳ ಎತ್ತರ: ${ocean.waveHeight ?? "N/A"} m, ` +
            `ಅಲೆಗಳ ದಿಕ್ಕು: ${ocean.waveDirection ?? "N/A"}°, ` +
            `ಅಲೆಗಳ ಅವಧಿ: ${ocean.wavePeriod ?? "N/A"} s, ` +
            `ಸಮುದ್ರ ಮೇಲ್ಮೈ ತಾಪಮಾನ: ${ocean.sst ?? "N/A"}°C.`;
        } else {
          response =
            `🌊 Current ocean conditions for ${ocean.location}: ` +
            `Wave height: ${ocean.waveHeight ?? "N/A"} m, ` +
            `wave direction: ${ocean.waveDirection ?? "N/A"}°, ` +
            `wave period: ${ocean.wavePeriod ?? "N/A"} s, ` +
            `sea surface temperature: ${ocean.sst ?? "N/A"}°C.`;
        }
      } catch {
        if (selectedLanguage === "te") {
          response =
            "⚠️ ప్రస్తుత సముద్ర పరిస్థితులను పొందడం సాధ్యం కాలేదు.";
        } else if (selectedLanguage === "hi") {
          response =
            "⚠️ वर्तमान समुद्री परिस्थितियों का डेटा प्राप्त नहीं किया जा सका।";
        } else if (selectedLanguage === "ta") {
          response =
            "⚠️ தற்போதைய கடல் நிலைமைகளைப் பெற முடியவில்லை.";
        } else if (selectedLanguage === "kn") {
          response =
            "⚠️ ಪ್ರಸ್ತುತ ಸಮುದ್ರ ಪರಿಸ್ಥಿತಿಗಳ ಡೇಟಾವನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        } else {
          response =
            "⚠️ Unable to retrieve current ocean conditions.";
        }
      }
    }

    /*
     * TIDE
     */
    if (intent === "TIDE") {
      try {
        const tideRes = await fetch(
          `${baseUrl}/api/tide`,
          internalFetchOptions
        );

        const tide = await tideRes.json();

        if (!tideRes.ok) {
          throw new Error("Tide API failed");
        }

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

          if (selectedLanguage === "te") {
            response =
              `🌊 ${tide.location} కోసం టైడ్ పరిస్థితులు: ${tideSummary}.`;
          } else if (selectedLanguage === "hi") {
            response =
              `🌊 ${tide.location} के लिए ज्वार की स्थिति: ${tideSummary}.`;
          } else if (selectedLanguage === "ta") {
            response =
              `🌊 ${tide.location} அலை நிலை: ${tideSummary}.`;
          } else if (selectedLanguage === "kn") {
            response =
              `🌊 ${tide.location} ಅಲೆಗಳ ಸ್ಥಿತಿ: ${tideSummary}.`;
          } else {
            response =
              `🌊 Tide conditions for ${tide.location}: ${tideSummary}.`;
          }
        } else {
          if (selectedLanguage === "te") {
            response =
              "⚠️ ప్రస్తుతం టైడ్ సమాచారం అందుబాటులో లేదు.";
          } else if (selectedLanguage === "hi") {
            response =
              "⚠️ वर्तमान में ज्वार की जानकारी उपलब्ध नहीं है।";
          } else if (selectedLanguage === "ta") {
            response =
              "⚠️ தற்போது அலை தகவல் கிடைக்கவில்லை.";
          } else if (selectedLanguage === "kn") {
            response =
              "⚠️ ಪ್ರಸ್ತುತ ಅಲೆಗಳ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.";
          } else {
            response =
              "⚠️ No tide information is currently available.";
          }
        }
      } catch {
        if (selectedLanguage === "te") {
          response =
            "⚠️ ORCA టైడ్ సమాచారాన్ని పొందలేకపోయింది.";
        } else if (selectedLanguage === "hi") {
          response =
            "⚠️ ORCA ज्वार की जानकारी प्राप्त नहीं कर सका।";
        } else if (selectedLanguage === "ta") {
          response =
            "⚠️ ORCA அலை தகவலைப் பெற முடியவில்லை.";
        } else if (selectedLanguage === "kn") {
          response =
            "⚠️ ORCA ಅಲೆಗಳ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        } else {
          response =
            "⚠️ ORCA could not retrieve tide information.";
        }
      }
    }

    /*
     * ROUTE
     */
    if (intent === "ROUTE") {
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
          if (selectedLanguage === "te") {
            response =
              "⚠️ సముద్ర మార్గాన్ని లెక్కించడం సాధ్యం కాలేదు.";
          } else if (selectedLanguage === "hi") {
            response =
              "⚠️ समुद्री मार्ग की गणना नहीं की जा सकी।";
          } else if (selectedLanguage === "ta") {
            response =
              "⚠️ கடல் வழியை கணக்கிட முடியவில்லை.";
          } else if (selectedLanguage === "kn") {
            response =
              "⚠️ ಸಮುದ್ರ ಮಾರ್ಗವನ್ನು ಲೆಕ್ಕಹಾಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
          } else {
            response =
              "⚠️ Unable to calculate the marine route.";
          }
        }
      } catch {
        if (selectedLanguage === "te") {
          response =
            "⚠️ ORCA మార్గ ఆప్టిమైజేషన్ సేవకు కనెక్ట్ కాలేకపోయింది.";
        } else if (selectedLanguage === "hi") {
          response =
            "⚠️ ORCA मार्ग अनुकूलन सेवा से कनेक्ट नहीं कर सका।";
        } else if (selectedLanguage === "ta") {
          response =
            "⚠️ ORCA பாதை மேம்படுத்தல் சேவையுடன் இணைக்க முடியவில்லை.";
        } else if (selectedLanguage === "kn") {
          response =
            "⚠️ ORCA ಮಾರ್ಗ ಆಪ್ಟಿಮೈಸೇಶನ್ ಸೇವೆಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        } else {
          response =
            "⚠️ ORCA could not connect to the route optimization service.";
        }
      }
    }

    return NextResponse.json({
      response,
      intent,
      agent,
      language: selectedLanguage,
      languageName: getLanguageName(selectedLanguage),
      extracted: {
        location: analysis.location,
        time: analysis.time,
        date: analysis.date,
      },
      confidence: 0.91,
      prototype: true,
    });
  } catch (error) {
    console.error("ORCA API error:", error);

    return NextResponse.json(
      {
        error: "Unable to process ORCA request",
      },
      { status: 500 }
    );
  }
}