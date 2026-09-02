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
  AlertTriangle,
  CheckCircle2,
  Info,
  Wind,
  Anchor,
  Ship,
  Clock3,
  Eye,
  Thermometer,
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
  {
    label: "Advisories",
    href: "/advisories",
    icon: ShieldCheck,
    active: true,
  },
  { label: "Routes & Planning", href: "/routes", icon: Route },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

const advisories = [
  {
    title: "Elevated Wave Conditions",
    category: "Marine Safety",
    severity: "Caution",
    icon: Waves,
    description: `Wave height is currently ${marineData.ocean.waveHeight} m. Small fishing vessels should exercise additional caution during offshore operations.`,
    details: `Wave height: ${marineData.ocean.waveHeight} m`,
    time: "Current conditions",
  },
  {
    title: "Offshore Wind Conditions",
    category: "Navigation",
    severity: "Moderate",
    icon: Wind,
    description: `Winds are currently ${marineData.weather.windSpeed} km/h from the ${marineData.weather.windDirection} direction. Monitor conditions when travelling offshore.`,
    details: `Wind: ${marineData.weather.windSpeed} km/h ${marineData.weather.windDirection}`,
    time: "Current conditions",
  },
  {
    title: "Visibility Conditions",
    category: "Operations",
    severity: "Good",
    icon: Eye,
    description: `Current visibility is ${marineData.weather.visibility} km. Conditions remain suitable for normal marine observation and navigation.`,
    details: `Visibility: ${marineData.weather.visibility} km`,
    time: "Current conditions",
  },
];

