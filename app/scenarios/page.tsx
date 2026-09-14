"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

type PredictivePoint = {
  horizonHours: number;
  timestamp: string;
  riskScore: number;
  riskLevel: string;
  conditions: {
    windSpeed: number;
    waveHeight: number;
    precipitationProbability: number;
  };
};

type PredictiveRisk = {
  available: boolean;
  trend?: string;
  current?: PredictivePoint;
  forecast6h?: PredictivePoint;
  forecast12h?: PredictivePoint;
  forecast24h?: PredictivePoint;
  note?: string;
  message?: string;
};

type Scenario = {
  id: string;
  departureTime: string;
  date: string;
  route: string;
  riskScore: number;
  travelTime: number;
  distance: number;
  hazardExposure: string;
  recommendation: string;
  predictiveRisk?: PredictiveRisk;
};

type CurrentLocation = {
  name?: string;
  latitude: number;
  longitude: number;
};

const departureTimes = ["06:00", "10:00", "14:00"];

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ScenarioLab() {
      const router = useRouter();

  const [locationName, setLocationName] = useState("Bay of Bengal");
  const [locationCoordinates, setLocationCoordinates] = useState(
    "17.6936° N, 83.5000° E"
  );
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [vesselType, setVesselType] = useState("Fishing Vessel");
  const [route, setRoute] = useState("Balanced Route");

  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Default to tomorrow
    // Default to tomorrow + load current operating location
  useEffect(() => {
    setDate(getTomorrowDate());

    try {
      const savedLocation =
        localStorage.getItem("orca-location");

      if (savedLocation) {
        const location = JSON.parse(savedLocation);

        if (location?.name) {
          setLocationName(location.name);
        }

        if (
          typeof location?.latitude === "number" &&
          typeof location?.longitude === "number"
        ) {
          setLocationCoordinates(
            `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`
          );
        }
      }
    } catch (error) {
      console.error(
        "Unable to load operating location:",
        error
      );
    }
  }, []);

  // Load the user's current operating location
  useEffect(() => {
    try {
      const cookies = document.cookie.split(";");

      const locationCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("orca-location=")
      );

      if (!locationCookie) {
        return;
      }

      const encodedValue = locationCookie
        .trim()
        .substring("orca-location=".length);

      const parsedLocation = JSON.parse(
        decodeURIComponent(encodedValue)
      );

      if (
        typeof parsedLocation.latitude === "number" &&
        typeof parsedLocation.longitude === "number"
      ) {
        setCurrentLocation({
          name: parsedLocation.name,
          latitude: parsedLocation.latitude,
          longitude: parsedLocation.longitude,
        });
      }
    } catch (error) {
      console.error(
        "Unable to read current operating location:",
        error
      );
    }
  }, []);

  async function runScenarioAnalysis() {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    setLoading(true);
    setError("");
    setScenarios([]);

    try {
      const results: Scenario[] = [];

      for (const departureTime of departureTimes) {
        const response = await fetch("/api/scenario", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destination: destination.trim(),
            date,
            departureTime,
            vesselType,
            route,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to calculate scenario."
          );
        }

        if (!data.scenario) {
          throw new Error(
            "Scenario API returned an invalid response."
          );
        }

        results.push(data.scenario);
      }

      setScenarios(results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate scenarios."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
       {/* Header */}
<div className="mb-8">
  <div className="flex items-start justify-between gap-6">

    {/* Left side */}
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-500 hover:text-white"
      >
        <ArrowLeft size={17} />
        Back
      </button>

      <p className="text-sm font-medium text-cyan-400">
        ORCA MARINE INTELLIGENCE
      </p>

      <h1 className="mt-2 text-3xl font-bold">
        What-If Scenario Lab
      </h1>

      <p className="mt-2 text-slate-400">
        Compare departure times and route conditions
        before making a marine journey.
      </p>
    </div>

    {/* Current location */}
    <div className="mt-0 w-[280px] shrink-0 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-right shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Current Location
      </p>

      <div className="mt-2 flex items-center justify-end gap-2">
        <MapPin
          size={17}
          className="shrink-0 text-cyan-400"
        />

        <span className="truncate text-base font-semibold text-cyan-300">
          {locationName}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {locationCoordinates}
      </p>
    </div>

  </div>
</div>

        {/* Configuration */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Scenario Configuration
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {/* Destination */}
            <div>
              <label
                htmlFor="destination"
                className="text-sm text-slate-400"
              >
                Destination
              </label>

              <input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Kakinada Port"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />

              <p className="mt-1 text-xs text-slate-500">
                Enter a destination name or location.
              </p>
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="scenario-date"
                className="text-sm text-slate-400"
              >
                Date
              </label>

              <input
                id="scenario-date"
                type="date"
                value={date}
                min={getTodayDate()}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <p className="mt-1 text-xs text-slate-500">
                Select the date you want to compare.
              </p>
            </div>

            {/* Vessel */}
            <div>
              <label
                htmlFor="vessel-type"
                className="text-sm text-slate-400"
              >
                Vessel Type
              </label>

              <select
                id="vessel-type"
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              >
                <option>Fishing Vessel</option>
                <option>Small Boat</option>
                <option>Passenger Vessel</option>
                <option>Cargo Vessel</option>
                <option>Research Vessel</option>
              </select>
            </div>

            {/* Route */}
            <div>
              <label
                htmlFor="route"
                className="text-sm text-slate-400"
              >
                Route
              </label>

              <select
                id="route"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              >
                <option>Shortest Route</option>
                <option>Fastest Route</option>
                <option>Safest Route</option>
                <option>Balanced Route</option>
              </select>
            </div>
          </div>

          {/* Selected date */}
          {date && (
            <div className="mt-5 rounded-lg border border-cyan-900/50 bg-cyan-950/20 px-4 py-3">
              <p className="text-sm text-slate-400">
                Scenario date
              </p>

              <p className="mt-1 font-medium text-cyan-300">
                {new Date(`${date}T00:00:00`).toLocaleDateString(
                  "en-IN",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>
            </div>
          )}

          {/* Compare */}
          <button
            onClick={runScenarioAnalysis}
            disabled={loading}
            className="mt-6 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Analysing scenarios..."
              : "Compare Scenarios"}
          </button>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </section>

        {/* Results */}
        {scenarios.length > 0 && (
          <section className="mt-8">

            <div className="mb-5">
              <h2 className="text-2xl font-bold">
                Scenario Comparison
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Comparing predicted marine conditions for{" "}
                <span className="text-slate-200">
                  {destination}
                </span>{" "}
                on{" "}
                <span className="text-slate-200">
                  {new Date(`${date}T00:00:00`).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
                .
              </p>
            </div>

            {/* Predictive Risk */}
            {scenarios.some(
              (scenario) => scenario.predictiveRisk?.available
            ) && (
              <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-cyan-400">
                      Predictive Risk
                    </p>

                    <h3 className="mt-1 text-xl font-bold">
                      Current → Forecast → Future
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Forecast-derived risk. These values are predictions,
                      not observations.
                    </p>
                  </div>

                  <div className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300">
                    {scenarios.find(
                      (scenario) =>
                        scenario.predictiveRisk?.available
                    )?.predictiveRisk?.trend === "INCREASING"
                      ? "↑ Increasing"
                      : scenarios.find(
                          (scenario) =>
                            scenario.predictiveRisk?.available
                        )?.predictiveRisk?.trend === "DECREASING"
                      ? "↓ Decreasing"
                      : "→ Stable"}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  {[
                    ["Now", "current"],
                    ["+6h", "forecast6h"],
                    ["+12h", "forecast12h"],
                    ["+24h", "forecast24h"],
                  ].map(([label, key]) => {
                    const predictiveRisk =
                      scenarios.find(
                        (scenario) =>
                          scenario.predictiveRisk?.available
                      )?.predictiveRisk;

                    const point =
                      predictiveRisk?.[
                        key as
                          | "current"
                          | "forecast6h"
                          | "forecast12h"
                          | "forecast24h"
                      ];

                    if (!point) return null;

                    return (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">
                            {label}
                          </span>

                          <span className="rounded-full bg-cyan-950/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                            Predicted
                          </span>
                        </div>

                        <p className="mt-3 text-2xl font-bold">
                          {point.riskScore}/100
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {point.riskLevel}
                        </p>

                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>
                            Wind: {point.conditions.windSpeed} km/h
                          </p>
                          <p>
                            Waves: {point.conditions.waveHeight} m
                          </p>
                          <p>
                            Rain probability:{" "}
                            {point.conditions.precipitationProbability}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-3">
              {scenarios.map((scenario) => (
                <article
                  key={scenario.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      {scenario.departureTime}
                    </h3>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      Predicted
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Safety Score
                      </span>

                      <strong>
                        {scenario.riskScore}/100
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Travel Time
                      </span>

                      <strong>
                        {scenario.travelTime} min
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Distance
                      </span>

                      <strong>
                        {scenario.distance} km
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Hazard Exposure
                      </span>

                      <strong>
                        {scenario.hazardExposure}
                      </strong>
                    </div>

                  </div>

                  <div className="mt-6 rounded-lg bg-slate-950 p-4">
                    <p className="text-xs uppercase tracking-wide text-cyan-400">
                      Recommendation
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      {scenario.recommendation}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {scenarios.length === 0 && !loading && (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
            <h2 className="text-xl font-semibold">
              No scenarios analysed yet
            </h2>

            <p className="mt-2 text-slate-400">
              Enter a destination, choose a date, and run
              the comparison to see how departure time
              affects the journey.
            </p>
          </section>
        )}

      </div>
    </main>
  );
}