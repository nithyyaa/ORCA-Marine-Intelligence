import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    live: false,
    source: "Prototype PFZ dataset",
    location: "Visakhapatnam, India",

    zones: [
      {
        id: "PFZ-01",
        latitude: 17.82,
        longitude: 83.38,
        suitability: "HIGH",
        confidence: 0.88,
        distanceFromCoast: 18,
        estimatedCatchPotential: "High",
        factors: {
          seaSurfaceTemperature: 28.7,
          chlorophyll: 1.42,
          oceanCondition: "Favourable",
        },
      },
      {
        id: "PFZ-02",
        latitude: 17.55,
        longitude: 83.55,
        suitability: "MODERATE",
        confidence: 0.74,
        distanceFromCoast: 32,
        estimatedCatchPotential: "Moderate",
        factors: {
          seaSurfaceTemperature: 29.1,
          chlorophyll: 0.96,
          oceanCondition: "Favourable",
        },
      },
      {
        id: "PFZ-03",
        latitude: 17.94,
        longitude: 83.62,
        suitability: "LOW",
        confidence: 0.51,
        distanceFromCoast: 41,
        estimatedCatchPotential: "Low",
        factors: {
          seaSurfaceTemperature: 29.6,
          chlorophyll: 0.48,
          oceanCondition: "Less favourable",
        },
      },
    ],
  });
}