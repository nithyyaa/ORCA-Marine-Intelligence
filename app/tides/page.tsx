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
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Clock3,
  Compass,
} from "lucide-react";

type Tide = {
  type: string;
  time: string;
  height: number;
};

type TideApiResponse = {
  live: boolean;
  modelDerived?: boolean;
  source?: string;
  location?: string;
  tides?: Tide[];
  error?: string;
};

function parseTideHour(time: string) {
  const match = time.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);
  if (!match) return 0;

  let hour = Number(match[1]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + Number(match[2]);
}


const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Ask ORCA", href: "/ask-orca", icon: Bot },
  { label: "Map Explorer", href: "/map-explorer", icon: Map },
  { label: "Alerts", href: "/alerts", icon: Bell, badge: 3 },
  { label: "Fisheries", href: "/fisheries", icon: Fish },
  { label: "Ocean Conditions", href: "/ocean-conditions", icon: Waves },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Tides", href: "/tides", icon: Navigation, active: true },
  { label: "Advisories", href: "/advisories", icon: ShieldCheck },
  { label: "Routes & Planning", href: "/routes", icon: Route },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];



const week = [
  ["Mon", "1.9 m", "0.6 m"],
  ["Tue", "2.3 m", "0.7 m"],
  ["Wed", "2.1 m", "0.8 m"],
  ["Thu", "2.4 m", "0.5 m"],
  ["Fri", "2.2 m", "0.7 m"],
  ["Sat", "2.5 m", "0.6 m"],
  ["Sun", "2.3 m", "0.8 m"],
];

