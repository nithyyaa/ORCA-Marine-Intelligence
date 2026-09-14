"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Home, Bot, Map, Bell, Fish, Waves, CloudSun, Navigation,
  ShieldCheck, Route, FileText, Settings, MapPin, ChevronDown,
  Ship, Clock3, Fuel, Wind, ArrowRight, LocateFixed, AlertTriangle,
  Compass, Anchor,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Ask ORCA", href: "/ask-orca", icon: Bot },
  { label: "Map Explorer", href: "/map-explorer", icon: Map },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Fisheries", href: "/fisheries", icon: Fish },
  { label: "Ocean Conditions", href: "/ocean-conditions", icon: Waves },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Tides", href: "/tides", icon: Navigation },
  { label: "Advisories", href: "/advisories", icon: ShieldCheck },
  { label: "Routes & Planning", href: "/routes", icon: Route, active: true },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

type Location = {
  name: string;
  latitude: number;
  longitude: number;
};

type RouteOption = {
  id: string;
  name:
    | "Shortest Route"
    | "Fastest Route"
    | "Safest Route"
    | "Balanced Route";
  tag: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  fuelLitres: number;
  safetyScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  hazardExposure: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  hazards: string[];
  recommendation: string;
  geofence: {
    available: boolean;
    checks: unknown[];
    violationCount: number;
    approachingCount: number;
    status: string | null;
  };
};

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
            <Compass size={21} className="text-violet-400" />
          </div>

          <div>
            <div className="text-xl font-semibold tracking-wide">ORCA</div>
            <div className="mt-1 text-[11px] leading-4 text-slate-500">
              Marine Ecosystem
              <br />
              Reasoning with
              <br />
              Collaborative Agents
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                item.active
                  ? "border-l-2 border-violet-400 bg-violet-400/10 text-violet-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  item.active
                    ? "text-violet-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20">
            👤
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">
              Fisherman User
            </p>
            <p className="text-xs text-slate-500">
              Operating location
            </p>
          </div>

          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

function getCookieLocation(): Location | null {
  try {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith("orca-location="));

    if (!raw) return null;

    const value = JSON.parse(
      decodeURIComponent(
        raw.slice("orca-location=".length)
      )
    );

    if (
      !Number.isFinite(Number(value.latitude)) ||
      !Number.isFinite(Number(value.longitude))
    ) {
      return null;
    }

    return {
      name: value.name || "Operating location",
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
    };
  } catch {
    return null;
  }
}

