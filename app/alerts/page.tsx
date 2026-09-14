"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Fish,
  Home,
  Map,
  Waves,
  Cloud,
  Navigation,
  Settings,
  FileText,
  Route,
  Info,
  ChevronDown,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

function MessageIcon(props: any) {
  return <span {...props}>▣</span>;
}

type Hazard = {
  type?: string;
  severity?: string;
  title?: string;
  message?: string;
  source?: string;
  observedAt?: string;
  confidence?: number | null;
  location?: string;
  value?: number | string | null;
  unit?: string | null;
};

type HazardResponse = {
  live?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  overallSeverity?: string;
  riskLevel?: string;
  recommendation?: string;
  generatedAt?: string;
  hazards?: Hazard[];
  alerts?: Hazard[];
  conditions?: {
    windSpeed?: number | null;
    waveHeight?: number | null;
    rainfall?: number | null;
  };
  sources?: Record<string, string>;
  dataAvailability?: Record<string, boolean>;
};

type StoredLocation = {
  name?: string;
  latitude: number;
  longitude: number;
};

function isValidCoordinate(value: unknown, min: number, max: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

const DEFAULT_LOCATION: StoredLocation = {
  name: "Visakhapatnam, India",
  latitude: 17.6935526,
  longitude: 83.2921297,
};

function readStoredLocation(): StoredLocation {
  if (typeof window === "undefined") {
    return DEFAULT_LOCATION;
  }

  try {
    const raw = window.localStorage.getItem("orca-location");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        isValidCoordinate(parsed?.latitude, -90, 90) &&
        isValidCoordinate(parsed?.longitude, -180, 180) &&
        !(Number(parsed.latitude) === 0 && Number(parsed.longitude) === 0)
      ) {
        return {
          name: parsed.name || "Selected location",
          latitude: Number(parsed.latitude),
          longitude: Number(parsed.longitude),
        };
      }
    }
  } catch {
    // Fall through to the cookie/default.
  }

  try {
    const match = document.cookie.match(/(?:^|; )orca-location=([^;]+)/);
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (
        isValidCoordinate(parsed?.latitude, -90, 90) &&
        isValidCoordinate(parsed?.longitude, -180, 180) &&
        !(Number(parsed.latitude) === 0 && Number(parsed.longitude) === 0)
      ) {
        return {
          name: parsed.name || "Selected location",
          latitude: Number(parsed.latitude),
          longitude: Number(parsed.longitude),
        };
      }
    }
  } catch {
    // Fall through to the safe default.
  }

  return DEFAULT_LOCATION;
}

function formatLocation(name?: string) {
  if (!name) return "Selected location";
  const parts = name.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}, ${parts[parts.length - 1]}`;
  return name;
}

function formatTime(value?: string) {
  if (!value) return "Latest available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function severityRank(severity?: string) {
  const value = String(severity || "").toUpperCase();
  if (value === "CRITICAL") return 4;
  if (value === "HIGH") return 3;
  if (value === "MODERATE" || value === "MEDIUM") return 2;
  if (value === "LOW") return 1;
  return 0;
}

function severityClass(severity?: string) {
  return severityRank(severity) >= 3 ? "high" : severityRank(severity) >= 2 ? "medium" : "low";
}

function statusLabel(severity?: string) {
  const value = String(severity || "LOW").toUpperCase();
  if (value === "CRITICAL") return "CRITICAL";
  if (value === "HIGH") return "HIGH";
  if (value === "MODERATE" || value === "MEDIUM") return "CAUTION";
  return "MONITOR";
}

function statusClass(severity?: string) {
  const rank = severityRank(severity);
  if (rank >= 3) return "red";
  if (rank === 2) return "caution";
  return "green";
}

function humanizeType(type?: string) {
  if (!type) return "Marine Hazard";
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type NavItem = {
  icon: any;
  label: string;
  href: string;
};

const baseNavItems: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: MessageIcon, label: "Ask ORCA", href: "/ask-orca" },
  { icon: Map, label: "Map Explorer", href: "/map-explorer" },
  { icon: Bell, label: "Alerts", href: "/alerts" },
  { icon: Fish, label: "Fisheries", href: "/fisheries" },
  { icon: Waves, label: "Ocean Conditions", href: "/ocean-conditions" },
  { icon: Cloud, label: "Weather", href: "/weather" },
  { icon: Navigation, label: "Tides", href: "/tides" },
  { icon: Info, label: "Advisories", href: "/advisories" },
  { icon: Route, label: "Routes & Planning", href: "/routes" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function Sidebar({ alertCount, location }: { alertCount: number; location: string }) {
  const navItems: Array<NavItem & { badge?: number }> = baseNavItems.map((item) =>
    item.href === "/alerts" ? { ...item, badge: alertCount } : item
  );

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="logo-row">
          <div className="orca-icon">🐋</div>
          <div className="logo">ORCA</div>
        </div>
        <div className="logo-subtitle">
          Marine Ecosystem
          <br />
          Reasoning with
          <br />
          Collaborative Agents
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item ${item.href === "/alerts" ? "active" : ""}`}
            >
              <span className="nav-icon"><Icon size={19} /></span>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="badge">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="theme-switch">
          <div className="theme">Light</div>
          <div className="theme selected">Dark</div>
        </div>

        <div className="user-card">
          <div className="user-avatar">👤</div>
          <div>
            <div className="user-name">Fisherman User</div>
            <div className="user-location">{location}</div>
          </div>
          <ChevronDown size={15} className="user-arrow" />
        </div>
      </div>
    </aside>
  );
}