function Sidebar({ locationName }: { locationName: string }) {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
            <Navigation size={21} className="text-violet-400" />
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

export default function TidesPage() {
  const [locationName, setLocationName] = useState("Operating location");
  const [tides, setTides] = useState<Tide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTides() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/tide", {
          cache: "no-store",
        });

        const data: TideApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to fetch tide data");
        }

        if (!cancelled) {
          setLocationName(data.location || "Operating location");
          setTides(data.tides || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to fetch tide data"
          );
          setTides([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTides();

    return () => {
      cancelled = true;
    };
  }, []);

  const highTides = tides.filter((tide) => tide.type === "High Tide");
  const lowTides = tides.filter((tide) => tide.type === "Low Tide");

  const nextHigh = highTides[0];
  const nextLow = lowTides[0];
  const currentTide = tides[0];

  const highHeight =
    highTides.length > 0
      ? Math.max(...highTides.map((tide) => tide.height))
      : null;

  const lowHeight =
    lowTides.length > 0
      ? Math.min(...lowTides.map((tide) => tide.height))
      : null;

  const tidalRange =
    highHeight !== null && lowHeight !== null
      ? highHeight - lowHeight
      : null;

  const tideDirection =
    currentTide?.type === "High Tide"
      ? "Rising"
      : currentTide?.type === "Low Tide"
        ? "Falling"
        : "—";

  const navigationStatus =
    tidalRange === null
      ? "—"
      : tidalRange >= 1.5
        ? "Favorable"
        : tidalRange >= 0.8
          ? "Moderate"
          : "Limited";

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      high: "—",
      low: "—",
    };
  });

  // The tide API returns events in chronological order but currently
  // exposes only local clock time. We detect midnight crossings to
  // group the returned events into the next few calendar days.
  let dayOffset = 0;
  let previousMinutes = -1;
  const groupedDays = weekDays.map((day) => ({ ...day }));

  for (const event of tides) {
    const minutes = parseTideHour(event.time);

    if (previousMinutes >= 0 && minutes < previousMinutes) {
      dayOffset += 1;
    }

    const day = groupedDays[Math.min(dayOffset, groupedDays.length - 1)];

    if (event.type === "High Tide") {
      day.high = `${event.height.toFixed(2)} m`;
    } else if (event.type === "Low Tide") {
      day.low = `${event.height.toFixed(2)} m`;
    }

    previousMinutes = minutes;
  }

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar locationName={locationName} />

      <main className="ml-[272px] min-h-screen">
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#06111f] px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400">
              Coastal Dynamics
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Tide Intelligence
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-violet-400" />
            {locationName}
          </div>
        </header>

        <section className="mx-auto max-w-[1250px] px-8 py-8">

          {/* HEADER */}

          <div className="mb-8">
            <p className="text-sm text-slate-500">
              {todayLabel}
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Tide conditions
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Track upcoming high and low tides to support safer
              coastal navigation and marine planning.
            </p>
          </div>

          {/* CURRENT TIDE HERO */}

          <div className="overflow-hidden rounded-[28px] border border-violet-400/10 bg-gradient-to-br from-[#17152c] via-[#0c1728] to-[#091522]">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">

              <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-10">
                <div className="flex items-center gap-2 text-sm text-violet-300">
                  <Waves size={17} />
                  Current tide
                </div>

                <div className="mt-8">
                  <p className="text-sm text-slate-500">
                    {locationName} coast
                  </p>

                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-6xl font-light">
                      {currentTide ? currentTide.height.toFixed(2) : "—"}
                    </span>

                    <span className="pb-2 text-lg text-slate-500">
                      metres
                    </span>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-400/10 px-3 py-2 text-xs text-violet-300">
                    {currentTide?.type === "Low Tide" ? (
                      <ArrowDown size={14} />
                    ) : (
                      <ArrowUp size={14} />
                    )}
                    {tideDirection}
                  </div>

                  <p className="mt-6 text-sm leading-6 text-slate-500">
                    {loading
                      ? "Loading live marine tide data..."
                      : error
                        ? error
                        : currentTide
                          ? `The next model-derived tide event is ${currentTide.type.toLowerCase()} at ${currentTide.time}.`
                          : "No tide events are currently available."}
                  </p>
                </div>
              </div>

              {/* TIDE VISUAL */}

              <div className="relative min-h-[290px] p-8 lg:p-10">
                <div className="absolute inset-x-8 top-1/2 border-t border-dashed border-white/10" />

                <div className="absolute bottom-10 left-8 right-8 h-[190px]">
                  <svg
                    viewBox="0 0 700 200"
                    className="h-full w-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="tideFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#a78bfa"
                          stopOpacity="0.3"
                        />

                        <stop
                          offset="100%"
                          stopColor="#a78bfa"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0 150 C70 145 90 45 180 42 C270 39 300 165 380 158 C470 151 480 30 570 25 C630 22 660 65 700 72 L700 200 L0 200 Z"
                      fill="url(#tideFill)"
                    />

                    <path
                      d="M0 150 C70 145 90 45 180 42 C270 39 300 165 380 158 C470 151 480 30 570 25 C630 22 660 65 700 72"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="4"
                      vectorEffect="non-scaling-stroke"
                    />

                    <circle
                      cx="380"
                      cy="158"
                      r="7"
                      fill="#06111f"
                      stroke="#a78bfa"
                      strokeWidth="3"
                    />
                  </svg>
                </div>

                <div className="absolute bottom-3 left-8 text-[11px] text-slate-600">
                  12 AM
                </div>

                <div className="absolute bottom-3 left-1/2 text-[11px] text-slate-600">
                  12 PM
                </div>

                <div className="absolute bottom-3 right-8 text-[11px] text-slate-600">
                  12 AM
                </div>

                <div className="absolute right-8 top-8 rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                  <p className="text-[11px] text-slate-500">
                    Next high tide
                  </p>

                  <p className="mt-1 font-medium">
                    {nextHigh?.time || "—"}
                  </p>

                  <p className="text-xs text-violet-400">
                    {nextHigh ? `${nextHigh.height.toFixed(2)} m` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NEXT TIDES */}

          <div className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-violet-400">
                  Today's cycle
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  High & low tides
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock3 size={14} />
                Local time
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                <div className="col-span-full rounded-2xl border border-white/10 bg-[#091827]/70 p-8 text-center text-sm text-slate-500">
                  Loading tide events...
                </div>
              ) : error ? (
                <div className="col-span-full rounded-2xl border border-red-400/10 bg-red-400/[0.03] p-8 text-center text-sm text-red-300">
                  {error}
                </div>
              ) : tides.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-white/10 bg-[#091827]/70 p-8 text-center text-sm text-slate-500">
                  No tide events available.
                </div>
              ) : (
                tides.slice(0, 4).map((event) => {
                  const isHigh = event.type === "High Tide";

                  return (
                    <div
                      key={`${event.type}-${event.time}`}
                      className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5 transition hover:-translate-y-1 hover:border-violet-400/20"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            isHigh ? "bg-violet-400/10" : "bg-blue-400/10"
                          }`}
                        >
                          {isHigh ? (
                            <ArrowUp
                              size={19}
                              className="text-violet-400"
                            />
                          ) : (
                            <ArrowDown
                              size={19}
                              className="text-blue-400"
                            />
                          )}
                        </div>

                        <span className="text-xs text-slate-600">
                          Upcoming
                        </span>
                      </div>

                      <p className="mt-6 text-sm text-slate-500">
                        {event.type}
                      </p>

                      <p className="mt-1 text-2xl font-semibold">
                        {event.time}
                      </p>

                      <p
                        className={`mt-2 text-sm ${
                          isHigh ? "text-violet-400" : "text-blue-400"
                        }`}
                      >
                        {event.height.toFixed(2)} m
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TIDE RANGE + NAVIGATION */}

          <div className="mt-8 grid gap-5 lg:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
                <Waves size={19} className="text-violet-400" />
              </div>

              <p className="mt-5 text-xs text-slate-500">
                Today's tidal range
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {tidalRange !== null ? tidalRange.toFixed(2) : "—"}{" "}
                m
              </p>

              <div className="mt-5 h-2 rounded-full bg-white/5">
                <div className="h-full w-[68%] rounded-full bg-violet-400" />
              </div>

              <div className="mt-3 flex justify-between text-[11px] text-slate-600">
                <span>
                  {lowHeight !== null ? `${lowHeight.toFixed(2)} m low` : "— low"}
                </span>

                <span>
                  {nextHigh ? `${nextHigh.height.toFixed(2)} m` : "—"} high
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">
                <Compass size={19} className="text-blue-400" />
              </div>

              <p className="mt-5 text-xs text-slate-500">
                Tide direction
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {tideDirection}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                {currentTide
                  ? `The next model-derived event is ${currentTide.type.toLowerCase()} at ${currentTide.time}.`
                  : "No current tide trend is available."}
              </p>
            </div>

            <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
                <Navigation
                  size={19}
                  className="text-violet-400"
                />
              </div>

              <p className="mt-5 text-xs text-slate-500">
                Navigation window
              </p>

              <p className="mt-1 text-xl font-semibold text-violet-300">
                {navigationStatus}
              </p>

              <p className="mt-3 text-sm leading-5 text-slate-500">
                {nextHigh
                  ? `Next high water is expected at ${nextHigh.time}.`
                  : "Tidal conditions are currently unavailable."}
              </p>
            </div>
          </div>

          {/* WEEKLY OUTLOOK */}

          <div className="mt-9">
            <p className="text-xs uppercase tracking-widest text-violet-400">
              Seven day outlook
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Tidal pattern
            </h3>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#091827]/70">
              <div className="grid grid-cols-7 divide-x divide-white/10">
                {groupedDays.map(({ key, label: day, high, low }) => (
                  <div
                    key={key}
                    className="p-4 text-center transition hover:bg-violet-400/[0.035]"
                  >
                    <p className="text-xs text-slate-500">
                      {day}
                    </p>

                    <div className="mx-auto my-5 flex h-20 flex-col items-center justify-center">
                      <ArrowUp
                        size={15}
                        className="text-violet-400"
                      />

                      <p className="mt-1 text-sm font-semibold">
                        {high}
                      </p>

                      <ArrowDown
                        size={15}
                        className="mt-2 text-blue-400"
                      />

                      <p className="text-xs text-slate-600">
                        {low}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ORCA INSIGHT */}

          <div className="mt-8 rounded-2xl border border-violet-400/10 bg-gradient-to-r from-violet-400/[0.045] to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10">
                <Navigation
                  size={21}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-violet-400">
                  ORCA insight
                </p>

                <h3 className="mt-2 font-semibold">
                  Next high tide occurs at{" "}
                  {nextHigh?.time || "—"}
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {nextHigh
                    ? `The next model-derived high-water period is expected at ${nextHigh.time}. This may provide a useful window for coastal navigation, subject to weather and sea-state conditions.`
                    : "Tide intelligence is currently unavailable. Check the selected operating location and try again."}
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}