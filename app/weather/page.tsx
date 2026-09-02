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
  Thermometer,
  Wind,
  Eye,
  ChevronDown,
  Cloud,
  Umbrella,
  Compass,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Ask ORCA", href: "/ask-orca", icon: Bot },
  { label: "Map Explorer", href: "/map-explorer", icon: Map },
  { label: "Alerts", href: "/alerts", icon: Bell, badge: 3 },
  { label: "Fisheries", href: "/fisheries", icon: Fish },
  { label: "Ocean Conditions", href: "/ocean-conditions", icon: Waves },
  {
    label: "Weather",
    href: "/weather",
    icon: CloudSun,
    active: true,
  },
  { label: "Tides", href: "/tides", icon: Navigation },
  { label: "Advisories", href: "/advisories", icon: ShieldCheck },
  { label: "Routes & Planning", href: "/routes", icon: Route },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
            <CloudSun size={21} className="text-amber-400" />
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
                  ? "border-l-2 border-amber-400 bg-amber-400/10 text-amber-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  item.active
                    ? "text-amber-400"
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
              {marineData.location.name},{" "}
              {marineData.location.country}
            </p>
          </div>

          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

export default function WeatherPage() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

      <main className="ml-[272px] min-h-screen">
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#06111f] px-8">
          <div>
            <p className="text-sm text-amber-400">
              Atmospheric Intelligence
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Weather
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-amber-400" />

            {marineData.location.name},{" "}
            {marineData.location.country}
          </div>
        </header>

        <section className="mx-auto max-w-[1250px] px-8 py-8">
          {/* PAGE HEADER */}

          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-400">
              <CloudSun size={17} />

              Weather Intelligence
            </div>

            <h2 className="text-3xl font-semibold tracking-tight">
              Current Weather
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Monitor atmospheric conditions around{" "}
              {marineData.location.name} to support safer marine
              operations.
            </p>
          </div>

          {/* CURRENT WEATHER */}

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-7 lg:col-span-2">
              <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10">
                      <CloudSun
                        size={28}
                        className="text-amber-400"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Current conditions
                      </p>

                      <p className="mt-1 text-lg font-medium">
                        {marineData.weather.condition}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex items-end gap-3">
                    <span className="text-6xl font-semibold tracking-tight">
                      {marineData.weather.temperature}°
                    </span>

                    <span className="mb-2 text-xl text-slate-500">
                      C
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {marineData.location.name},{" "}
                    {marineData.location.country}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:w-[280px]">
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <Wind
                      size={18}
                      className="text-amber-400"
                    />

                    <p className="mt-4 text-xs text-slate-500">
                      Wind
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {marineData.weather.windSpeed} km/h
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <Compass
                      size={18}
                      className="text-amber-400"
                    />

                    <p className="mt-4 text-xs text-slate-500">
                      Direction
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {marineData.weather.windDirection}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <Eye
                      size={18}
                      className="text-amber-400"
                    />

                    <p className="mt-4 text-xs text-slate-500">
                      Visibility
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {marineData.weather.visibility} km
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <Umbrella
                      size={18}
                      className="text-amber-400"
                    />

                    <p className="mt-4 text-xs text-slate-500">
                      Conditions
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      Stable
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ORCA ASSESSMENT */}

            <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
                <CloudSun
                  size={21}
                  className="text-amber-400"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                ORCA Assessment
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Weather conditions around{" "}
                {marineData.location.name} are currently{" "}
                <span className="font-medium text-amber-300">
                  {marineData.weather.condition.toLowerCase()}
                </span>
                . Wind speeds are around{" "}
                {marineData.weather.windSpeed} km/h with{" "}
                {marineData.weather.visibility} km visibility.
              </p>

              <div className="mt-6 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
                <p className="text-xs text-slate-500">
                  Operational outlook
                </p>

                <p className="mt-1 text-lg font-semibold text-amber-300">
                  Monitor conditions
                </p>
              </div>
            </div>
          </div>

          {/* WEATHER PARAMETERS */}

          <div className="mt-8">
            <div className="mb-5">
              <h3 className="text-lg font-semibold">
                Atmospheric Parameters
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Current weather observations
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
                  <Thermometer
                    size={20}
                    className="text-amber-400"
                  />
                </div>

                <p className="mt-5 text-sm text-slate-400">
                  Temperature
                </p>

                <p className="mt-1 text-3xl font-semibold">
                  {marineData.weather.temperature}°C
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Current air temperature
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
                  <Wind
                    size={20}
                    className="text-amber-400"
                  />
                </div>

                <p className="mt-5 text-sm text-slate-400">
                  Wind Speed
                </p>

                <p className="mt-1 text-3xl font-semibold">
                  {marineData.weather.windSpeed}
                  <span className="ml-1 text-base font-normal text-slate-500">
                    km/h
                  </span>
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {marineData.weather.windDirection} direction
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
                  <Eye
                    size={20}
                    className="text-amber-400"
                  />
                </div>

                <p className="mt-5 text-sm text-slate-400">
                  Visibility
                </p>

                <p className="mt-1 text-3xl font-semibold">
                  {marineData.weather.visibility}
                  <span className="ml-1 text-base font-normal text-slate-500">
                    km
                  </span>
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Good visibility
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/80 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
                  <Cloud
                    size={20}
                    className="text-amber-400"
                  />
                </div>

                <p className="mt-5 text-sm text-slate-400">
                  Weather
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.weather.condition}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Current atmospheric state
                </p>
              </div>
            </div>
          </div>

          {/* MARINE IMPACT */}

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#091827]/80 p-6">
            <div className="flex items-center gap-3">
              <Waves size={20} className="text-amber-400" />

              <div>
                <h3 className="font-semibold">
                  Marine Weather Impact
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Weather factors relevant to marine operations
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500">
                  Wind Conditions
                </p>

                <p className="mt-2 font-medium text-amber-300">
                  {marineData.weather.windSpeed} km/h
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Winds are currently coming from the{" "}
                  {marineData.weather.windDirection} direction.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500">
                  Visibility
                </p>

                <p className="mt-2 font-medium text-amber-300">
                  {marineData.weather.visibility} km
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Current visibility is suitable for normal
                  observation and navigation.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500">
                  Overall Weather
                </p>

                <p className="mt-2 font-medium text-amber-300">
                  {marineData.weather.condition}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Continue monitoring changing atmospheric
                  conditions during operations.
                </p>
              </div>
            </div>
          </div>

          {/* DATA SOURCE */}

          <div className="mt-8 rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-6">
            <div className="flex items-start gap-3">
              <CloudSun
                size={19}
                className="mt-0.5 text-amber-400"
              />

              <div>
                <h3 className="font-semibold">
                  Weather Data Status
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Weather information is currently synchronized
                  with the ORCA marine data layer. Last update:{" "}
                  {marineData.system.lastUpdated}.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}