function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${Math.round(
    minutes % 60
  )}m`;
}

export default function RoutesPage() {
  const [location, setLocation] =
    useState<Location | null>(null);

  const [destination, setDestination] =
    useState("");

  const [destinationLocation, setDestinationLocation] =
    useState<Location | null>(null);

  const [routeOptions, setRouteOptions] =
    useState<RouteOption[]>([]);

  const [selectedRoute, setSelectedRoute] =
    useState("");

  const [recommendedRouteId, setRecommendedRouteId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [conditions, setConditions] = useState<{
    wind: number | null;
    wave: number | null;
    source?: string;
  }>({
    wind: null,
    wave: null,
  });

  useEffect(() => {
    setLocation(getCookieLocation());
  }, []);

  const selected = useMemo(
    () =>
      routeOptions.find(
        (r) => r.id === selectedRoute
      ) ?? routeOptions[0],
    [routeOptions, selectedRoute]
  );

  async function calculateRoute() {
    if (!location) {
      setError(
        "Set an operating location in Settings first."
      );
      return;
    }

    if (!destination.trim()) {
      setError("Enter a destination.");
      return;
    }

    setLoading(true);
    setError("");
    setRouteOptions([]);
    setDestinationLocation(null);
    setRecommendedRouteId(null);

    try {
      /*
       * The backend is now the single source of truth
       * for route calculation.
       *
       * It handles:
       * - destination geocoding
       * - marine conditions
       * - route candidates
       * - safety score
       * - hazard exposure
       * - geofence checks
       * - geofence penalties
       * - recommended route
       */
      const response = await fetch("/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: destination.trim(),
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to calculate route."
        );
      }

      if (!Array.isArray(data?.routes)) {
        throw new Error(
          "Route service returned no route options."
        );
      }

      const mappedRoutes: RouteOption[] =
        data.routes.map((route: any) => ({
          id: String(route.id),
          name: route.name,
          tag: route.tag,
          distanceKm: Number(route.distanceKm),
          estimatedTimeMinutes: Number(
            route.estimatedTimeMinutes
          ),
          fuelLitres: Number(route.fuelLitres),
          safetyScore: Number(route.safetyScore),
          riskLevel: route.riskLevel,
          hazardExposure: route.hazardExposure,
          hazards: Array.isArray(route.hazards)
            ? route.hazards
            : [],
          recommendation:
            route.recommendation ||
            "",
          geofence: {
            available:
              Boolean(route.geofence?.available),
            checks:
              Array.isArray(route.geofence?.checks)
                ? route.geofence.checks
                : [],
            violationCount: Number(
              route.geofence?.violationCount ?? 0
            ),
            approachingCount: Number(
              route.geofence?.approachingCount ?? 0
            ),
            status:
              route.geofence?.status ?? null,
          },
        }));

      setRouteOptions(mappedRoutes);

      setRecommendedRouteId(
        data?.recommendedRouteId ?? null
      );

      if (data?.destination) {
        setDestinationLocation({
          name:
            data.destination.name ||
            destination.trim(),
          latitude: Number(
            data.destination.latitude
          ),
          longitude: Number(
            data.destination.longitude
          ),
        });
      }

      const wind = Number.isFinite(
        Number(data?.conditions?.windSpeed)
      )
        ? Number(data.conditions.windSpeed)
        : null;

      const wave = Number.isFinite(
        Number(data?.conditions?.waveHeight)
      )
        ? Number(data.conditions.waveHeight)
        : null;

      setConditions({
        wind,
        wave,
        source:
          [
            data?.source?.weather,
            data?.source?.marine,
          ]
            .filter(Boolean)
            .join(" + ") ||
          "Marine APIs",
      });

      /*
       * Select the backend's recommended route,
       * not a hardcoded "Safest Route".
       */
      if (data?.recommendedRouteId) {
        setSelectedRoute(
          String(data.recommendedRouteId)
        );
      } else if (mappedRoutes.length > 0) {
        setSelectedRoute(mappedRoutes[0].id);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to calculate route"
      );
    } finally {
      setLoading(false);
    }
  }

  const mapPath =
    selected &&
    location &&
    destinationLocation
      ? (() => {
          const x2 = 86;
          const y2 = 20;

          return `M 15 78 C 35 70, 45 48, 58 55 S 73 38, ${x2} ${y2}`;
        })()
      : "";

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

      <main className="ml-[272px] min-h-screen">
        <header className="flex h-20 items-center justify-between border-b border-white/10 px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400">
              Navigation
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Routes & Planning
            </h1>
          </div>

          <div className="flex max-w-[430px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin
              size={15}
              className="shrink-0 text-violet-400"
            />

            <span className="truncate">
              {location?.name ||
                "Operating location not set"}
            </span>
          </div>
        </header>

        <section className="mx-auto max-w-[1350px] px-8 py-8">
          <div className="mb-7">
            <h2 className="text-3xl font-semibold">
              Plan your marine journey
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Compare route options using destination
              coordinates and current marine conditions.
              This is a prototype route-planning engine,
              not certified navigation.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-[#091827] lg:grid-cols-[350px_1fr]">
            <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
                  <Route
                    size={19}
                    className="text-violet-400"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-600">
                    Trip planner
                  </p>

                  <h3 className="font-semibold">
                    Journey details
                  </h3>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label className="text-xs text-slate-500">
                    From
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071525] px-4 py-3">
                    <LocateFixed
                      size={17}
                      className="text-violet-400"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {location?.name ||
                          "Not set"}
                      </p>

                      <p className="text-[11px] text-slate-600">
                        Operating location
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    To
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071525] px-4 py-3">
                    <MapPin
                      size={17}
                      className="text-violet-400"
                    />

                    <input
                      value={destination}
                      onChange={(e) =>
                        setDestination(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        calculateRoute()
                      }
                      placeholder="Enter destination"
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Vessel
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071525] px-4 py-3">
                    <Ship
                      size={17}
                      className="text-violet-400"
                    />

                    <span className="text-sm">
                      Fishing vessel
                    </span>

                    <ChevronDown
                      size={15}
                      className="ml-auto text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Departure
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071525] px-4 py-3">
                    <Clock3
                      size={17}
                      className="text-violet-400"
                    />

                    <span className="text-sm">
                      Now
                    </span>
                  </div>
                </div>

                <button
                  onClick={calculateRoute}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-3.5 text-sm font-medium transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Navigation size={17} />

                  {loading
                    ? "Calculating..."
                    : "Calculate route"}
                </button>

                {error && (
                  <p className="text-xs leading-5 text-red-400">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden bg-[#06131f]">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute left-0 top-[18%] h-px w-full rotate-6 bg-violet-400/20" />
                <div className="absolute left-0 top-[38%] h-px w-full -rotate-6 bg-violet-400/10" />
                <div className="absolute left-0 top-[63%] h-px w-full rotate-3 bg-violet-400/15" />
              </div>

              {selected && (
                <>
                  <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/10">
                    <div className="absolute inset-[20%] rounded-full border border-violet-400/10" />
                    <div className="absolute inset-[40%] rounded-full border border-violet-400/10" />
                  </div>

                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                  >
                    <path
                      d={mapPath}
                      fill="none"
                      stroke="rgba(167,139,250,0.9)"
                      strokeWidth="0.7"
                      strokeDasharray="2 2"
                    />
                  </svg>

                  <div className="absolute bottom-[22%] left-[12%]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-violet-300/20 bg-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                      <LocateFixed size={19} />
                    </div>

                    <div className="mt-2 max-w-[180px] rounded-lg border border-white/10 bg-[#071525]/90 px-3 py-2">
                      <p className="text-[10px] text-slate-600">
                        START
                      </p>

                      <p className="truncate text-xs font-medium">
                        {location?.name}
                      </p>
                    </div>
                  </div>

                  <div className="absolute right-[10%] top-[12%]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-violet-300/20 bg-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                      <Anchor size={19} />
                    </div>

                    <div className="mt-2 max-w-[200px] rounded-lg border border-white/10 bg-[#071525]/90 px-3 py-2">
                      <p className="text-[10px] text-slate-600">
                        DESTINATION
                      </p>

                      <p className="truncate text-xs font-medium">
                        {destinationLocation?.name}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {!selected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-2xl border border-white/10 bg-[#071525]/90 px-6 py-5 text-center">
                    <Compass
                      className="mx-auto text-violet-400"
                      size={28}
                    />

                    <p className="mt-3 text-sm font-medium">
                      Enter a destination to
                      calculate a route
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      The map will update after
                      destination lookup.
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute left-6 top-6 rounded-xl border border-white/10 bg-[#071525]/90 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Compass
                    size={15}
                    className="text-violet-400"
                  />

                  <span className="text-xs font-medium">
                    Marine route planner
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-slate-500">
                  {selected
                    ? "Route generated from current inputs"
                    : "Awaiting destination"}
                </p>
              </div>

              <div className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#071525]/90">
                <span className="text-xs font-semibold text-violet-300">
                  N
                </span>
              </div>

              {selected && (
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
                  <div className="rounded-xl border border-white/10 bg-[#071525]/95 px-4 py-3">
                    <p className="text-[10px] text-slate-500">
                      Distance
                    </p>

                    <p className="mt-1 text-xs">
                      {selected.distanceKm.toFixed(
                        1
                      )}{" "}
                      km
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#071525]/95 px-4 py-3">
                    <p className="text-[10px] text-slate-500">
                      Estimated time
                    </p>

                    <p className="mt-1 text-xs">
                      {formatDuration(
                        selected.estimatedTimeMinutes
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#071525]/95 px-4 py-3">
                    <p className="text-[10px] text-slate-500">
                      Risk
                    </p>

                    <p className="mt-1 text-xs">
                      {selected.safetyScore}/100 ·{" "}
                      {selected.riskLevel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#071525]/95 px-4 py-3">
                    <p className="text-[10px] text-slate-500">
                      Geofence
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        selected.geofence.status ===
                        "VIOLATION"
                          ? "text-red-400"
                          : selected.geofence
                                .status ===
                            "APPROACHING"
                          ? "text-amber-400"
                          : "text-green-400"
                      }`}
                    >
                      {selected.geofence.status ||
                        "Unavailable"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-9">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-violet-400">
                  Route analysis
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  Compare available routes
                </h3>
              </div>

              <p className="text-xs text-slate-600">
                {routeOptions.length
                  ? `${routeOptions.length} options found`
                  : "No route calculated"}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {routeOptions.map((route) => {
                const isRecommended =
                  route.id ===
                  recommendedRouteId;

                const isSelected =
                  route.id === selectedRoute;

                return (
                  <div
                    key={route.id}
                    className={`rounded-2xl border p-5 ${
                      isSelected
                        ? "border-violet-400/30 bg-violet-400/[0.045]"
                        : "border-white/10 bg-[#091827]"
                    }`}
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                      <div className="flex min-w-[250px] items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
                          <ShieldCheck
                            size={19}
                            className="text-violet-400"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {route.name}
                            </h4>

                            {isRecommended && (
                              <span className="rounded-full bg-green-400/10 px-2 py-1 text-[10px] text-green-400">
                                Recommended
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-600">
                            {route.tag}
                          </p>
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Distance
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {route.distanceKm.toFixed(
                              1
                            )}{" "}
                            km
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Travel time
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatDuration(
                              route.estimatedTimeMinutes
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Fuel estimate
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {route.fuelLitres.toFixed(
                              1
                            )}{" "}
                            L
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Safety
                          </p>

                          <p
                            className={`mt-1 text-sm font-medium ${
                              route.riskLevel ===
                              "LOW"
                                ? "text-green-400"
                                : route.riskLevel ===
                                  "MODERATE"
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {route.riskLevel ===
                            "LOW"
                              ? "High"
                              : route.riskLevel ===
                                "MODERATE"
                              ? "Moderate"
                              : "Low"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedRoute(
                            route.id
                          )
                        }
                        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm ${
                          isSelected
                            ? "bg-violet-500 text-white hover:bg-violet-400"
                            : "border border-white/10 text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        Select
                        <ArrowRight size={15} />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 border-t border-white/5 pt-3 text-xs text-slate-500">
                      <span>
                        Risk score:{" "}
                        {route.safetyScore}/100
                      </span>

                      <span>
                        Hazard exposure:{" "}
                        {route.hazardExposure}
                      </span>

                      <span
                        className={
                          route.geofence
                            .status ===
                          "VIOLATION"
                            ? "text-red-400"
                            : route.geofence
                                .status ===
                              "APPROACHING"
                            ? "text-amber-400"
                            : ""
                        }
                      >
                        Geofence:{" "}
                        {route.geofence.status ||
                          "Unavailable"}
                      </span>

                      {route.geofence
                        .violationCount >
                        0 && (
                        <span className="text-red-400">
                          {
                            route.geofence
                              .violationCount
                          } violation
                          {route.geofence
                            .violationCount >
                          1
                            ? "s"
                            : ""}
                        </span>
                      )}

                      {route.geofence
                        .approachingCount >
                        0 && (
                        <span className="text-amber-400">
                          {
                            route.geofence
                              .approachingCount
                          } boundary approach
                          {route.geofence
                            .approachingCount >
                          1
                            ? "es"
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-[#091827] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
                  <Waves
                    size={19}
                    className="text-violet-400"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-600">
                    Live inputs
                  </p>

                  <h3 className="font-semibold">
                    Conditions considered
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                  <Waves
                    size={17}
                    className="text-cyan-400"
                  />

                  <p className="mt-4 text-xs text-slate-600">
                    Wave height
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {conditions.wave ==
                    null
                      ? "Unavailable"
                      : `${conditions.wave.toFixed(
                          1
                        )} m`}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                  <Wind
                    size={17}
                    className="text-violet-400"
                  />

                  <p className="mt-4 text-xs text-slate-600">
                    Wind
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {conditions.wind ==
                    null
                      ? "Unavailable"
                      : `${conditions.wind.toFixed(
                          1
                        )} km/h`}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                  <Navigation
                    size={17}
                    className="text-blue-400"
                  />

                  <p className="mt-4 text-xs text-slate-600">
                    Data source
                  </p>

                  <p className="mt-1 truncate text-sm font-medium">
                    {conditions.source ||
                      "Awaiting calculation"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                <AlertTriangle
                  size={19}
                  className="text-amber-400"
                />
              </div>

              <p className="mt-5 text-xs uppercase tracking-widest text-amber-400">
                Safety note
              </p>

              <h3 className="mt-2 font-semibold">
                Prototype planning only
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Route results are estimates based on
                available inputs. Recheck official
                marine conditions and navigation
                information before departure.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-violet-400/10 bg-violet-400/[0.025] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10">
                <Compass
                  size={19}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-violet-400">
                  ORCA recommendation
                </p>

                <h3 className="mt-2 font-semibold">
                  {selected
                    ? `Prioritize the ${selected.name.toLowerCase()}`
                    : "Calculate a route first"}
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {selected
                    ? selected.recommendation ||
                      `Selected option: ${selected.distanceKm.toFixed(
                        1
                      )} km, ${formatDuration(
                        selected.estimatedTimeMinutes
                      )}, risk score ${
                        selected.safetyScore
                      }/100. Marine conditions and geofence information are incorporated into the prototype comparison.`
                    : "Enter a destination to generate route options from your configured operating location."}
                </p>

                {selected &&
                  selected.geofence
                    .status ===
                    "APPROACHING" && (
                    <p className="mt-3 text-xs text-amber-400">
                      ⚠ This route approaches a
                      geofence boundary. The route
                      score includes the geofence
                      penalty.
                    </p>
                  )}

                {selected &&
                  selected.geofence
                    .status ===
                    "VIOLATION" && (
                    <p className="mt-3 text-xs text-red-400">
                      ⚠ This route intersects a
                      restricted geofence and has
                      been heavily penalized.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}