const guidance = [
  {
    icon: Fish,
    title: "Small fishing vessels",
    text: `Check wave and wind conditions before moving offshore. Current wave height is ${marineData.ocean.waveHeight} m.`,
  },
  {
    icon: Ship,
    title: "Commercial vessels",
    text: "Normal navigation may continue with routine monitoring of changing marine conditions.",
  },
  {
    icon: Anchor,
    title: "Coastal operations",
    text: `Current weather is ${marineData.weather.condition.toLowerCase()} with ${marineData.weather.visibility} km visibility.`,
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
            <ShieldCheck size={21} className="text-red-400" />
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
                  ? "border-l-2 border-red-400 bg-red-400/10 text-red-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  item.active
                    ? "text-red-400"
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

export default function AdvisoriesPage() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

      <main className="ml-[272px] min-h-screen">
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#06111f] px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-400">
              Safety Intelligence
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Marine Advisories
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-red-400" />

            {marineData.location.name},{" "}
            {marineData.location.country}
          </div>
        </header>

        <section className="mx-auto max-w-[1250px] px-8 py-8">

          {/* INTRO */}

          <div className="mb-8">
            <p className="text-sm text-slate-500">
              Live marine guidance
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Stay informed before you head offshore
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              ORCA combines marine conditions, weather, tides and
              operational factors to provide practical guidance for
              marine activities.
            </p>
          </div>

          {/* STATUS BANNER */}

          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.045] p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
                  <AlertTriangle
                    size={21}
                    className="text-amber-400"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-amber-400">
                    Current advisory level
                  </p>

                  <h3 className="mt-1 text-lg font-semibold">
                    Caution advised offshore
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Wave height of {marineData.ocean.waveHeight} m
                    and winds of {marineData.weather.windSpeed}{" "}
                    km/h require additional awareness.
                  </p>
                </div>
              </div>

              <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300">
                MODERATE
              </div>
            </div>
          </div>

          {/* QUICK STATUS */}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
              <p className="text-xs text-slate-500">
                Active advisories
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {advisories.length}
              </p>

              <p className="mt-2 text-xs text-amber-400">
                Requiring attention
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
              <div className="flex items-center gap-2">
                <Waves size={16} className="text-amber-400" />

                <p className="text-xs text-slate-500">
                  Wave height
                </p>
              </div>

              <p className="mt-2 text-3xl font-semibold">
                {marineData.ocean.waveHeight} m
              </p>

              <p className="mt-2 text-xs text-slate-600">
                {marineData.ocean.seaState} sea state
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
              <div className="flex items-center gap-2">
                <Wind size={16} className="text-amber-400" />

                <p className="text-xs text-slate-500">
                  Wind
                </p>
              </div>

              <p className="mt-2 text-3xl font-semibold">
                {marineData.weather.windSpeed}
                <span className="ml-1 text-base text-slate-500">
                  km/h
                </span>
              </p>

              <p className="mt-2 text-xs text-slate-600">
                {marineData.weather.windDirection} direction
              </p>
            </div>
          </div>

          {/* ADVISORY CARDS */}

          <div className="mt-8">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-red-400">
                Current advisories
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Conditions requiring attention
              </h3>
            </div>

            <div className="space-y-4">
              {advisories.map((advisory) => {
                const Icon = advisory.icon;

                return (
                  <div
                    key={advisory.title}
                    className="rounded-2xl border border-white/10 bg-[#091827]/70 p-6 transition hover:border-red-400/15"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-400/10">
                          <Icon
                            size={20}
                            className="text-red-400"
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="font-semibold">
                              {advisory.title}
                            </h4>

                            <span className="rounded-full bg-red-400/10 px-3 py-1 text-[11px] text-red-300">
                              {advisory.category}
                            </span>
                          </div>

                          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                            {advisory.description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            <span>{advisory.details}</span>

                            <span className="flex items-center gap-1.5">
                              <Clock3 size={13} />
                              {advisory.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-4 py-2 text-xs font-medium ${
                          advisory.severity === "Good"
                            ? "bg-green-400/10 text-green-400"
                            : "bg-amber-400/10 text-amber-300"
                        }`}
                      >
                        {advisory.severity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONDITIONS SNAPSHOT */}

          <div className="mt-8">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-red-400">
                Conditions snapshot
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Factors behind the advisory
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                  <Thermometer
                    size={18}
                    className="text-cyan-400"
                  />
                </div>

                <p className="mt-5 text-xs text-slate-500">
                  Sea Surface Temperature
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.ocean.sst}°C
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Current ocean temperature
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">
                  <Waves size={18} className="text-blue-400" />
                </div>

                <p className="mt-5 text-xs text-slate-500">
                  Sea State
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.ocean.seaState}
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Wave height: {marineData.ocean.waveHeight} m
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                  <Eye size={18} className="text-amber-400" />
                </div>

                <p className="mt-5 text-xs text-slate-500">
                  Visibility
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.weather.visibility} km
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Current weather visibility
                </p>
              </div>
            </div>
          </div>

          {/* GUIDANCE */}

          <div className="mt-8">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-red-400">
                Operational guidance
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                What this means for you
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {guidance.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                      <Icon
                        size={18}
                        className="text-red-400"
                      />
                    </div>

                    <h4 className="mt-5 font-medium">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHECKLIST */}

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#091827]/70 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-400/10">
                <CheckCircle2
                  size={19}
                  className="text-green-400"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">
                  Before departure checklist
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Review these conditions before heading offshore.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
                    <CheckCircle2
                      size={17}
                      className="text-green-400"
                    />

                    <span className="text-sm text-slate-400">
                      Check weather
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
                    <CheckCircle2
                      size={17}
                      className="text-green-400"
                    />

                    <span className="text-sm text-slate-400">
                      Check tides
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
                    <CheckCircle2
                      size={17}
                      className="text-green-400"
                    />

                    <span className="text-sm text-slate-400">
                      Review alerts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NOTICE */}

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.03] p-5">
            <Info
              size={19}
              className="mt-0.5 shrink-0 text-yellow-400"
            />

            <div>
              <p className="text-sm font-medium text-yellow-300">
                Marine safety notice
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                ORCA advisories are decision-support information.
                Always consider current official marine advisories,
                local conditions and vessel-specific requirements.
              </p>
            </div>
          </div>

          {/* ORCA INSIGHT */}

          <div className="mt-8 rounded-2xl border border-red-400/10 bg-gradient-to-r from-red-400/[0.04] to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-400/10">
                <ShieldCheck
                  size={21}
                  className="text-red-400"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-red-400">
                  ORCA recommendation
                </p>

                <h3 className="mt-2 font-semibold">
                  Exercise caution during offshore travel
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Current marine conditions are not necessarily
                  prohibitive, but wave height of{" "}
                  {marineData.ocean.waveHeight} m and winds of{" "}
                  {marineData.weather.windSpeed} km/h increase
                  operational risk for smaller vessels. Recheck
                  conditions immediately before departure.
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}