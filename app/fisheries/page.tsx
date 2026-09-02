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

const fishingZones = marineData.fisheries;

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

export default function FisheriesPage() {
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
  value={marineData.fisheries.length.toString()}
  subtitle="Potential zones detected"
/>

            <StatCard
  icon={Thermometer}
  title="Sea Surface Temperature"
  value={`${marineData.ocean.sst}°C`}
  subtitle="Suitable temperature range"
/>
<StatCard
  icon={Waves}
  title="Sea State"
  value={marineData.ocean.seaState}
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
              {marineData.fisheries.length} zones found
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {fishingZones.map((zone) => (
              <div
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
                        <p className="text-xs font-medium text-emerald-400">
                          {zone.id}
                        </p>

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
                      {zone.suitability} Suitability
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Sea Surface Temperature
                    </p>
                    <p className="mt-1 font-medium">{zone.sst}</p>
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
                        zone.safety === "Good"
                          ? "mt-1 font-medium text-emerald-400"
                          : "mt-1 font-medium text-yellow-400"
                      }
                    >
                      {zone.safety}
                    </p>
                  </div>

                  <div className="flex items-end justify-start lg:justify-end">
                    <button className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20">
                      View Zone →
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                  ORCA evaluates sea surface temperature, chlorophyll
                  concentration, distance from the operating location,
                  ocean conditions and marine safety information to rank
                  suitable fishing areas.
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