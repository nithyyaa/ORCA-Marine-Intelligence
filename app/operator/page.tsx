"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Home,
  Map,
  Bell,
  Fish,
  Waves,
  Cloud,
  Navigation,
  Info,
  Route,
  FileText,
  Settings,
  BarChart3,
  Ship,
  AlertTriangle,
  ShieldCheck,
  Clock3,
  Gauge,
  Database,
  RefreshCw,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: "message", label: "Ask ORCA", href: "/ask-orca" },
  { icon: Map, label: "Map Explorer", href: "/map-explorer" },
  { icon: Bell, label: "Alerts", href: "/alerts", badge: 3 },
  { icon: Fish, label: "Fisheries", href: "/fisheries" },
  { icon: Waves, label: "Ocean Conditions", href: "/ocean-conditions" },
  { icon: Cloud, label: "Weather", href: "/weather" },
  { icon: Navigation, label: "Tides", href: "/tides" },
  { icon: Info, label: "Advisories", href: "/advisories" },
  { icon: Route, label: "Routes & Planning", href: "/routes" },
  { icon: Navigation, label: "What-If Scenarios", href: "/scenarios" },
  { icon: BarChart3, label: "Researcher Analytics", href: "/researcher" },
  { icon: Ship, label: "Maritime Operator", href: "/operator" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

type AnyRecord = Record<string, any>;

function MessageIcon() {
  return <span>▣</span>;
}

function Sidebar() {
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
              className={`nav-item ${item.href === "/operator" ? "active" : ""}`}
            >
              <span className="nav-icon">
                {Icon === "message" ? <MessageIcon /> : <Icon size={19} />}
              </span>

              <span>{item.label}</span>

              {item.badge && <span className="badge">{item.badge}</span>}
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
            <div className="user-name">Maritime Operator</div>
            <div className="user-location">Marine Operations</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function numberOrNull(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function textOrUnavailable(value: any): string {
  return value === null || value === undefined || value === ""
    ? "Unavailable"
    : String(value);
}

function riskClass(risk: string | null) {
  const value = String(risk ?? "").toUpperCase();

  if (value === "LOW") return "ok";
  if (value === "MODERATE") return "moderate";
  if (value === "HIGH" || value === "CRITICAL") return "danger";
  return "unavailable";
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  status,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  status?: string;
  className?: string;
}) {
  return (
    <div className={`operator-metric ${className}`}>
      <div className="operator-metric-icon">{icon}</div>
      <div className="operator-metric-body">
        <span>{label}</span>
        <strong>
          {value}
          {unit && value !== "Unavailable" ? ` ${unit}` : ""}
        </strong>
        {status && <small>{status}</small>}
      </div>
    </div>
  );
}

function RouteRow({
  route,
  recommended,
}: {
  route: AnyRecord;
  recommended: boolean;
}) {
  const risk = textOrUnavailable(route?.riskLevel ?? route?.risk);
  const distance = numberOrNull(route?.distanceKm ?? route?.distance);
  const eta = numberOrNull(
    route?.estimatedTimeMinutes ?? route?.etaMinutes ?? route?.travelTimeMinutes
  );
  const exposure = textOrUnavailable(
    route?.hazardExposure ?? route?.exposure
  );

  return (
    <div className={`operator-route-row ${recommended ? "recommended" : ""}`}>
      <div className="operator-route-main">
        <div className="operator-route-title">
          <strong>{textOrUnavailable(route?.name)}</strong>
          {recommended && <span className="recommended-tag">RECOMMENDED</span>}
        </div>
        <span>{textOrUnavailable(route?.tag)}</span>
      </div>

      <div className="operator-route-value">
        <small>Distance</small>
        <strong>{distance !== null ? `${distance.toFixed(1)} km` : "Unavailable"}</strong>
      </div>

      <div className="operator-route-value">
        <small>ETA</small>
        <strong>{eta !== null ? `${eta} min` : "Unavailable"}</strong>
      </div>

      <div className={`operator-route-value ${riskClass(risk)}`}>
        <small>Risk</small>
        <strong>{risk}</strong>
      </div>

      <div className="operator-route-value">
        <small>Exposure</small>
        <strong>{exposure}</strong>
      </div>
    </div>
  );
}

export default function MaritimeOperatorDashboard() {
  const [destination, setDestination] = useState("");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeData, setRouteData] = useState<AnyRecord | null>(null);

  const [data, setData] = useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadOperationalData() {
    try {
      setLoading(true);

      const responses = await Promise.allSettled([
        fetch("/api/safety", { cache: "no-store" }),
        fetch("/api/weather", { cache: "no-store" }),
        fetch("/api/ocean", { cache: "no-store" }),
        fetch("/api/tide", { cache: "no-store" }),
        fetch("/api/hazard", { cache: "no-store" }),
        fetch("/api/geofence", { cache: "no-store" }),
      ]);

      const values = await Promise.all(
        responses.map(async (result) => {
          if (result.status !== "fulfilled" || !result.value.ok) return null;
          try {
            return await result.value.json();
          } catch {
            return null;
          }
        })
      );

      setData({
        safety: values[0],
        weather: values[1],
        ocean: values[2],
        tide: values[3],
        hazards: values[4],
        geofence: values[5],
      });

      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOperationalData();

    const interval = window.setInterval(loadOperationalData, 30000);
    return () => window.clearInterval(interval);
  }, []);

  async function calculateRoute() {
    const trimmed = destination.trim();

    if (!trimmed) {
      setRouteError("Enter a destination to calculate a route.");
      setRouteData(null);
      return;
    }

    try {
      setLoadingRoute(true);
      setRouteError("");

      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ destination: trimmed }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to calculate route.");
      }

      setRouteData(result);
    } catch (error) {
      setRouteData(null);
      setRouteError(
        error instanceof Error
          ? error.message
          : "Unable to calculate route."
      );
    } finally {
      setLoadingRoute(false);
    }
  }

  const safety = data?.safety ?? {};
  const weather = data?.weather ?? {};
  const ocean = data?.ocean ?? {};
  const hazards = data?.hazards ?? {};
  const geofence = data?.geofence ?? {};

  const safetyScore = numberOrNull(
    safety?.safetyScore ?? safety?.score
  );
  const risk = textOrUnavailable(safety?.risk ?? safety?.riskLevel);
  const confidence = numberOrNull(safety?.confidence);

  const wind = numberOrNull(
    weather?.windSpeed ?? weather?.current?.windSpeed
  );
  const wave = numberOrNull(
    ocean?.waveHeight ?? ocean?.current?.waveHeight
  );
  const seaState = ocean?.seaState ?? ocean?.current?.seaState;
  const rainfall = numberOrNull(
    weather?.rainfall ?? weather?.precipitation
  );

  const hazardAlerts: AnyRecord[] = Array.isArray(hazards?.alerts)
    ? hazards.alerts
    : Array.isArray(hazards?.hazards)
      ? hazards.hazards
      : [];

  const activeHazards = hazardAlerts.filter(
    (item) =>
      String(item?.severity ?? item?.riskLevel ?? "").toUpperCase() !==
      "LOW"
  );

  const geofenceInside =
    geofence?.inside ??
    geofence?.withinBoundary ??
    geofence?.status === "INSIDE";

  const routes: AnyRecord[] = useMemo(() => {
    const candidates =
      routeData?.routes ??
      routeData?.routeAlternatives ??
      routeData?.alternatives ??
      [];

    if (Array.isArray(candidates)) return candidates;

    if (routeData?.route) return [routeData.route];

    return [];
  }, [routeData]);

  const recommendedRoute =
    routeData?.recommendedRoute ??
    routeData?.recommendation?.route ??
    routes.find(
      (route) =>
        String(route?.name ?? "").toLowerCase().includes("safest")
    )?.name;

  return (
    <main className="dashboard">
      <Sidebar />

      <section className="main">
        <header className="operator-header">
          <div>
            <div className="operator-eyebrow">
              MARINE INTELLIGENCE · OPERATIONS
            </div>
            <h1>Maritime Operator Dashboard</h1>
            <p>
              Weather-aware navigation, sea-state monitoring and
              risk-aware route planning using ORCA operational evidence.
            </p>
          </div>

          <div className="operator-header-status">
            <div className="operator-live-dot" />
            <div>
              <strong>OPERATIONAL VIEW</strong>
              <span>
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString("en-IN")}`
                  : "Loading operational data"}
              </span>
            </div>
            <button
              className="operator-refresh"
              onClick={loadOperationalData}
              disabled={loading}
              title="Refresh operational data"
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
            </button>
          </div>
        </header>

        <div className="operator-content">
          <section className="operator-metrics-grid">
            <MetricCard
              icon={<Ship size={19} />}
              label="Vessel Monitoring"
              value="Unavailable"
              status="AIS / telemetry not connected"
              className="unavailable"
            />

            <MetricCard
              icon={<ShieldCheck size={19} />}
              label="Marine Safety"
              value={
                safetyScore !== null ? String(safetyScore) : "Unavailable"
              }
              unit={safetyScore !== null ? "/ 100" : undefined}
              status={risk}
              className={riskClass(risk)}
            />

            <MetricCard
              icon={<Cloud size={19} />}
              label="Wind"
              value={wind !== null ? wind.toFixed(1) : "Unavailable"}
              unit="km/h"
              status="Open-Meteo"
            />

            <MetricCard
              icon={<Waves size={19} />}
              label="Wave Height"
              value={wave !== null ? wave.toFixed(2) : "Unavailable"}
              unit="m"
              status="Open-Meteo Marine"
            />

            <MetricCard
              icon={<AlertTriangle size={19} />}
              label="Active Hazards"
              value={String(activeHazards.length)}
              status={
                activeHazards.length > 0
                  ? "Review before departure"
                  : "No elevated hazard alerts"
              }
              className={activeHazards.length > 0 ? "danger" : "ok"}
            />

            <MetricCard
              icon={<Navigation size={19} />}
              label="Geofence"
              value={
                geofenceInside === true
                  ? "INSIDE EEZ"
                  : geofenceInside === false
                    ? "OUTSIDE EEZ"
                    : "Unavailable"
              }
              status={
                geofence?.distanceToBoundaryKm !== null &&
                geofence?.distanceToBoundaryKm !== undefined
                  ? `${Number(geofence.distanceToBoundaryKm).toFixed(2)} km to boundary`
                  : "Boundary status"
              }
              className={
                geofenceInside === true
                  ? "ok"
                  : geofenceInside === false
                    ? "danger"
                    : "unavailable"
              }
            />
          </section>

          <div className="operator-grid">
            <section className="operator-card operations-card">
              <div className="operator-card-header">
                <div>
                  <div className="operator-kicker">CURRENT OPERATIONS</div>
                  <h2>Operating Conditions</h2>
                  <p>Live evidence for the selected operating location.</p>
                </div>
                <Gauge size={20} />
              </div>

              <div className="condition-grid">
                <div>
                  <span>Marine Risk</span>
                  <strong className={riskClass(risk)}>{risk}</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>
                    {confidence !== null ? `${confidence}%` : "Unavailable"}
                  </strong>
                </div>
                <div>
                  <span>Sea State</span>
                  <strong>{textOrUnavailable(seaState)}</strong>
                </div>
                <div>
                  <span>Rainfall</span>
                  <strong>
                    {rainfall !== null ? `${rainfall}` : "Unavailable"}
                    {rainfall !== null ? " mm" : ""}
                  </strong>
                </div>
              </div>

              <div className="operator-evidence">
                <div className="evidence-item">
                  <Database size={15} />
                  <div>
                    <span>Weather</span>
                    <strong>Open-Meteo</strong>
                  </div>
                </div>
                <div className="evidence-item">
                  <Waves size={15} />
                  <div>
                    <span>Ocean</span>
                    <strong>Open-Meteo Marine</strong>
                  </div>
                </div>
                <div className="evidence-item">
                  <ShieldCheck size={15} />
                  <div>
                    <span>Safety Model</span>
                    <strong>
                      {safety?.prototypeModel ? "Prototype model" : "Available"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="operator-card hazards-card">
              <div className="operator-card-header">
                <div>
                  <div className="operator-kicker">SAFETY AWARENESS</div>
                  <h2>Active Hazards</h2>
                  <p>Hazards reported by the existing ORCA hazard feed.</p>
                </div>
                <AlertTriangle size={20} />
              </div>

              {activeHazards.length === 0 ? (
                <div className="empty-state">
                  <ShieldCheck size={24} />
                  <strong>No elevated hazards reported</strong>
                  <span>
                    This does not mean unavailable inputs are safe conditions.
                  </span>
                </div>
              ) : (
                <div className="hazard-list">
                  {activeHazards.slice(0, 5).map((hazard, index) => (
                    <div className="operator-hazard" key={index}>
                      <div>
                        <strong>
                          {textOrUnavailable(
                            hazard?.title ?? hazard?.type ?? hazard?.name
                          )}
                        </strong>
                        <span>
                          {textOrUnavailable(
                            hazard?.message ?? hazard?.description
                          )}
                        </span>
                      </div>
                      <b>
                        {textOrUnavailable(
                          hazard?.severity ?? hazard?.riskLevel
                        )}
                      </b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="operator-card route-card">
            <div className="operator-card-header route-header">
              <div>
                <div className="operator-kicker">RISK-AWARE NAVIGATION</div>
                <h2>Route Planning</h2>
                <p>
                  Calculate route alternatives using the existing ORCA route
                  service.
                </p>
              </div>
              <Route size={20} />
            </div>

            <div className="route-input-row">
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") calculateRoute();
                }}
                placeholder="Enter destination"
              />
              <button onClick={calculateRoute} disabled={loadingRoute}>
                {loadingRoute ? "Calculating..." : "Calculate Route"}
              </button>
            </div>

            {routeError && <div className="route-error">{routeError}</div>}

            {routes.length > 0 && (
              <div className="route-table">
                <div className="route-table-head">
                  <span>Route</span>
                  <span>Distance</span>
                  <span>ETA</span>
                  <span>Risk</span>
                  <span>Exposure</span>
                </div>

                {routes.map((route, index) => (
                  <RouteRow
                    key={route?.id ?? route?.name ?? index}
                    route={route}
                    recommended={
                      String(route?.name) === String(recommendedRoute) ||
                      Boolean(route?.recommended)
                    }
                  />
                ))}
              </div>
            )}

            {routeData && routes.length === 0 && routeData.route && (
              <div className="single-route-result">
                <strong>{textOrUnavailable(routeData.route.name)}</strong>
                <span>
                  {numberOrNull(routeData.route.distanceKm) !== null
                    ? `${Number(routeData.route.distanceKm).toFixed(1)} km`
                    : "Distance unavailable"}
                  {" · "}
                  {numberOrNull(routeData.route.estimatedTimeMinutes) !== null
                    ? `${Number(routeData.route.estimatedTimeMinutes)} min`
                    : "ETA unavailable"}
                  {" · "}
                  {textOrUnavailable(routeData.route.riskLevel)}
                </span>
              </div>
            )}

            {!routeData && (
              <div className="route-placeholder">
                <Route size={22} />
                <strong>Enter a destination to compare routes</strong>
                <span>
                  The existing route service will provide the available
                  alternatives and their operational metrics.
                </span>
              </div>
            )}
          </section>

          <div className="operator-bottom-grid">
            <section className="operator-card recommendation-card">
              <div className="operator-kicker">OPERATIONAL RECOMMENDATION</div>
              <h2>
                {safetyScore === null
                  ? "Marine conditions unavailable"
                  : risk === "HIGH" || risk === "CRITICAL"
                    ? "Exercise caution before departure"
                    : risk === "MODERATE"
                      ? "Proceed with caution"
                      : "Conditions comparatively favourable"}
              </h2>
              <p>
                {safetyScore === null
                  ? "Do not assume safe conditions when required marine evidence is unavailable."
                  : "Use the safety assessment together with current hazards, geofence status and route alternatives before making an operational decision."}
              </p>

              <div className="recommendation-tags">
                <span>SAFETY</span>
                <span>WEATHER</span>
                <span>OCEAN</span>
                <span>ROUTING</span>
              </div>
            </section>

            <section className="operator-card freshness-card">
              <div className="operator-card-header">
                <div>
                  <div className="operator-kicker">EVIDENCE STATUS</div>
                  <h2>Operational Data</h2>
                </div>
                <Clock3 size={19} />
              </div>

              <div className="freshness-row">
                <span>Last dashboard refresh</span>
                <strong>
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString("en-IN")
                    : "Unavailable"}
                </strong>
              </div>
              <div className="freshness-row">
                <span>Safety confidence</span>
                <strong>
                  {confidence !== null ? `${confidence}%` : "Unavailable"}
                </strong>
              </div>
              <div className="freshness-row">
                <span>Vessel telemetry</span>
                <strong className="unavailable">NOT CONNECTED</strong>
              </div>
              <div className="freshness-row">
                <span>Live route calculation</span>
                <strong className={routeData ? "ok" : "unavailable"}>
                  {routeData ? "AVAILABLE" : "READY"}
                </strong>
              </div>
            </section>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .operator-header {
          min-height: 118px;
          padding: 10px 8px 22px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }

        .operator-eyebrow {
          color: #5f88ac;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.8px;
          margin-bottom: 8px;
        }

        .operator-header h1 {
          margin: 0;
          color: #f5f9ff;
          font-size: 29px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }

        .operator-header p {
          margin: 8px 0 0;
          max-width: 700px;
          color: #8299ad;
          font-size: 13px;
          line-height: 1.5;
        }

        .operator-header-status {
          min-width: 225px;
          border: 1px solid #183149;
          border-radius: 10px;
          padding: 11px 12px;
          background: rgba(7, 25, 42, 0.72);
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .operator-header-status strong {
          display: block;
          color: #dce9f4;
          font-size: 10px;
          letter-spacing: 0.6px;
        }

        .operator-header-status span {
          display: block;
          margin-top: 4px;
          color: #71879c;
          font-size: 9px;
        }

        .operator-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2ee88b;
          box-shadow: 0 0 10px rgba(46, 232, 139, 0.35);
          flex-shrink: 0;
        }

        .operator-refresh {
          margin-left: auto;
          width: 28px;
          height: 28px;
          border: 1px solid #183149;
          border-radius: 7px;
          background: #091b2b;
          color: #6e8da7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .operator-refresh:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .spin {
          animation: operator-spin 0.9s linear infinite;
        }

        @keyframes operator-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .operator-content {
          padding: 0 8px 30px;
        }

        .operator-metrics-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }

        .operator-metric {
          min-height: 104px;
          border: 1px solid #183149;
          border-radius: 12px;
          background: #071a2a;
          padding: 13px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .operator-metric-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(47, 140, 255, 0.09);
          color: #55aef2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .operator-metric-body {
          min-width: 0;
        }

        .operator-metric-body > span {
          display: block;
          color: #71879c;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.55px;
        }

        .operator-metric-body strong {
          display: block;
          margin-top: 5px;
          color: #edf5fb;
          font-size: 16px;
          line-height: 1.2;
        }

        .operator-metric-body small {
          display: block;
          margin-top: 5px;
          color: #617b91;
          font-size: 8px;
          line-height: 1.3;
        }

        .operator-metric.ok .operator-metric-icon,
        .operator-metric-body .ok {
          color: #2ee88b;
        }

        .operator-metric.moderate .operator-metric-icon,
        .operator-metric-body .moderate {
          color: #ffd02d;
        }

        .operator-metric.danger .operator-metric-icon,
        .operator-metric-body .danger {
          color: #ff6670;
        }

        .operator-metric.unavailable .operator-metric-icon,
        .operator-metric-body .unavailable {
          color: #ff6670;
        }

        .operator-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .operator-card {
          border: 1px solid #183149;
          border-radius: 14px;
          background: #071a2a;
          overflow: hidden;
        }

        .operator-card-header {
          padding: 17px 18px 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #122b40;
          color: #4e82aa;
        }

        .operator-card-header h2 {
          margin: 0;
          color: #f1f7fd;
          font-size: 17px;
          font-weight: 600;
        }

        .operator-card-header p {
          margin: 5px 0 0;
          color: #71879c;
          font-size: 10px;
        }

        .operator-kicker {
          color: #4e82aa;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-bottom: 5px;
        }

        .condition-grid {
          padding: 15px 18px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 9px;
        }

        .condition-grid > div {
          border: 1px solid #153149;
          border-radius: 9px;
          padding: 11px;
          background: #081e31;
        }

        .condition-grid span {
          display: block;
          color: #668198;
          font-size: 9px;
          margin-bottom: 6px;
        }

        .condition-grid strong {
          color: #eaf3fb;
          font-size: 13px;
        }

        .condition-grid strong.ok {
          color: #2ee88b;
        }

        .condition-grid strong.moderate {
          color: #ffd02d;
        }

        .condition-grid strong.danger {
          color: #ff6670;
        }

        .condition-grid strong.unavailable {
          color: #ff6670;
        }

        .operator-evidence {
          padding: 0 18px 17px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .evidence-item {
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid #10283b;
          padding-top: 10px;
          color: #4e82aa;
        }

        .evidence-item span,
        .evidence-item strong {
          display: block;
        }

        .evidence-item span {
          color: #617b91;
          font-size: 8px;
        }

        .evidence-item strong {
          margin-top: 2px;
          color: #dce9f4;
          font-size: 9px;
        }

        .empty-state {
          min-height: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          text-align: center;
          color: #2ee88b;
        }

        .empty-state strong {
          color: #dce9f4;
          font-size: 12px;
        }

        .empty-state span {
          max-width: 260px;
          color: #71879c;
          font-size: 9px;
          line-height: 1.5;
        }

        .hazard-list {
          padding: 9px;
        }

        .operator-hazard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px;
          border: 1px solid #183149;
          border-radius: 9px;
          margin-bottom: 6px;
          background: #081e31;
        }

        .operator-hazard strong {
          display: block;
          color: #eaf3fb;
          font-size: 10px;
        }

        .operator-hazard span {
          display: block;
          margin-top: 3px;
          color: #71879c;
          font-size: 8px;
          line-height: 1.4;
        }

        .operator-hazard b {
          color: #ff6670;
          font-size: 8px;
          flex-shrink: 0;
        }

        .route-card {
          margin-bottom: 12px;
        }

        .route-input-row {
          padding: 14px 18px;
          display: flex;
          gap: 9px;
        }

        .route-input-row input {
          flex: 1;
          min-width: 0;
          border: 1px solid #23445e;
          border-radius: 8px;
          background: #081e31;
          color: #eaf3fb;
          padding: 11px 12px;
          outline: none;
          font-size: 11px;
        }

        .route-input-row input:focus {
          border-color: #2f8cff;
        }

        .route-input-row button {
          border: 1px solid #2b6693;
          border-radius: 8px;
          background: #0d3554;
          color: #dcefff;
          padding: 0 15px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .route-input-row button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .route-error {
          margin: 0 18px 12px;
          border: 1px solid rgba(255, 102, 112, 0.25);
          border-radius: 8px;
          background: rgba(255, 102, 112, 0.05);
          color: #ff7b84;
          padding: 9px 11px;
          font-size: 9px;
        }

        .route-table {
          padding: 0 9px 10px;
        }

        .route-table-head {
          display: grid;
          grid-template-columns: 2fr 0.9fr 0.8fr 0.8fr 1fr;
          gap: 8px;
          padding: 8px 11px;
          color: #506d84;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .operator-route-row {
          display: grid;
          grid-template-columns: 2fr 0.9fr 0.8fr 0.8fr 1fr;
          gap: 8px;
          align-items: center;
          border: 1px solid #17344c;
          border-radius: 9px;
          background: #081e31;
          padding: 10px 11px;
          margin-bottom: 6px;
        }

        .operator-route-row.recommended {
          border-color: #2b5777;
          background: linear-gradient(
            90deg,
            rgba(24, 68, 105, 0.7),
            rgba(9, 31, 49, 0.8)
          );
        }

        .operator-route-title {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .operator-route-main strong {
          color: #eaf3fb;
          font-size: 10px;
        }

        .operator-route-main > span {
          display: block;
          margin-top: 3px;
          color: #6f879c;
          font-size: 8px;
        }

        .recommended-tag {
          color: #2ee88b;
          border: 1px solid rgba(46, 232, 139, 0.2);
          border-radius: 4px;
          padding: 3px 5px;
          font-size: 7px;
          font-weight: 700;
        }

        .operator-route-value small {
          display: block;
          color: #617b91;
          font-size: 7px;
        }

        .operator-route-value strong {
          display: block;
          margin-top: 3px;
          color: #dce9f4;
          font-size: 9px;
        }

        .operator-route-value.ok strong {
          color: #2ee88b;
        }

        .operator-route-value.moderate strong {
          color: #ffd02d;
        }

        .operator-route-value.danger strong {
          color: #ff6670;
        }

        .operator-route-value.unavailable strong {
          color: #ff6670;
        }

        .route-placeholder {
          min-height: 125px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #4e82aa;
          text-align: center;
        }

        .route-placeholder strong {
          color: #dce9f4;
          font-size: 11px;
        }

        .route-placeholder span {
          color: #71879c;
          font-size: 9px;
        }

        .single-route-result {
          margin: 0 18px 16px;
          border: 1px solid #23445e;
          border-radius: 9px;
          padding: 12px;
          background: #081e31;
        }

        .single-route-result strong {
          display: block;
          color: #eaf3fb;
          font-size: 11px;
        }

        .single-route-result span {
          display: block;
          margin-top: 5px;
          color: #71879c;
          font-size: 9px;
        }

        .operator-bottom-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 12px;
        }

        .recommendation-card {
          padding: 18px;
        }

        .recommendation-card h2 {
          margin: 0;
          color: #edf5fb;
          font-size: 17px;
          font-weight: 600;
        }

        .recommendation-card p {
          max-width: 720px;
          margin: 8px 0 14px;
          color: #71879c;
          font-size: 10px;
          line-height: 1.55;
        }

        .recommendation-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .recommendation-tags span {
          border: 1px solid #183149;
          border-radius: 5px;
          padding: 5px 7px;
          color: #7894aa;
          font-size: 7px;
          font-weight: 700;
        }

        .freshness-card {
          padding-bottom: 8px;
        }

        .freshness-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 18px;
          border-bottom: 1px solid #10283b;
        }

        .freshness-row span {
          color: #668198;
          font-size: 9px;
        }

        .freshness-row strong {
          color: #dce9f4;
          font-size: 9px;
          text-align: right;
        }

        .freshness-row strong.ok {
          color: #2ee88b;
        }

        .freshness-row strong.unavailable {
          color: #ff6670;
        }

        @media (max-width: 1250px) {
          .operator-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 1050px) {
          .operator-grid,
          .operator-bottom-grid {
            grid-template-columns: 1fr;
          }

          .operator-header {
            flex-direction: column;
          }

          .operator-header-status {
            width: 100%;
          }
        }

        @media (max-width: 800px) {
          .operator-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .condition-grid,
          .operator-evidence {
            grid-template-columns: 1fr 1fr;
          }

          .route-table-head {
            display: none;
          }

          .operator-route-row {
            grid-template-columns: 1fr 1fr;
          }

          .operator-route-main {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 600px) {
          .operator-metrics-grid {
            grid-template-columns: 1fr;
          }

          .condition-grid,
          .operator-evidence {
            grid-template-columns: 1fr;
          }

          .route-input-row {
            flex-direction: column;
          }

          .route-input-row button {
            min-height: 38px;
          }
        }
      `}</style>
    </main>
  );
}
