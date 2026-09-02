"use client";

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
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Clock3,
  Compass,
} from "lucide-react";

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

const tideEvents = [
  {
    time: "02:18 AM",
    height: "0.7 m",
    type: "Low Tide",
    icon: ArrowDown,
    accent: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    time: marineData.tides.nextHigh,
    height: `${marineData.tides.highHeight} m`,
    type: "High Tide",
    icon: ArrowUp,
    accent: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  {
    time: "02:46 PM",
    height: "0.8 m",
    type: "Low Tide",
    icon: ArrowDown,
    accent: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    time: "09:04 PM",
    height: "2.3 m",
    type: "High Tide",
    icon: ArrowUp,
    accent: "text-violet-400",
    bg: "bg-violet-400/10",
  },
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

function Sidebar() {
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
              {marineData.location.name}, {marineData.location.country}
            </p>
          </div>

          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

export default function TidesPage() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

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
            {marineData.location.name}, {marineData.location.country}
          </div>
        </header>

        <section className="mx-auto max-w-[1250px] px-8 py-8">

          {/* HEADER */}

          <div className="mb-8">
            <p className="text-sm text-slate-500">
              Tuesday · September 1
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
                    {marineData.location.name} coast
                  </p>

                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-6xl font-light">
                      1.4
                    </span>

                    <span className="pb-2 text-lg text-slate-500">
                      metres
                    </span>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-400/10 px-3 py-2 text-xs text-violet-300">
                    <ArrowUp size={14} />
                    Rising
                  </div>

                  <p className="mt-6 text-sm leading-6 text-slate-500">
                    Water level is currently rising toward the next
                    high tide.
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
                    {marineData.tides.nextHigh}
                  </p>

                  <p className="text-xs text-violet-400">
                    {marineData.tides.highHeight} m
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
              {tideEvents.map((event) => {
                const Icon = event.icon;

                return (
                  <div
                    key={event.time}
                    className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5 transition hover:-translate-y-1 hover:border-violet-400/20"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${event.bg}`}
                      >
                        <Icon
                          size={19}
                          className={event.accent}
                        />
                      </div>

                      <span className="text-xs text-slate-600">
                        Today
                      </span>
                    </div>

                    <p className="mt-6 text-sm text-slate-500">
                      {event.type}
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {event.time}
                    </p>

                    <p className={`mt-2 text-sm ${event.accent}`}>
                      {event.height}
                    </p>
                  </div>
                );
              })}
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
                {(
                  marineData.tides.highHeight -
                  marineData.tides.lowHeight
                ).toFixed(1)}{" "}
                m
              </p>

              <div className="mt-5 h-2 rounded-full bg-white/5">
                <div className="h-full w-[68%] rounded-full bg-violet-400" />
              </div>

              <div className="mt-3 flex justify-between text-[11px] text-slate-600">
                <span>
                  {marineData.tides.lowHeight} m low
                </span>

                <span>
                  {marineData.tides.highHeight} m high
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
                Rising
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Current flow is moving toward high tide.
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
                Favorable
              </p>

              <p className="mt-3 text-sm leading-5 text-slate-500">
                Suitable tidal conditions expected around the next
                high-water period.
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
                {week.map(([day, high, low]) => (
                  <div
                    key={day}
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
                  {marineData.tides.nextHigh}
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  The current tide is rising. The next high-water
                  period may provide a favorable window for coastal
                  navigation, subject to weather and sea-state
                  conditions.
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}