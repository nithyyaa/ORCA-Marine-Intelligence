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
  User,
  Palette,
  BellRing,
  MapPinned,
  Languages,
  Database,
  Shield,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { useState } from "react";

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
  { label: "Reports", href: "/reports", icon: FileText },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    active: true,
  },
];

function Toggle({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`relative h-6 w-11 rounded-full transition ${
        enabled ? "bg-violet-500" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-white/10 bg-[#071525]">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
            <Settings size={21} className="text-violet-400" />
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

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [marineAlerts, setMarineAlerts] = useState(true);
  const [fishingAlerts, setFishingAlerts] = useState(true);
  const [location, setLocation] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [language, setLanguage] = useState("English");
  const [units, setUnits] = useState("Metric");

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />

      <main className="ml-[272px] min-h-screen">
        <header className="flex h-20 items-center justify-between border-b border-white/10 px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400">
              Preferences
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Settings
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <MapPin size={15} className="text-violet-400" />
            Visakhapatnam, India
          </div>
        </header>

        <section className="mx-auto max-w-[1100px] px-8 py-8">

          <div className="mb-8">
            <h2 className="text-3xl font-semibold">
              Settings
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Customize your ORCA experience, notifications and
              marine intelligence preferences.
            </p>
          </div>

          {/* PROFILE */}

          <div className="rounded-2xl border border-white/10 bg-[#091827] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10">
                <User size={21} className="text-violet-400" />
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Account
                </p>

                <h3 className="mt-1 font-semibold">
                  Profile & location
                </h3>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">
                  Display name
                </label>

                <div className="mt-2 rounded-xl border border-white/10 bg-[#071525] px-4 py-3 text-sm">
                  Fisherman User
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  Operating location
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#071525] px-4 py-3 text-sm">
                  <MapPin
                    size={16}
                    className="text-violet-400"
                  />

                  Visakhapatnam, India
                </div>
              </div>
            </div>
          </div>

          {/* APPEARANCE */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#091827] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10">
                <Palette
                  size={21}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Interface
                </p>

                <h3 className="mt-1 font-semibold">
                  Appearance
                </h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {["Dark", "Light", "System"].map((theme) => (
                <button
                  key={theme}
                  className={`flex items-center justify-between rounded-xl border px-4 py-4 text-sm ${
                    theme === "Dark"
                      ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                      : "border-white/10 bg-[#071525] text-slate-500"
                  }`}
                >
                  <span>{theme}</span>

                  {theme === "Dark" && (
                    <Check size={16} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* NOTIFICATIONS */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#091827] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10">
                <BellRing
                  size={21}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Alerts
                </p>

                <h3 className="mt-1 font-semibold">
                  Notification preferences
                </h3>
              </div>
            </div>

            <div className="mt-6 divide-y divide-white/10">

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">
                    Push notifications
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Receive important ORCA notifications.
                  </p>
                </div>

                <Toggle
                  enabled={notifications}
                  setEnabled={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">
                    Weather alerts
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Get notified about significant weather changes.
                  </p>
                </div>

                <Toggle
                  enabled={weatherAlerts}
                  setEnabled={setWeatherAlerts}
                />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">
                    Marine safety alerts
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Receive warnings about hazardous sea conditions.
                  </p>
                </div>

                <Toggle
                  enabled={marineAlerts}
                  setEnabled={setMarineAlerts}
                />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">
                    Fishing zone alerts
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Get updates about potential fishing zones.
                  </p>
                </div>

                <Toggle
                  enabled={fishingAlerts}
                  setEnabled={setFishingAlerts}
                />
              </div>

            </div>
          </div>

          {/* MAP & LOCATION */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#091827] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10">
                <MapPinned
                  size={21}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Location services
                </p>

                <h3 className="mt-1 font-semibold">
                  Map & location
                </h3>
              </div>
            </div>

            <div className="mt-6 divide-y divide-white/10">

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">
                    Use current location
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Allow ORCA to use your operating location.
                  </p>
                </div>

                <Toggle
                  enabled={location}
                  setEnabled={setLocation}
                />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">
                    Automatic data refresh
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Refresh marine information automatically.
                  </p>
                </div>

                <Toggle
                  enabled={autoRefresh}
                  setEnabled={setAutoRefresh}
                />
              </div>

            </div>
          </div>

          {/* UNITS */}

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <div className="rounded-2xl border border-white/10 bg-[#091827] p-6">
              <div className="flex items-center gap-3">
                <SlidersHorizontal
                  size={19}
                  className="text-violet-400"
                />

                <h3 className="font-semibold">
                  Units
                </h3>
              </div>

              <p className="mt-2 text-xs text-slate-600">
                Choose how measurements are displayed.
              </p>

              <div className="mt-5 flex gap-2">
                {["Metric", "Imperial"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setUnits(item)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm ${
                      units === item
                        ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                        : "border-white/10 bg-[#071525] text-slate-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#091827] p-6">
              <div className="flex items-center gap-3">
                <Languages
                  size={19}
                  className="text-violet-400"
                />

                <h3 className="font-semibold">
                  Language
                </h3>
              </div>

              <p className="mt-2 text-xs text-slate-600">
                Select your preferred interface language.
              </p>

              <div className="relative mt-5">
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#071525] px-4 py-3 text-sm text-white outline-none"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Telugu</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"
                />
              </div>
            </div>

          </div>

          {/* DATA */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#091827] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10">
                <Database
                  size={21}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Data
                </p>

                <h3 className="mt-1 font-semibold">
                  Marine data preferences
                </h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                <p className="text-xs text-slate-600">
                  Satellite data
                </p>

                <p className="mt-2 text-sm font-medium">
                  Enabled
                </p>

                <p className="mt-1 text-[11px] text-green-400">
                  Available
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                <p className="text-xs text-slate-600">
                  Oceanographic data
                </p>

                <p className="mt-2 text-sm font-medium">
                  Enabled
                </p>

                <p className="mt-1 text-[11px] text-green-400">
                  Available
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#071525] p-4">
                <p className="text-xs text-slate-600">
                  Weather data
                </p>

                <p className="mt-2 text-sm font-medium">
                  Enabled
                </p>

                <p className="mt-1 text-[11px] text-green-400">
                  Available
                </p>
              </div>

            </div>
          </div>

          {/* PRIVACY */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#091827] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-400/10">
                <Shield
                  size={19}
                  className="text-green-400"
                />
              </div>

              <div>
                <h3 className="font-semibold">
                  Privacy & security
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your location and marine activity preferences
                  are used to provide relevant recommendations,
                  alerts and route intelligence.
                </p>
              </div>
            </div>
          </div>

          {/* SAVE */}

          <div className="mt-7 flex items-center justify-between rounded-2xl border border-violet-400/10 bg-violet-400/[0.025] p-5">
            <div>
              <p className="text-sm font-medium">
                Preferences are saved automatically
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Your ORCA interface will use these settings.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-green-400">
              <Check size={15} />
              Saved
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}