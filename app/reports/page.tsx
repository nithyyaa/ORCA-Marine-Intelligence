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
  Download,
  FileBarChart,
  Clock3,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Search,
  Thermometer,
  Wind,
  Eye,
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
  { label: "Routes & Planning", href: "/routes", icon: Route },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    active: true,
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

const reports = [
  {
    title: "Daily Marine Intelligence Report",
    type: "Daily Brief",
    date: "Sep 1, 2026",
    time: "06:00 AM",
    area: `${marineData.location.name} Coast`,
    status: "Ready",
    description:
      "Integrated summary of ocean conditions, weather, tides, fishing zones and marine safety.",
  },
  {
    title: "Fishing Zone Assessment",
    type: "Fisheries",
    date: "Aug 31, 2026",
    time: "04:30 PM",
    area: `Offshore ${marineData.location.name}`,
    status: "Ready",
    description:
      "Assessment of potential fishing zones using SST, chlorophyll and surrounding marine conditions.",
  },
  {
    title: "Marine Safety Assessment",
    type: "Safety",
    date: "Aug 31, 2026",
    time: "01:15 PM",
    area: `${marineData.location.name} Coast`,
    status: "Ready",
    description:
      "Operational safety assessment based on wave conditions, wind and current advisories.",
  },
];

const metrics = [
  {
    label: "Reports generated",
    value: "24",
    change: "+6 this month",
  },
  {
    label: "Areas analyzed",
    value: "12",
    change: "Across coastal zones",
  },
  {
    label: "Data sources",
    value: "08",
    change: "Active sources",
  },
  {
    label: "Latest report",
    value: "18m",
    change: "Updated recently",
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10">
            <FileBarChart size={21} className="text-sky-400" />
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
                  ? "border-l-2 border-sky-400 bg-sky-400/10 text-sky-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  item.active
                    ? "text-sky-400"
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

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

      <main className="ml-[272px] min-h-screen">
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#06111f] px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-400">
              Intelligence Archive
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Marine Reports
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-sky-400" />
            {marineData.location.name}, {marineData.location.country}
          </div>
        </header>

        <section className="mx-auto max-w-[1250px] px-8 py-8">

          {/* PAGE HEADER */}

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm text-slate-500">
                Intelligence & analysis
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                Marine intelligence reports
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Review generated marine assessments and consolidated
                intelligence for operational planning.
              </p>
            </div>

            <button className="flex w-fit items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-400">
              <FileBarChart size={17} />
              Generate report
            </button>
          </div>

          {/* METRICS */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5"
              >
                <p className="text-xs text-slate-500">
                  {metric.label}
                </p>

                <div className="mt-2 flex items-end gap-3">
                  <p className="text-3xl font-semibold">
                    {metric.value}
                  </p>

                  <ArrowUpRight
                    size={16}
                    className="mb-1 text-green-400"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  {metric.change}
                </p>
              </div>
            ))}
          </div>

          {/* FEATURED REPORT */}

          <div className="mt-8 overflow-hidden rounded-[26px] border border-sky-400/10 bg-gradient-to-br from-sky-400/[0.07] via-[#0a1828] to-[#091522]">
            <div className="grid lg:grid-cols-[1fr_0.7fr]">
              <div className="p-7 lg:p-9">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-sky-400">
                  <Sparkles size={15} />
                  Featured report
                </div>

                <h3 className="mt-4 text-2xl font-semibold">
                  Daily Marine Intelligence Report
                </h3>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  A consolidated assessment combining ocean
                  conditions, weather, tides, fisheries intelligence
                  and current safety advisories for{" "}
                  {marineData.location.name}.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                    <CalendarDays size={14} />
                    Sep 1, 2026
                  </span>

                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                    <Clock3 size={14} />
                    06:00 AM
                  </span>

                  <span className="rounded-full bg-green-400/10 px-3 py-2 text-xs text-green-400">
                    Ready
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-400">
                    <FileText size={16} />
                    View report
                  </button>

                  <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06]">
                    <Download size={16} />
                    Export PDF
                  </button>
                </div>
              </div>

              <div className="relative hidden min-h-[270px] overflow-hidden border-l border-white/10 lg:block">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.16),transparent_55%)]" />

                <div className="absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sky-400/20">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-sky-400/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/10">
                      <FileBarChart
                        size={27}
                        className="text-sky-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute left-8 top-10 rounded-xl border border-white/10 bg-[#071525]/80 px-3 py-2">
                  <p className="text-[10px] text-slate-600">
                    Parameters
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    07 analyzed
                  </p>
                </div>

                <div className="absolute bottom-10 right-8 rounded-xl border border-white/10 bg-[#071525]/80 px-3 py-2">
                  <p className="text-[10px] text-slate-600">
                    Confidence
                  </p>

                  <p className="mt-1 text-sm font-medium text-green-400">
                    High
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CURRENT CONDITIONS */}

          <div className="mt-9">
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-400">
                Current data
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Conditions included in reports
              </h3>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
                <Thermometer
                  size={19}
                  className="text-cyan-400"
                />

                <p className="mt-5 text-xs text-slate-500">
                  Sea Surface Temperature
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.ocean.sst}°C
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
                <Waves
                  size={19}
                  className="text-blue-400"
                />

                <p className="mt-5 text-xs text-slate-500">
                  Wave Height
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.ocean.waveHeight} m
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
                <Wind
                  size={19}
                  className="text-sky-400"
                />

                <p className="mt-5 text-xs text-slate-500">
                  Wind Speed
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.weather.windSpeed}
                  <span className="ml-1 text-sm text-slate-500">
                    km/h
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-5">
                <Eye
                  size={19}
                  className="text-green-400"
                />

                <p className="mt-5 text-xs text-slate-500">
                  Visibility
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {marineData.weather.visibility}
                  <span className="ml-1 text-sm text-slate-500">
                    km
                  </span>
                </p>
              </div>

            </div>
          </div>

          {/* REPORT LIBRARY */}

          <div className="mt-9">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs uppercase tracking-widest text-sky-400">
                  Report library
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  Recent reports
                </h3>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <Search size={15} className="text-slate-600" />

                <span className="text-sm text-slate-600">
                  Search reports
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {reports.map((report) => (
                <div
                  key={report.title}
                  className="rounded-2xl border border-white/10 bg-[#091827]/70 p-6 transition hover:border-sky-400/20"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/10">
                        <FileText
                          size={20}
                          className="text-sky-400"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="font-semibold">
                            {report.title}
                          </h4>

                          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-500">
                            {report.type}
                          </span>
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-500">
                          {report.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={13} />
                            {report.date}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <Clock3 size={13} />
                            {report.time}
                          </span>

                          <span>{report.area}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:shrink-0">
                      <span className="flex items-center gap-1.5 rounded-full bg-green-400/10 px-3 py-1.5 text-xs text-green-400">
                        <CheckCircle2 size={13} />
                        {report.status}
                      </span>

                      <button className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-slate-400 hover:bg-white/[0.06] hover:text-white">
                        <Download size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPORT CONTENT */}

          <div className="mt-9 grid gap-5 lg:grid-cols-2">

            <div className="rounded-2xl border border-white/10 bg-[#091827]/70 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10">
                  <FileBarChart
                    size={19}
                    className="text-sky-400"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Report composition
                  </p>

                  <h3 className="font-semibold">
                    What ORCA analyzes
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  [
                    "Ocean conditions",
                    `SST ${marineData.ocean.sst}°C, chlorophyll & sea state`,
                  ],
                  [
                    "Weather",
                    `Wind ${marineData.weather.windSpeed} km/h, visibility & forecast`,
                  ],
                  [
                    "Tides",
                    "High / low tide cycles",
                  ],
                  [
                    "Fisheries",
                    "Potential fishing zones",
                  ],
                  [
                    "Safety",
                    "Hazards & advisories",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"
                  >
                    <span className="text-sm text-slate-300">
                      {label}
                    </span>

                    <span className="text-right text-xs text-slate-600">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-sky-400/10 bg-sky-400/[0.025] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10">
                <Sparkles
                  size={19}
                  className="text-sky-400"
                />
              </div>

              <p className="mt-5 text-xs uppercase tracking-widest text-sky-400">
                ORCA synthesis
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Turning observations into intelligence
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                ORCA combines information from multiple marine
                domains into a single operational assessment, helping
                users understand not only what is happening, but what
                it could mean for their next decision.
              </p>

              <div className="mt-6 rounded-xl border border-white/10 bg-[#071525]/60 p-4">
                <p className="text-xs text-slate-600">
                  Latest synthesis
                </p>

                <p className="mt-2 text-sm leading-5 text-slate-400">
                  Offshore conditions currently show{" "}
                  {marineData.ocean.seaState.toLowerCase()} sea
                  conditions with wave height around{" "}
                  {marineData.ocean.waveHeight} m. Weather conditions
                  remain suitable for continued monitoring and
                  operational planning.
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER NOTE */}

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <InfoIcon />

            <p className="text-xs leading-5 text-slate-600">
              Reports shown here are generated from available marine
              datasets and system assessments. Always verify current
              conditions and official safety guidance before
              operational decisions.
            </p>
          </div>

        </section>
      </main>
    </div>
  );
}

function InfoIcon() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
      <Clock3 size={15} className="text-slate-500" />
    </div>
  );
}