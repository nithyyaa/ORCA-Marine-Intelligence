import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { start, destination } = await request.json();

    if (!start || !destination) {
      return NextResponse.json(
        {
          error: "Start and destination are required",
        },
        { status: 400 }
      );
    }

    const route = {
      start,
      destination,
      distanceKm: 42.6,
      estimatedTimeMinutes: 128,
      riskLevel: "MODERATE",
      hazards: [
        "Moderate wave conditions",
        "Strong wind in some areas",
      ],
      recommendation:
        "Proceed with caution and avoid areas with elevated wave activity.",
    };

    return NextResponse.json({
      live: false,
      source: "Prototype Route Optimization Engine",
      location: "Visakhapatnam, India",
      route,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to calculate route",
      },
      { status: 500 }
    );
  }
}