export default function AlertsPage() {
  // Keep the first render deterministic for SSR/hydration.
  // Browser storage is read only after hydration in the effect below.
  const [selectedLocation, setSelectedLocation] = useState<StoredLocation>(DEFAULT_LOCATION);
  const [data, setData] = useState<HazardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHazards = async (location: StoredLocation) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/hazard?lat=${encodeURIComponent(location.latitude)}&lon=${encodeURIComponent(location.longitude)}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error(`Hazard API returned ${response.status}`);

      const json: HazardResponse = await response.json();
      if (!json.live) throw new Error("Live hazard data is unavailable");
      setData(json);
    } catch (err) {
      console.error("Unable to load live marine alerts:", err);
      setData(null);
      setError("Live marine alert data could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      const next = readStoredLocation();
      if (!cancelled) setSelectedLocation(next);
    };

    refresh();
    window.addEventListener("orca-location-changed", refresh);

    const interval = window.setInterval(refresh, 750);

    return () => {
      cancelled = true;
      window.removeEventListener("orca-location-changed", refresh);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    loadHazards(selectedLocation);
    const interval = window.setInterval(() => loadHazards(selectedLocation), 60_000);
    return () => window.clearInterval(interval);
  }, [selectedLocation.latitude, selectedLocation.longitude]);

  const hazards = useMemo(() => {
    const raw = Array.isArray(data?.hazards) ? data!.hazards : [];
    return [...raw].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  }, [data]);

  const highCount = hazards.filter((item) => severityRank(item.severity) >= 3).length;
  const moderateCount = hazards.filter((item) => severityRank(item.severity) === 2).length;
  const overallSeverity = data?.overallSeverity || data?.riskLevel || "LOW";
  const status = statusLabel(overallSeverity);
  const statusTone = statusClass(overallSeverity);
  const locationLabel = formatLocation(data?.location || selectedLocation.name);
  const wind = data?.conditions?.windSpeed;
  const wave = data?.conditions?.waveHeight;
  const rain = data?.conditions?.rainfall;

  const weatherStable =
    hazards.filter((item) => ["WIND", "WAVE", "HAZARDOUS_SEA", "HEAVY_RAIN", "THUNDERSTORM", "CYCLONE", "LIGHTNING"].includes(String(item.type || "").toUpperCase())).length === 0;

  return (
    <main className="dashboard">
      <Sidebar alertCount={hazards.length} location={locationLabel} />

      <section className="main">
        <header className="topbar">
          <div className="ask-area">
            <div className="ask-title">Marine Safety</div>
            <div className="ask-box">Active marine alerts and safety warnings</div>
          </div>

          <div className="location">
            <strong>📍 {locationLabel}</strong>
            <div className="date">Marine Alert Center</div>
          </div>
        </header>

        <div className="content-grid">
          <div className="left-content">
            <div className="stats">
              <div className="card stat-card">
                <div className="stat-title">Active Alerts</div>
                <div className="stat-value red">{loading ? "—" : hazards.length}</div>
                <div className="stat-small">{hazards.length ? "Requiring attention" : "No active hazards detected"}</div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">High Severity</div>
                <div className="stat-value caution">{loading ? "—" : highCount}</div>
                <div className="stat-small caution">{highCount ? "Immediate attention" : "No high-severity hazard"}</div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">Moderate</div>
                <div className="stat-value">{loading ? "—" : moderateCount}</div>
                <div className="stat-small">{moderateCount ? "Exercise caution" : "No moderate hazard"}</div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">Status</div>
                <div className={`stat-value ${statusTone}`}>{loading ? "—" : status}</div>
                <div className="stat-small">Live marine conditions monitored</div>
              </div>
            </div>

            <div className="card alerts">
              <div className="alert-header">
                <strong>Active Marine Alerts</strong>
                <span className="details">{locationLabel}</span>
              </div>

              {loading && <div className="alert-description">Loading live marine hazard data…</div>}

              {!loading && error && (
                <div className="alert medium">
                  <div className="alert-title-row">
                    <span>⚠ Live data unavailable</span>
                    <span className="severity">Unavailable</span>
                  </div>
                  <div className="alert-description">{error}</div>
                </div>
              )}

              {!loading && !error && hazards.length === 0 && (
                <div className="alert low">
                  <div className="alert-title-row">
                    <span>✓ No active marine hazards detected</span>
                    <span className="severity">Clear</span>
                  </div>
                  <div className="alert-description">
                    No wind, wave, rainfall, cyclone, lightning, or other hazard was reported for the selected location by the live hazard sources.
                  </div>
                  <div className="alert-time">Updated {formatTime(data?.generatedAt)}</div>
                </div>
              )}

              {!loading && !error && hazards.map((hazard, index) => (
                <div className={`alert ${severityClass(hazard.severity)}`} key={`${hazard.type || "hazard"}-${hazard.observedAt || index}`}>
                  <div className="alert-title-row">
                    <span>⚠ {hazard.title || humanizeType(hazard.type)}</span>
                    <span className="severity">{hazard.severity || "UNKNOWN"}</span>
                  </div>
                  <div className="alert-description">{hazard.message || "Live marine hazard reported at the selected location."}</div>
                  <div className="alert-time">
                    {hazard.location || locationLabel} · {formatTime(hazard.observedAt || data?.generatedAt)}
                  </div>
                </div>
              ))}
            </div>

            <div className="lower-grid">
              <div className="card info-card">
                <div className="info-title">Safety Guidance</div>
                <div className="info-subtitle">Recommended actions</div>

                <div className="metric">
                  <span>Small vessels</span>
                  <span className={highCount ? "red" : "green"}>{highCount ? "Exercise caution" : "Monitor"}</span>
                </div>
                <div className="metric">
                  <span>Fishing activity</span>
                  <span className={moderateCount || highCount ? "caution" : "green"}>{moderateCount || highCount ? "Monitor conditions" : "Favorable"}</span>
                </div>
                <div className="metric">
                  <span>Coastal operations</span>
                  <span className={severityRank(overallSeverity) >= 3 ? "red" : "green"}>{severityRank(overallSeverity) >= 3 ? "Exercise caution" : "Monitor"}</span>
                </div>
              </div>

              <div className="card info-card">
                <div className="info-title">Alert Intelligence</div>
                <div className="info-subtitle">Live conditions being monitored</div>
                <div className="metric"><span>Wind</span><span>{wind == null ? "Unavailable" : `${wind} km/h`}</span></div>
                <div className="metric"><span>Waves</span><span>{wave == null ? "Unavailable" : `${wave} m`}</span></div>
                <div className="metric"><span>Rainfall</span><span>{rain == null ? "Unavailable" : `${rain} mm`}</span></div>
                <div className="metric"><span>Weather</span><span className={weatherStable ? "green" : "caution"}>{weatherStable ? "Stable" : "Hazard detected"}</span></div>
              </div>

              <div className="card info-card">
                <div className="info-title">ORCA Monitoring</div>
                <div className="info-subtitle">Marine intelligence status</div>
                <div className="metric"><span>Data monitoring</span><span className="green">{loading ? "Loading" : "Active"}</span></div>
                <div className="metric"><span>Safety assessment</span><span className="green">{data ? "Active" : "Waiting"}</span></div>
                <div className="metric"><span>Alert generation</span><span className="green">{data ? "Active" : "Waiting"}</span></div>
              </div>
            </div>
          </div>

          <aside className="right-column">
            <div className="card recommendation">
              <div className="panel-heading">
                <span><ShieldAlert size={15} /> Current Safety Status</span>
                <span className={`status-pill ${statusTone}`}>{loading ? "LOADING" : status}</span>
              </div>

              <div className="recommendation-main">
                {loading ? "Assessing live marine conditions…" : data?.recommendation || "Monitor current marine conditions before operating."}
              </div>

              <div className="recommendation-description">
                {data?.recommendation
                  ? `Current ORCA assessment for ${locationLabel}, based on the live hazard data and available marine observations.`
                  : "Check the latest marine conditions before beginning any offshore activity."}
              </div>

              <div className="divider" />

              <div className="reasons-title"><span>Alert Factors</span></div>
              <div className="metric"><span>Wind</span><span>{wind == null ? "Unavailable" : `${wind} km/h`}</span></div>
              <div className="metric"><span>Wave height</span><span>{wave == null ? "Unavailable" : `${wave} m`}</span></div>
              <div className="metric"><span>Rainfall</span><span>{rain == null ? "Unavailable" : `${rain} mm`}</span></div>
              <div className="metric"><span>Active hazards</span><span className={hazards.length ? "caution" : "green"}>{loading ? "—" : hazards.length}</span></div>
            </div>

            <div className="card recommendation">
              <div className="panel-heading">
                <span><AlertTriangle size={15} /> Important</span>
              </div>
              <div className="recommendation-description">
                Live sources: {data?.sources ? Object.values(data.sources).filter(Boolean).join(" · ") : "Loading live marine sources…"}.
              </div>
              <div className="recommendation-description" style={{ marginTop: 10 }}>
                Last assessment: {formatTime(data?.generatedAt)}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
