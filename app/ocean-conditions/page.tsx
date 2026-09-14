"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  Bot,
  Map,
  Bell,
  Fish,
  Waves,
  CloudSun,
  Navigation,
  ShieldCheck,
  Route,
  FileText,
  Settings,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge,
  ChevronDown,
  Activity,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Ask ORCA", href: "/ask-orca", icon: Bot },
  { label: "Map Explorer", href: "/map-explorer", icon: Map },
  { label: "Alerts", href: "/alerts", icon: Bell, badge: 3 },
  { label: "Fisheries", href: "/fisheries", icon: Fish },
  {
    label: "Ocean Conditions",
    href: "/ocean-conditions",
    icon: Waves,
    active: true,
  },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Tides", href: "/tides", icon: Navigation },
  { label: "Advisories", href: "/advisories", icon: ShieldCheck },
  { label: "Routes & Planning", href: "/routes", icon: Route },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

function Sidebar({ locationName }: { locationName: string }) {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <Waves size={21} className="text-cyan-400" />
          </div>

          <div>
            <div className="text-xl font-semibold tracking-wide">
              ORCA
            </div>

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
                  ? "border-l-2 border-cyan-400 bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  item.active
                    ? "text-cyan-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }
              />

              <span>{item.label}</span>

              {item.badge && (
                <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
          <div className="flex-1 rounded-full px-3 py-2 text-center text-slate-500">
            Light
          </div>

          <div className="flex-1 rounded-full bg-blue-500 px-3 py-2 text-center font-medium text-white">
            Dark
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20">
            👤
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">
              Fisherman User
            </p>

            <p className="text-xs text-slate-500">
              {locationName}
            </p>
          </div>

          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

function ConditionCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: any;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-5 transition hover:border-cyan-400/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
        <Icon size={21} className="text-cyan-400" />
      </div>

      <p className="mt-6 text-sm text-slate-400">{label}</p>

      <p className="mt-1 text-3xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function OceanConditionsPage() {
  const [oceanData, setOceanData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forecastRows, setForecastRows] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [tideData, setTideData] = useState<any>(null);
  const [tideLoading, setTideLoading] = useState(true);
  const [locationVersion, setLocationVersion] = useState(0);

  useEffect(() => {
    const handleLocationChange = () => setLocationVersion((v) => v + 1);
    window.addEventListener("orca-location-changed", handleLocationChange);
    return () => window.removeEventListener("orca-location-changed", handleLocationChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const [oceanResponse, weatherResponse] = await Promise.all([
          fetch("/api/ocean", { cache: "no-store" }),
          fetch("/api/weather", { cache: "no-store" }),
        ]);

        const ocean = await oceanResponse.json();
        const weather = await weatherResponse.json();

        if (cancelled) return;
        if (oceanResponse.ok) setOceanData(ocean);
        if (weatherResponse.ok) setWeatherData(weather);
      } catch (error) {
        console.error("Failed to fetch marine data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [locationVersion]);

  useEffect(() => {
    let cancelled = false;

    async function fetchTide() {
      try {
        setTideLoading(true);
        const response = await fetch("/api/tide", { cache: "no-store" });
        const data = await response.json();

        if (!cancelled) {
          setTideData(response.ok ? data : null);
        }
      } catch (error) {
        console.error("Ocean tide error:", error);
        if (!cancelled) setTideData(null);
      } finally {
        if (!cancelled) setTideLoading(false);
      }
    }

    fetchTide();
    return () => { cancelled = true; };
  }, [locationVersion]);

  useEffect(() => {
    let cancelled = false;

    async function fetchForecast() {
      try {
        setForecastLoading(true);
        const stored = localStorage.getItem("orca-location");
        let latitude: number | null = null;
        let longitude: number | null = null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude)) {
              latitude = parsed.latitude;
              longitude = parsed.longitude;
            }
          } catch {
            // Ignore invalid stored location and let the API report unavailable data.
          }
        }

        if (latitude === null || longitude === null) {
          setForecastRows([]);
          return;
        }

        const response = await fetch(
          `/api/map-forecast?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&hours=24`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (!cancelled) {
          setForecastRows(Array.isArray(data?.hourly) ? data.hourly.slice(0, 8) : []);
        }
      } catch (error) {
        console.error("Ocean forecast comparison error:", error);
        if (!cancelled) setForecastRows([]);
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    }

    fetchForecast();
    return () => { cancelled = true; };
  }, [locationVersion]);

  const locationName = oceanData?.location || weatherData?.location || "Operating location";
  const sst = oceanData?.sst;
  const waveHeight = oceanData?.waveHeight;
  const windSpeed = weatherData?.windSpeed;
  const windDirection = weatherData?.windDirection;
  const waveDirection = oceanData?.waveDirection;
  const wavePeriod = oceanData?.wavePeriod;
  const oceanCurrentVelocity = oceanData?.oceanCurrentVelocity;
  const oceanCurrentDirection = oceanData?.oceanCurrentDirection;

  const seaState =
    typeof waveHeight === "number"
      ? waveHeight < 1
        ? "Calm"
        : waveHeight < 1.5
          ? "Slight"
          : waveHeight < 2.5
            ? "Moderate"
            : "Rough"
      : "Unavailable";

  const display = (value: unknown, suffix = "") =>
    value === null || value === undefined ? "Unavailable" : `${value}${suffix}`;

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar locationName={locationName} />

      <main className="ml-[272px] min-h-screen">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#06111f]/90 px-8 backdrop-blur-xl">
          <div>
            <p className="text-sm text-cyan-400">
              Ocean Intelligence
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Ocean Conditions
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-cyan-400" />
            {locationName}
          </div>
        </header>

        <section className="mx-auto max-w-[1250px] px-8 py-8">
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-cyan-400">
              <Waves size={17} />
              Marine Environment
            </div>

            <h2 className="text-3xl font-semibold tracking-tight">
              Current Ocean Conditions
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Monitor key oceanographic parameters around{" "}
              {locationName} to understand the
              current marine environment.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ConditionCard
              icon={Thermometer}
              label="Sea Surface Temperature"
              value={`${display(sst, "°C")}`}
              description="Current surface temperature"
            />

            <ConditionCard
              icon={Droplets}
              label="Chlorophyll"
              value="Unavailable"
              description="Current biological productivity"
            />

            <ConditionCard
              icon={Wind}
              label="Wind Speed"
              value={`${display(windSpeed, " km/h")}`}
              description="Current wind conditions"
            />

            <ConditionCard
              icon={Waves}
              label="Wave Height"
              value={`${display(waveHeight, " m")}`}
              description={`${seaState} sea state`}
            />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Ocean Environment
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Current conditions around your operating area
                  </p>
                </div>

                <div className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-400">
                  {loading ? "Loading" : "Live conditions"}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-center gap-3">
                    <Gauge size={18} className="text-cyan-400" />

                    <span className="text-sm text-slate-400">
                      Sea State
                    </span>
                  </div>

                  <p className="mt-4 text-xl font-semibold">
                    {seaState}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {seaState === "Rough" ? "Elevated wave conditions require caution" : seaState === "Unavailable" ? "Marine sea-state data unavailable" : "Current wave conditions"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-center gap-3">
                    <Wind size={18} className="text-cyan-400" />

                    <span className="text-sm text-slate-400">
                      Wind Direction
                    </span>
                  </div>

                  <p className="mt-4 text-xl font-semibold">
                    {display(windDirection)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {display(windSpeed, " km/h")} average speed
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-center gap-3">
                    <Eye size={18} className="text-cyan-400" />

                    <span className="text-sm text-slate-400">
                      Visibility
                    </span>
                  </div>

                  <p className="mt-4 text-xl font-semibold">
                    Unavailable
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Visibility data not provided by the current API
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-center gap-3">
                    <Activity size={18} className="text-cyan-400" />

                    <span className="text-sm text-slate-400">
                      Ocean Current
                    </span>
                  </div>

                  <p className="mt-4 text-xl font-semibold">
                    {display(oceanCurrentVelocity, " km/h")}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Direction: {display(oceanCurrentDirection, "°")} · Wave period: {display(wavePeriod, " s")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
                <Waves size={21} className="text-cyan-400" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                ORCA Assessment
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Current ocean conditions are assessed as{" "}
                <span className="font-medium text-cyan-300">
                  {seaState.toLowerCase()}
                </span>
                . Current marine parameters are being monitored from the selected
                operating location. Users should continue monitoring
                changes in waves and wind.
              </p>

              <div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                <p className="text-xs text-slate-500">
                  Overall condition
                </p>

                <p className="mt-1 text-lg font-semibold text-cyan-300">
                  {seaState}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">24-Hour Weather & Ocean Forecast</h3>
                <p className="mt-1 text-sm text-slate-500">Hourly comparison of wind, rain probability and wave conditions for the selected operating location.</p>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300">
                {forecastLoading ? "Loading forecast" : forecastRows.length ? "Live forecast" : "Forecast unavailable"}
              </span>
            </div>

            {forecastRows.length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-medium">Time</th>
                      <th className="px-3 py-3 font-medium">Wind</th>
                      <th className="px-3 py-3 font-medium">Rain</th>
                      <th className="px-3 py-3 font-medium">Wave</th>
                      <th className="px-3 py-3 font-medium">Sea State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastRows.map((row, index) => (
                      <tr key={`${row.time ?? "forecast"}-${index}`} className="border-b border-white/5">
                        <td className="px-3 py-3 text-slate-300">
                          {row.time ? new Date(row.time).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "Unavailable"}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {row.windSpeed == null ? "Unavailable" : `${row.windSpeed} km/h`}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {row.precipitationProbability == null ? "Unavailable" : `${row.precipitationProbability}%`}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {row.waveHeight == null ? "Unavailable" : `${row.waveHeight} m`}
                        </td>
                        <td className="px-3 py-3 text-cyan-300">
                          {typeof row.waveHeight === "number"
                            ? row.waveHeight < 1 ? "Calm" : row.waveHeight < 1.5 ? "Slight" : row.waveHeight < 2.5 ? "Moderate" : "Rough"
                            : "Unavailable"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">
                No hourly forecast is currently available for this operating location. ORCA will not substitute estimated values.
              </p>
            )}

            <p className="mt-4 text-[11px] text-slate-600">Source: Open-Meteo weather + marine forecast · Forecast values are predictions, not current observations.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Navigation size={20} className="text-cyan-400" />
                <div>
                  <h3 className="text-lg font-semibold">Tide Information</h3>
                  <p className="mt-1 text-sm text-slate-500">Upcoming high and low tides for the selected operating location.</p>
                </div>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300">
                {tideLoading ? "Loading tides" : tideData?.tides?.length ? "Live tide forecast" : "Tide unavailable"}
              </span>
            </div>

            {Array.isArray(tideData?.tides) && tideData.tides.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tideData.tides.slice(0, 6).map((tide: any, index: number) => (
                  <div key={`${tide.type ?? "tide"}-${tide.time ?? "unavailable"}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500">{tide.type ?? "Tide"}</p>
                    <p className="mt-2 text-lg font-semibold text-cyan-300">{tide.time ?? "Unavailable"}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Height: {tide.height == null ? "Unavailable" : `${tide.height} m`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">
                No tide prediction is currently available for this operating location. ORCA will not substitute estimated tide values.
              </p>
            )}

            <p className="mt-4 text-[11px] text-slate-600">Source: Open-Meteo Marine API · Tide values are model-derived forecast predictions.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#091827]/80 p-6">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-cyan-400" />

              <div>
                <h3 className="font-semibold">
                  Ocean Condition Summary
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Key indicators used by ORCA
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-slate-500">
                  Thermal Conditions
                </p>

                <p className="mt-2 font-medium text-cyan-300">
                  Based on current SST data
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-slate-500">
                  Biological Productivity
                </p>

                <p className="mt-2 font-medium text-cyan-300">
                  Unavailable
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-slate-500">
                  Marine Conditions
                </p>

                <p className="mt-2 font-medium text-cyan-300">
                  {seaState}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}