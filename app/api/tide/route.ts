import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    live: false,
    source: "Prototype tide dataset",
    location: "Visakhapatnam, India",

    tides: [
      {
        type: "High Tide",
        time: "05:42 AM",
        height: 1.82,
      },
      {
        type: "Low Tide",
        time: "11:38 AM",
        height: 0.48,
      },
      {
        type: "High Tide",
        time: "06:14 PM",
        height: 1.67,
      },
      {
        type: "Low Tide",
        time: "11:58 PM",
        height: 0.55,
      },
    ],
  });
}