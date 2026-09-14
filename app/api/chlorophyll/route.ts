import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid latitude and longitude are required",
        },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coordinates",
        },
        { status: 400 }
      );
    }

    /*
     * PROTOTYPE DATASET
     * NOAA CoastWatch VIIRS Chlorophyll OCI
     *
     * Dataset period:
     * 2018-08-09 → 2021-09-02
     *
     * We query a small time range instead of downloading
     * the entire dataset.
     */

    const noaaUrl =
      "https://coastwatch.noaa.gov/erddap/griddap/" +
      "noaacwNPPN20VIIRSchlociDaily.json" +
      `?chl_oci[(2021-01-01T12:00:00Z):1:` +
      `(2021-09-02T12:00:00Z)]` +
      `[(0)][(${lat})][(${lon})]`;

    const response = await fetch(noaaUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "NOAA chlorophyll request failed:",
        response.status,
        errorText.slice(0, 500)
      );

      throw new Error(
        `NOAA chlorophyll request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const rows = data?.table?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: true,
        status: "UNAVAILABLE",
        location: {
          latitude: lat,
          longitude: lon,
        },
        chlorophyll: null,
        timestamp: null,
        source:
          "NOAA CoastWatch VIIRS Chlorophyll OCI",
        prototype: true,
      });
    }

    /*
     * Find the latest valid chlorophyll observation.
     *
     * NOAA may return null for land, clouds,
     * invalid retrievals, etc.
     */
    const validRows = rows
      .filter(
        (row: unknown[]) =>
          Array.isArray(row) &&
          row.length >= 5 &&
          row[4] !== null &&
          Number.isFinite(Number(row[4]))
      )
      .sort(
        (a: unknown[], b: unknown[]) =>
          new Date(String(b[0])).getTime() -
          new Date(String(a[0])).getTime()
      );

    const latest = validRows[0];

    if (!latest) {
      return NextResponse.json({
        success: true,
        status: "UNAVAILABLE",

        location: {
          latitude: lat,
          longitude: lon,
        },

        chlorophyll: null,

        timestamp: null,

        source:
          "NOAA CoastWatch VIIRS Chlorophyll OCI",

        prototype: true,

        message:
          "No valid chlorophyll observation was available for this location in the selected prototype period.",
      });
    }

    return NextResponse.json({
      success: true,

      status: "AVAILABLE",

      location: {
        latitude: lat,
        longitude: lon,
      },

      gridPoint: {
        latitude: Number(latest[2]),
        longitude: Number(latest[3]),
      },

      chlorophyll: Number(latest[4]),

      unit: "mg m^-3",

      timestamp: latest[0],

      source:
        "NOAA CoastWatch VIIRS Chlorophyll OCI",

      dataset:
        "NOAA S-NPP NOAA-20 VIIRS Global 4km Daily",

      prototype: true,

      dataPeriod: "2018-08-09 to 2021-09-02",
    });
  } catch (error) {
    console.error("Chlorophyll API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch chlorophyll data",
      },
      { status: 500 }
    );
  }
}