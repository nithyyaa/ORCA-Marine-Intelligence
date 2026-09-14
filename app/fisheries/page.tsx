"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { marineData } from "@/lib/marine-data";
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
  Leaf,
  CircleCheck,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Ask ORCA", href: "/ask-orca", icon: Bot },
  { label: "Map Explorer", href: "/map-explorer", icon: Map },
  { label: "Alerts", href: "/alerts", icon: Bell, badge: 3 },
  { label: "Fisheries", href: "/fisheries", icon: Fish, active: true },
  { label: "Ocean Conditions", href: "/ocean-conditions", icon: Waves },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Tides", href: "/tides", icon: Navigation },
  { label: "Advisories", href: "/advisories", icon: ShieldCheck },
  { label: "Routes & Planning", href: "/routes", icon: Route },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

type PFZZone = {
  zone_id: string;
  latitude: number;
  longitude: number;
  sector?: string | null;
  year?: number | null;
  julian_day?: string | null;
  length_km?: number | null;
  source?: string | null;
  distance_km?: string | number;
};

type FishingZone = {
  rank: number;
  id: string;
  intelligence?: {
    unavailable?: boolean;
    reason?: string;
    safetyScore?: number;
    safetyRisk?: string;
    safetyConfidence?: number;
    suitabilityScore?: number;
    suitability?: "Favorable" | "Moderate" | "Caution";
    conditions?: {
      windSpeed: number | null;
      waveHeight: number | null;
      rainfall: number | null;
      seaState: string | null;
      sst: number | null;
    };
  };
  name: string;
  distance: string;
  direction: string;
  suitability: "High" | "Moderate";
  sst: string;
  chlorophyll: string;
  safety: string;
  latitude: number;
  longitude: number;
  year?: number | null;
  julianDay?: string | null;
  lengthKm?: number | null;
  source?: string | null;
};

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
            <Fish size={21} className="text-emerald-400" />
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
                  ? "border-l-2 border-emerald-400 bg-emerald-400/10 text-emerald-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  item.active
                    ? "text-emerald-400"
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
              {marineData.location.name}, {marineData.location.country}
            </p>
          </div>

          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  yellow = false,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  yellow?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          yellow ? "bg-yellow-400/10" : "bg-emerald-400/10"
        }`}
      >
        <Icon
          size={21}
          className={yellow ? "text-yellow-400" : "text-emerald-400"}
        />
      </div>

      <p className="mt-6 text-sm text-slate-400">{title}</p>

      <p
        className={`mt-1 text-3xl font-semibold ${
          yellow ? "text-yellow-400" : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function getDirection(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
) {
  const dLon = toLon - fromLon;
  const dLat = toLat - fromLat;

  if (Math.abs(dLat) < 0.0001 && Math.abs(dLon) < 0.0001) {
    return "Here";
  }

  const angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;
  const normalized = (angle + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return "North";
  if (normalized < 67.5) return "Northeast";
  if (normalized < 112.5) return "East";
  if (normalized < 157.5) return "Southeast";
  if (normalized < 202.5) return "South";
  if (normalized < 247.5) return "Southwest";
  if (normalized < 292.5) return "West";
  return "Northwest";
}

function normalizePFZZones(
  zones: PFZZone[],
  latitude: number,
  longitude: number
): FishingZone[] {
  return [...zones]
    .sort((a, b) => Number(a.distance_km ?? Number.POSITIVE_INFINITY) - Number(b.distance_km ?? Number.POSITIVE_INFINITY))
    .map((zone, index) => {
    const distanceNumber =
      zone.distance_km !== undefined &&
      zone.distance_km !== null &&
      Number.isFinite(Number(zone.distance_km))
        ? Number(zone.distance_km)
        : null;

    return {
      rank: index + 1,
      id: zone.zone_id || `PFZ-${index + 1}`,
      name: zone.sector
        ? `PFZ ${zone.sector}`
        : `Potential Fishing Zone ${index + 1}`,
      distance:
        distanceNumber !== null
          ? `${distanceNumber.toFixed(2)} km`
          : "Distance unavailable",
      direction: getDirection(
        latitude,
        longitude,
        Number(zone.latitude),
        Number(zone.longitude)
      ),
      suitability: "Moderate",
      // Chlorophyll is intentionally unavailable in the prototype.
      chlorophyll: "Unavailable",
      // SST is not part of the PFZ zone record currently returned by the API.
      // Keep the field present so the existing UI remains unchanged.
      sst: "Unavailable",
      // Safety is evaluated separately by the marine safety service.
      safety: "Check current conditions",
      latitude: Number(zone.latitude),
      longitude: Number(zone.longitude),
      year: zone.year ?? null,
      julianDay: zone.julian_day ?? null,
      lengthKm: zone.length_km ?? null,
      source: zone.source ?? "INCOIS",
    };
  });
}

export default function FisheriesPage() {
  const [fishingZones, setFishingZones] = useState<FishingZone[]>([]);
  const [location, setLocation] = useState(marineData.location);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationVersion, setLocationVersion] = useState(0);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);

  useEffect(() => {
    const handleLocationChange = () => setLocationVersion((v) => v + 1);
    window.addEventListener("orca-location-changed", handleLocationChange);
    return () => window.removeEventListener("orca-location-changed", handleLocationChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPFZ = async () => {
      try {
        setLoading(true);
        setError(null);

        let latitude = marineData.location.latitude;
        let longitude = marineData.location.longitude;

        const storedLocation = localStorage.getItem("orca-location");

        if (storedLocation) {
          try {
            const parsed = JSON.parse(storedLocation);

            if (
              Number.isFinite(parsed.latitude) &&
              Number.isFinite(parsed.longitude)
            ) {
              latitude = parsed.latitude;
              longitude = parsed.longitude;
            }
          } catch {
            console.warn("Invalid stored ORCA location");
          }
        }

        const response = await fetch(
          `/api/pfz/nearby?lat=${encodeURIComponent(
            latitude
          )}&lon=${encodeURIComponent(longitude)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Unable to load nearby PFZ data");
        }

        const data = await response.json();

        if (cancelled) return;

        if (!Array.isArray(data?.zones)) {
          setFishingZones([]);
        } else {
          setFishingZones(
            normalizePFZZones(data.zones, latitude, longitude)
          );
        }

        setLocation({
          ...marineData.location,
          latitude,
          longitude,
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Fisheries PFZ loading error:", err);
          setError("Unable to load nearby fishing zones.");
          setFishingZones([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPFZ();

    return () => {
      cancelled = true;
    };
  }, [locationVersion]);

  useEffect(() => {
    if (!fishingZones.length) return;

    let cancelled = false;

    const loadIntelligence = async () => {
      try {
        setIntelligenceLoading(true);
        setIntelligenceError(null);

        const response = await fetch(
          `/api/fishing-intelligence?lat=${encodeURIComponent(location.latitude)}&lon=${encodeURIComponent(location.longitude)}`,
          { cache: "no-store" },
        );

        if (!response.ok) throw new Error("Fishing intelligence request failed");
        const data = await response.json();

        if (cancelled || !Array.isArray(data?.zones)) return;

        const intelligenceById: Record<string, FishingZone["intelligence"]> = {};
        data.zones.forEach((zone: any) => {
          intelligenceById[String(zone.zone_id)] = zone.intelligence;
        });

        setFishingZones((current) =>
          current.map((zone) => ({
            ...zone,
            intelligence: intelligenceById[zone.id] ?? zone.intelligence,
            suitability:
              intelligenceById[zone.id]?.suitability === "Favorable"
                ? "High"
                : "Moderate",
            safety:
              typeof intelligenceById[zone.id]?.safetyScore === "number"
                ? `${intelligenceById[zone.id]!.safetyScore}/100 (${intelligenceById[zone.id]!.safetyRisk})`
                : zone.safety,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          setIntelligenceError("Zone-specific safety data is temporarily unavailable.");
        }
      } finally {
        if (!cancelled) setIntelligenceLoading(false);
      }
    };

    loadIntelligence();

    return () => {
      cancelled = true;
    };
  }, [fishingZones.length, location.latitude, location.longitude]);

  const zoneCount = fishingZones.length;

  const nearestSuitableZone =
    fishingZones.find((zone) => {
      const score = zone.intelligence?.suitabilityScore;
      const risk = zone.intelligence?.safetyRisk;
      return (
        typeof score === "number" &&
        score >= 70 &&
        (risk === "LOW" || risk === "MODERATE")
      );
    }) ??
    fishingZones.find((zone) => {
      const score = zone.intelligence?.suitabilityScore;
      return typeof score === "number" && score >= 60;
    });

  const findNearestSuitable = () => {
    if (!nearestSuitableZone) return;
    const element = document.getElementById(`pfz-${nearestSuitableZone.id}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

      <main className="ml-[272px] min-h-screen">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#06111f]/90 px-8 backdrop-blur-xl">
          <div>
            <p className="text-sm text-emerald-400">
              Fisheries Intelligence
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Potential Fishing Zones
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-emerald-400" />
            {marineData.location.name}, {marineData.location.country}
          </div>
        </header>

        <section className="mx-auto max-w-[1250px] px-8 py-8">
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Fish size={17} />
              Fisheries Intelligence
            </div>

            <h2 className="text-3xl font-semibold tracking-tight">
              Potential Fishing Zones
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              AI-assisted fishing zone recommendations based on sea
              temperature, chlorophyll concentration, ocean conditions
              and marine safety.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
  icon={Fish}
  title="Suitable Zones"
  value={loading ? "…" : zoneCount.toString()}
  subtitle="Potential zones detected"
/>

            <StatCard
  icon={Thermometer}
  title="Sea Surface Temperature"
  value="Unavailable"
  subtitle="Suitable temperature range"
/>
<StatCard
  icon={Waves}
  title="Sea State"
  value="Live data"
  subtitle="Current marine condition"
/>

            <StatCard
              icon={ShieldCheck}
              title="Marine Safety"
              value="Caution"
              subtitle="Check marine advisories"
              yellow
            />
          </div>

          <div className="mt-10 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                Recommended Fishing Zones
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Ranked using current marine intelligence
              </p>
            </div>

            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs text-emerald-400">
              {loading ? "Loading…" : `${zoneCount} zones found`}
            </div>
          </div>

          {!loading && !error && fishingZones.length > 0 ? (
            <>
              <div className="mb-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                    Nearest PFZ
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {fishingZones[0].name}
                  </p>
                </div>
                <div className="flex gap-2 text-xs text-slate-300">
                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    {fishingZones[0].distance}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    {fishingZones[0].direction}
                  </span>
                </div>
              </div>
              </div>

              <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-blue-400/15 bg-blue-400/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                    Nearest suitable fishing zone
                  </p>
                  {nearestSuitableZone ? (
                    <p className="mt-1 text-sm text-slate-300">
                      {nearestSuitableZone.name} · {nearestSuitableZone.distance} · {nearestSuitableZone.direction}
                      {typeof nearestSuitableZone.intelligence?.suitabilityScore === "number"
                        ? ` · ${nearestSuitableZone.intelligence.suitabilityScore}/100 suitability`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">
                      No evaluated PFZ currently meets the prototype suitability and safety criteria.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={findNearestSuitable}
                  disabled={!nearestSuitableZone}
                  className="shrink-0 rounded-xl border border-blue-400/20 bg-blue-400/10 px-5 py-2.5 text-sm font-medium text-blue-200 transition hover:bg-blue-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Find nearest suitable →
                </button>
              </div>
            </>
          ) : null}

          {intelligenceLoading ? (
            <div className="mb-4 rounded-2xl border border-blue-400/10 bg-blue-400/[0.03] p-4 text-xs text-blue-200">
              Checking live weather and wave conditions for the five nearest PFZs…
            </div>
          ) : null}

          {intelligenceError ? (
            <div className="mb-4 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.03] p-4 text-xs text-yellow-300">
              {intelligenceError}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-6 text-sm text-slate-400">
                Loading nearby Potential Fishing Zones…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.03] p-6 text-sm text-yellow-300">
                {error}
              </div>
            ) : fishingZones.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-6 text-sm text-slate-400">
                No nearby Potential Fishing Zones were returned for the current location.
              </div>
            ) : fishingZones.map((zone) => (
              <div
                id={`pfz-${zone.id}`}
                key={zone.id}
                className="rounded-2xl border border-white/10 bg-[#091827]/80 p-6 transition hover:border-emerald-400/20 hover:bg-[#0a1c2e]"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10">
                        <Fish size={21} className="text-emerald-400" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                            #{zone.rank}
                          </span>
                          <p className="text-xs font-medium text-emerald-400">
                            {zone.id}
                          </p>
                        </div>

                        <h4 className="mt-1 text-lg font-semibold">
                          {zone.name}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <span className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400">
                        ↗ {zone.distance}
                      </span>

                      <span className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400">
                        <MapPin size={13} className="mr-1 inline" />
                        {zone.direction}
                      </span>

                      {zone.year ? (
                        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400">
                          Year: {zone.year}
                        </span>
                      ) : null}

                      {zone.julianDay ? (
                        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400">
                          Julian Day: {zone.julianDay}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${
                        zone.suitability === "High"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-yellow-400/10 text-yellow-400"
                      }`}
                    >
                      <CircleCheck size={14} />
                      {zone.intelligence?.suitability ?? zone.suitability} Suitability
                    </span>
                    {typeof zone.intelligence?.suitabilityScore === "number" ? (
                      <p className="mt-2 text-right text-[11px] text-slate-500">
                        Prototype suitability: {zone.intelligence.suitabilityScore}/100
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Sea Surface Temperature
                    </p>
                    <p className="mt-1 font-medium">
                        {zone.intelligence?.conditions?.sst != null
                          ? `${zone.intelligence.conditions.sst.toFixed(1)} °C`
                          : zone.sst}
                      </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Chlorophyll
                    </p>
                    <p className="mt-1 font-medium">
                      {zone.chlorophyll}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Marine Safety
                    </p>
                    <p
                      className={
                        zone.intelligence?.safetyRisk === "LOW"
                          ? "mt-1 font-medium text-emerald-400"
                          : "mt-1 font-medium text-yellow-400"
                      }
                    >
                      {zone.intelligence?.unavailable
                        ? "Safety unavailable"
                        : typeof zone.intelligence?.safetyScore === "number"
                          ? `${zone.intelligence.safetyScore}/100 · ${zone.intelligence.safetyRisk ?? "Unknown"}`
                          : zone.safety}
                    </p>
                    {typeof zone.intelligence?.safetyConfidence === "number" ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Confidence {zone.intelligence.safetyConfidence}%
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-end justify-start lg:justify-end">
                    <Link
                      href={`/map-explorer?lat=${encodeURIComponent(
                        zone.latitude
                      )}&lon=${encodeURIComponent(zone.longitude)}`}
                      className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20"
                    >
                      View Zone →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fishing suitability model
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The prototype combines official PFZ evidence, proximity to the operating location and a live zone-specific marine safety check. It is an indicator of potentially favorable conditions, not a prediction of fish abundance. The five nearest zones receive the live safety evaluation; farther zones remain explicitly unevaluated.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                <Leaf size={19} className="text-emerald-400" />
              </div>

              <div>
                <h3 className="font-semibold">
                  How ORCA ranks fishing zones
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  ORCA uses nearby PFZ data from PostgreSQL/PostGIS,
                  distance from the operating location and current marine
                  intelligence to present potential fishing areas. Chlorophyll
                  and PFZ-specific SST are currently unavailable in this
                  prototype and are not fabricated.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.03] p-5">
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0 text-yellow-400"
            />

            <div>
              <p className="text-sm font-medium text-yellow-300">
                Marine safety notice
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Fishing recommendations should be considered together
                with current official marine advisories and local
                conditions.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}