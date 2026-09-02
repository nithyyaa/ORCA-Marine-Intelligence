"use client";

import Link from "next/link";
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
  Ship,
  Clock3,
  Fuel,
  Wind,
  ArrowRight,
  LocateFixed,
  AlertTriangle,
  Compass,
  Gauge,
  Anchor,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Ask ORCA", href: "/ask-orca", icon: Bot },
  { label: "Map Explorer", href: "/map-explorer", icon: Map },
  { label: "Alerts", href: "/alerts", icon: Bell, badge: 3 },
  { label: "Fisheries", href: "/fisheries", icon: Fish },
  { label: "Ocean Conditions", href: "/ocean-conditions", icon: Waves },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Tides", href: "/tides", icon: Navigation },
  { label: "Advisories", href: "/advisories", icon: ShieldCheck },
  {
    label: "Routes & Planning",
    href: "/routes",
    icon: Route,
    active: true,
  },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

const routeOptions = [
  {
    name: "Safe Route",
    tag: "Recommended",
    distance: "42.8 km",
    duration: "2h 18m",
    fuel: "18.4 L",
    safety: "High",
    icon: ShieldCheck,
  },
  {
    name: "Fuel Efficient",
    tag: "Low Fuel",
    distance: "45.2 km",
    duration: "2h 31m",
    fuel: "15.9 L",
    safety: "High",
    icon: Fuel,
  },
  {
    name: "Fastest Route",
    tag: "Shortest Time",
    distance: "34.2 km",
    duration: "1h 52m",
    fuel: "20.8 L",
    safety: "Moderate",
    icon: Gauge,
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
            <Compass size={21} className="text-violet-400" />
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
          <div className="flex-1 px-3 py-2 text-center text-slate-500">
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
              Visakhapatnam, India
            </p>
          </div>

          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

export default function RoutesPage() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

      <main className="ml-[272px] min-h-screen">
        {/* TOP BAR */}

        <header className="flex h-20 items-center justify-between border-b border-white/10 px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400">
              Navigation
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Routes & Planning
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-violet-400" />
            Visakhapatnam, India
          </div>
        </header>

        <section className="mx-auto max-w-[1350px] px-8 py-8">

          {/* INTRO */}

          <div className="mb-7">
            <h2 className="text-3xl font-semibold">
              Plan your marine journey
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Compare routes using distance, travel time, fuel
              requirements and current marine conditions.
            </p>
          </div>

          {/* MAIN PLANNER */}

          <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-[#091827] lg:grid-cols-[350px_1fr]">

            {/* LEFT CONTROLS */}

            <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
                  <Route size={19} className="text-violet-400" />
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

                {/* FROM */}

                <div>
                  <label className="text-xs text-slate-500">
                    From
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071525] px-4 py-3">
                    <LocateFixed
                      size={17}
                      className="text-violet-400"
                    />

                    <div>
                      <p className="text-sm text-white">
                        Visakhapatnam
                      </p>

                      <p className="text-[11px] text-slate-600">
                        Current location
                      </p>
                    </div>
                  </div>
                </div>

                {/* TO */}

                <div>
                  <label className="text-xs text-slate-500">
                    To
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071525] px-4 py-3">
                    <MapPin
                      size={17}
                      className="text-violet-400"
                    />

                    <span className="text-sm text-slate-600">
                      Choose destination
                    </span>
                  </div>
                </div>

                {/* VESSEL */}

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

                {/* DEPARTURE */}

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

                    <ChevronDown
                      size={15}
                      className="ml-auto text-slate-600"
                    />
                  </div>
                </div>

                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-3.5 text-sm font-medium transition hover:bg-violet-400">
                  <Navigation2Icon />
                  Calculate route
                </button>
              </div>
            </div>

            {/* MAP */}

            <div className="relative min-h-[520px] overflow-hidden bg-[#06131f]">

              {/* OCEAN GRID */}

              <div className="absolute inset-0 opacity-30">
                <div className="absolute left-0 top-[18%] h-px w-full rotate-6 bg-violet-400/20" />
                <div className="absolute left-0 top-[38%] h-px w-full -rotate-6 bg-violet-400/10" />
                <div className="absolute left-0 top-[63%] h-px w-full rotate-3 bg-violet-400/15" />
                <div className="absolute left-[20%] top-0 h-full w-px rotate-[20deg] bg-violet-400/10" />
                <div className="absolute left-[55%] top-0 h-full w-px -rotate-[15deg] bg-violet-400/10" />
                <div className="absolute left-[80%] top-0 h-full w-px rotate-[12deg] bg-violet-400/10" />
              </div>

              {/* RADAR CIRCLE */}

              <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/10">
                <div className="absolute inset-[20%] rounded-full border border-violet-400/10" />
                <div className="absolute inset-[40%] rounded-full border border-violet-400/10" />
              </div>

              {/* ROUTE */}

              <svg className="absolute inset-0 h-full w-full">
                <path
                  d="M 180 390 C 300 350, 350 290, 470 315 S 700 210, 850 160"
                  fill="none"
                  stroke="rgba(167,139,250,0.85)"
                  strokeWidth="3"
                  strokeDasharray="8 8"
                />
              </svg>

              {/* START */}

              <div className="absolute bottom-[22%] left-[16%]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-violet-300/20 bg-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                  <LocateFixed size={19} />
                </div>

                <div className="mt-2 rounded-lg border border-white/10 bg-[#071525]/90 px-3 py-2">
                  <p className="text-[10px] text-slate-600">
                    START
                  </p>

                  <p className="text-xs font-medium">
                    Visakhapatnam
                  </p>
                </div>
              </div>

              {/* DESTINATION */}

              <div className="absolute right-[15%] top-[20%]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-violet-300/20 bg-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                  <Anchor size={19} />
                </div>

                <div className="mt-2 rounded-lg border border-white/10 bg-[#071525]/90 px-3 py-2">
                  <p className="text-[10px] text-slate-600">
                    DESTINATION
                  </p>

                  <p className="text-xs font-medium">
                    Offshore Zone
                  </p>
                </div>
              </div>

              {/* MAP HEADER */}

              <div className="absolute left-6 top-6 rounded-xl border border-white/10 bg-[#071525]/90 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Compass
                    size={15}
                    className="text-violet-400"
                  />

                  <span className="text-xs font-medium">
                    Marine navigation map
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-slate-600">
                  Route conditions updated
                </p>
              </div>

              {/* NORTH */}

              <div className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#071525]/90">
                <span className="text-xs font-semibold text-violet-300">
                  N
                </span>
              </div>

              {/* MAP STATUS */}

              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
                <div className="rounded-xl border border-white/10 bg-[#071525]/95 px-4 py-3">
                  <p className="text-[10px] text-slate-600">
                    Marine conditions
                  </p>

                  <p className="mt-1 text-xs text-green-400">
                    Suitable for planning
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#071525]/95 px-4 py-3">
                  <p className="text-[10px] text-slate-600">
                    Route distance
                  </p>

                  <p className="mt-1 text-xs">
                    42.8 km
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#071525]/95 px-4 py-3">
                  <p className="text-[10px] text-slate-600">
                    Estimated time
                  </p>

                  <p className="mt-1 text-xs">
                    2h 18m
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ROUTE RESULTS */}

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
                3 options found
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {routeOptions.map((route, index) => {
                const Icon = route.icon;

                return (
                  <div
                    key={route.name}
                    className={`rounded-2xl border p-5 ${
                      index === 0
                        ? "border-violet-400/20 bg-violet-400/[0.035]"
                        : "border-white/10 bg-[#091827]"
                    }`}
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

                      <div className="flex min-w-[230px] items-center gap-4">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            index === 0
                              ? "bg-violet-400/10"
                              : "bg-white/[0.04]"
                          }`}
                        >
                          <Icon
                            size={19}
                            className={
                              index === 0
                                ? "text-violet-400"
                                : "text-slate-500"
                            }
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {route.name}
                            </h4>

                            {index === 0 && (
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
                            {route.distance}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Travel time
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {route.duration}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Fuel estimate
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {route.fuel}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600">
                            Safety
                          </p>

                          <p
                            className={`mt-1 text-sm font-medium ${
                              route.safety === "High"
                                ? "text-green-400"
                                : "text-amber-400"
                            }`}
                          >
                            {route.safety}
                          </p>
                        </div>

                      </div>

                      <button
                        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm ${
                          index === 0
                            ? "bg-violet-500 text-white hover:bg-violet-400"
                            : "border border-white/10 text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        Select
                        <ArrowRight size={15} />
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CURRENT MARINE FACTORS */}

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">

            <div className="rounded-2xl border border-white/10 bg-[#091827] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
                  <Waves size={19} className="text-violet-400" />
                </div>

                <div>
                  <p className="text-xs text-slate-600">
                    Navigation factors
                  </p>

                  <h3 className="font-semibold">
                    Conditions considered
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">

                <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                  <Waves size={17} className="text-cyan-400" />

                  <p className="mt-4 text-xs text-slate-600">
                    Sea state
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    Moderate
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                  <Wind size={17} className="text-violet-400" />

                  <p className="mt-4 text-xs text-slate-600">
                    Wind
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    14 km/h
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                  <Navigation size={17} className="text-blue-400" />

                  <p className="mt-4 text-xs text-slate-600">
                    Current
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    Favorable
                  </p>
                </div>

              </div>
            </div>

            {/* SAFETY */}

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
                Conditions can change
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Route recommendations are based on currently
                available marine information. Recheck conditions
                before departure and during extended journeys.
              </p>
            </div>
          </div>

          {/* ORCA RECOMMENDATION */}

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
                  Prioritize the balanced route
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  The recommended route provides a practical
                  balance between distance, estimated travel time,
                  fuel consumption and current marine conditions.
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

function Navigation2Icon() {
  return <Navigation size={17} />;
}