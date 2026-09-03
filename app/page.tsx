"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
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
  Send,
  ChevronDown,
} from "lucide-react";

const MarineMap = dynamic(
  () => import("@/components/MarineMap"),
  {
    ssr: false,
  }
);

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: MessageIcon, label: "Ask ORCA", href: "/ask-orca" },
  { icon: Map, label: "Map Explorer", href: "/map-explorer" },
  { icon: Bell, label: "Alerts", href: "/alerts", badge: 3 },
  { icon: Fish, label: "Fisheries", href: "/fisheries" },
  { icon: Waves, label: "Ocean Conditions", href: "/ocean-conditions" },
  { icon: Cloud, label: "Weather", href: "/weather" },
  { icon: Navigation, label: "Tides", href: "/tides" },
  { icon: Info, label: "Advisories", href: "/advisories" },
  { icon: Route, label: "Routes & Planning", href: "/routes" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function MessageIcon(props: any) {
  return <span {...props}>▣</span>;
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
              className={`nav-item ${
                item.href === "/" ? "active" : ""
              }`}
            >
              <span className="nav-icon">
                <Icon size={19} />
              </span>

              <span>{item.label}</span>

              {item.badge && (
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
            <div className="user-location">
              Visakhapatnam, India
            </div>
          </div>

          <ChevronDown size={15} className="user-arrow" />
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const [locationName, setLocationName] = useState(
    "Visakhapatnam, India"
  );

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateLocation = () => {
      try {
        const locationCookie = document.cookie
          .split("; ")
          .find((cookie) =>
            cookie.startsWith("orca-location=")
          );

        if (locationCookie) {
          const encodedValue = locationCookie.substring(
            "orca-location=".length
          );

          const location = JSON.parse(
            decodeURIComponent(encodedValue)
          );

          if (location?.name) {
            setLocationName(location.name);
          }
        }
      } catch (error) {
        console.error(
          "Unable to read location:",
          error
        );
      }
    };

    const updateTime = () => {
      const now = new Date();

      const date = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

      const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

      setCurrentTime(
        `${date} | ${time} IST`
      );
    };

    updateLocation();
    updateTime();

    const interval = setInterval(
      updateTime,
      1000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="ask-area">
        <div className="ask-title">Ask ORCA</div>

        <div className="ask-box">
          Is it safe to go fishing tomorrow morning at 6 AM from this
          location?

          <button className="send-button">
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className="location">
        <strong>📍 {locationName}</strong>

        <div className="date">
          {currentTime}
        </div>
      </div>
    </header>
  );
}

type DashboardData = {
  safety: any;
  weather: any;
  ocean: any;
  tide: any;
  pfz: any;
};

function formatValue(value: unknown, suffix = "") {
  return value === null || value === undefined || value === ""
    ? "Unavailable"
    : `${value}${suffix}`;
}

function seaStateFromWave(waveHeight: unknown) {
  if (typeof waveHeight !== "number") return "Unavailable";
  if (waveHeight < 1) return "Calm";
  if (waveHeight < 1.5) return "Slight";
  if (waveHeight < 2.5) return "Moderate";
  return "Rough";
}

function tideState(tides: any[]) {
  if (!Array.isArray(tides) || tides.length === 0) return "Unavailable";
  const heights = tides
    .map((t) => Number(t?.height))
    .filter((v) => Number.isFinite(v));
  if (!heights.length) return "Unavailable";
  const max = Math.max(...heights);
  if (max < 1) return "Low";
  if (max < 2) return "Moderate";
  return "High";
}

function formatTideTime(value: unknown) {
  if (!value) return "Unavailable";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function findPfzCandidate(value: any): any | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPfzCandidate(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== "object") return null;

  const lat = value.latitude ?? value.lat;
  const lon = value.longitude ?? value.lon ?? value.lng;

  if (
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lon))
  ) {
    return value;
  }

  for (const key of Object.keys(value)) {
    const found = findPfzCandidate(value[key]);
    if (found) return found;
  }

  return null;
}

function getPfzInfo(pfz: any) {
  const candidate = findPfzCandidate(pfz);
  if (!candidate) {
    return { distance: "Unavailable", direction: "Unavailable" };
  }

  const distance =
    candidate.distanceKm ??
    candidate.distance ??
    candidate.distance_km;

  const direction =
    candidate.direction ??
    candidate.bearingDirection ??
    candidate.bearing;

  return {
    distance:
      distance === undefined || distance === null
        ? "Available"
        : `${Number(distance).toFixed(1)} km`,
    direction:
      direction === undefined || direction === null
        ? "Available"
        : String(direction),
  };
}

function deriveRiskFromData(safety: any, weather: any, ocean: any) {
  if (typeof safety?.safetyScore === "number") {
    return safety.safetyScore;
  }

  const wind = Number(weather?.windSpeed);
  const wave = Number(ocean?.waveHeight);

  let score = 90;
  if (wind > 30 || wave > 2.5) score = 35;
  else if (wind > 20 || wave > 1.5) score = 65;

  return score;
}

function riskLabel(score: number) {
  if (score >= 75) return "LOW";
  if (score >= 50) return "MODERATE";
  if (score >= 25) return "HIGH";
  return "CRITICAL";
}

function Stats({ data }: { data: DashboardData | null }) {
  const safetyScore = deriveRiskFromData(
    data?.safety,
    data?.weather,
    data?.ocean
  );
  const risk = data?.safety?.risk ?? riskLabel(safetyScore);
  const recommendation =
    risk === "CRITICAL" || risk === "HIGH"
      ? "NOT SAFE"
      : risk === "MODERATE"
      ? "CAUTION"
      : "SAFE";

  const pfz = getPfzInfo(data?.pfz);
  const alertCount = [
    Number(data?.weather?.windSpeed) > 20,
    Number(data?.ocean?.waveHeight) > 1.5,
    risk === "HIGH" || risk === "CRITICAL",
  ].filter(Boolean).length;

  return (
    <div className="stats">
      <div className="card stat-card">
        <div className="stat-title">
          Overall Recommendation
        </div>

        <div className="stat-value caution">
          {data ? recommendation : "—"}
        </div>

        <div className="stat-small caution">
          {data ? `Risk: ${risk}` : "Loading marine data..."}
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">
          Risk Score
        </div>

        <div className="risk-row">
          <div className="risk-circle">
            {data ? Math.round(safetyScore) : "—"}
          </div>

          <div>
            <div>
              <strong>
                {data ? Math.round(safetyScore) : "—"}
              </strong>
              <span className="muted">
                {data ? " /100" : ""}
              </span>
            </div>

            <div className="stat-small caution">
              {data ? `${risk} Risk` : "Loading"}
            </div>
          </div>
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">
          Suitable Window
        </div>

        <div className="stat-value">
          Unavailable
        </div>

        <div className="stat-small">
          Forecast-based window
        </div>

        <div className="stat-small green">
          Scenario engine not connected yet
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">
          Nearest PFZ
        </div>

        <div className="stat-value">
          {pfz.distance}
        </div>

        <div className="stat-small green">
          {pfz.direction}
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">
          Active Alerts
        </div>

        <div className="stat-value red">
          {data ? alertCount : "—"}
        </div>

        <div className="stat-small">
          <span className="green">
            View Alerts →
          </span>
        </div>
      </div>
    </div>
  );
}

function Recommendation({ data }: { data: DashboardData | null }) {
  const windSpeed = data?.weather?.windSpeed;
  const waveHeight = data?.ocean?.waveHeight;
  const safetyScore = deriveRiskFromData(
    data?.safety,
    data?.weather,
    data?.ocean
  );
  const risk = data?.safety?.risk ?? riskLabel(safetyScore);

  const reasons = [
    [
      "Wave Height",
      formatValue(waveHeight, " m"),
      typeof waveHeight === "number" && waveHeight > 1.5 ? "up" : "ok",
    ],
    [
      "Wind Speed",
      formatValue(windSpeed, " km/h"),
      typeof windSpeed === "number" && windSpeed > 20 ? "up" : "ok",
    ],
    [
      "Tide",
      tideState(data?.tide?.tides),
      "ok",
    ],
    [
      "Weather",
      data?.weather ? "Forecast available" : "Unavailable",
      data?.weather ? "ok" : "up",
    ],
    ["Lightning Risk", "Unavailable", "up"],
    ["Cyclone Warning", "Unavailable", "up"],
  ];

  const status =
    risk === "CRITICAL" || risk === "HIGH"
      ? "NOT SAFE"
      : risk === "MODERATE"
      ? "CAUTION"
      : "SAFE";

  const recommendation =
    data?.safety?.recommendation ??
    (risk === "CRITICAL" || risk === "HIGH"
      ? "Fishing is not recommended under the current marine conditions."
      : risk === "MODERATE"
      ? "Exercise caution and monitor marine conditions before departure."
      : "Current marine conditions appear favourable based on available data.");

  return (
    <div className="card recommendation">
      <div className="panel-heading">
        <span>
          ORCA Recommendation{" "}
          <Info size={12} />
        </span>

        <span className="status-pill">
          {status}
        </span>
      </div>

      <div className="recommendation-main">
        {recommendation}
      </div>

      <div className="recommendation-description">
        Based on the marine data currently available for the selected location.
      </div>

      <div className="divider" />

      <div className="reasons-title">
        <span>Key Reasons</span>
        <span className="details">
          View Details →
        </span>
      </div>

      {reasons.map(
        ([name, value, statusValue]) => (
          <div
            className="metric"
            key={name}
          >
            <span>{name}</span>

            <span className="metric-value">
              {value}{" "}
              {statusValue === "up" ? (
                <span className="red">
                  ↑
                </span>
              ) : (
                <span className="green">
                  ✓
                </span>
              )}
            </span>
          </div>
        )
      )}
    </div>
  );
}

function InfoCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card info-card">
      <div className="info-title">
        {title}
      </div>

      <div className="info-subtitle">
        {subtitle}
      </div>

      {children}
    </div>
  );
}

function LowerCards({ data }: { data: DashboardData | null }) {
  const ocean = data?.ocean;
  const weather = data?.weather;
  const tides = Array.isArray(data?.tide?.tides)
    ? data.tide.tides
    : [];

  const nextLow = tides.find((t: any) =>
    String(t?.type ?? "").toLowerCase().includes("low")
  );
  const nextHigh = tides.find((t: any) =>
    String(t?.type ?? "").toLowerCase().includes("high")
  );

  return (
    <div className="lower-grid">
      <InfoCard
        title="Ocean Conditions"
        subtitle="Current"
      >
        <div className="metric">
          <span>〰 Wave Height</span>
          <span>
            {formatValue(ocean?.waveHeight, " m")}{" "}
            {typeof ocean?.waveHeight === "number" && ocean.waveHeight > 1.5 ? (
              <span className="red">↑</span>
            ) : (
              <span className="green">✓</span>
            )}
          </span>
        </div>

        <div className="metric">
          <span>≋ Sea State</span>
          <span>{seaStateFromWave(ocean?.waveHeight)}</span>
        </div>

        <div className="metric">
          <span>
            ♨ Sea Surface Temp.
          </span>

          <span>
            {formatValue(ocean?.sst, " °C")}
          </span>
        </div>

        <div className="metric">
          <span>
            〰 Current Speed
          </span>

          <span>
            {formatValue(ocean?.oceanCurrentVelocity, " m/s")}
          </span>
        </div>

        <div className="more">
          More Details →
        </div>
      </InfoCard>

      <InfoCard
        title="Weather Forecast"
        subtitle="Current"
      >
        <div className="metric">
          <span>〰 Wind Speed</span>

          <span>
            {formatValue(weather?.windSpeed, " km/h")}{" "}
            {typeof weather?.windSpeed === "number" && weather.windSpeed > 20 ? (
              <span className="red">↑</span>
            ) : (
              <span className="green">✓</span>
            )}
          </span>
        </div>

        <div className="metric">
          <span>
            ⌁ Wind Direction
          </span>

          <span>
            {formatValue(weather?.windDirection, "°")}
          </span>
        </div>

        <div className="metric">
          <span>☁ Rain Probability</span>
          <span>
            {formatValue(weather?.precipitationProbability, " %")}
          </span>
        </div>

        <div className="metric">
          <span>☁ Weather Code</span>
          <span>
            {formatValue(weather?.weatherCode)}
          </span>
        </div>

        <div className="more">
          More Details →
        </div>
      </InfoCard>

      <InfoCard
        title="Tide Information"
        subtitle="Available tide events"
      >
        <div className="tide-chart">
          <div className="wave" />

          <div className="tide-dot dot1" />
          <div className="tide-dot dot2" />
          <div className="tide-dot dot3" />
          <div className="tide-dot dot4" />
          <div className="tide-dot dot5" />
          <div className="tide-dot dot6" />
        </div>

        <div className="metric">
          <span>
            {nextLow ? `Low · ${formatTideTime(nextLow.time)}` : "Low · Unavailable"}
          </span>

          <span>
            {nextLow ? formatValue(nextLow.height, " m") : "Unavailable"}
          </span>
        </div>

        <div className="metric">
          <span>
            {nextHigh ? `High · ${formatTideTime(nextHigh.time)}` : "High · Unavailable"}
          </span>

          <span>
            {nextHigh ? formatValue(nextHigh.height, " m") : "Unavailable"}
          </span>
        </div>

        <div className="more">
          More Details →
        </div>
      </InfoCard>
    </div>
  );
}

function Alerts({ data }: { data: DashboardData | null }) {
  const wind = Number(data?.weather?.windSpeed);
  const wave = Number(data?.ocean?.waveHeight);
  const risk = data?.safety?.risk ?? riskLabel(
    deriveRiskFromData(data?.safety, data?.weather, data?.ocean)
  );

  const alerts = [
    wind > 20
      ? {
          className: "alert high",
          title: "⚠ Strong Wind Condition",
          severity: "High",
          description: `Wind speed is ${wind.toFixed(1)} km/h at the selected location`,
        }
      : null,
    wave > 1.5
      ? {
          className: "alert medium",
          title: "⚠ Elevated Wave Condition",
          severity: "Medium",
          description: `Wave height is ${wave.toFixed(2)} m at the selected location`,
        }
      : null,
    risk === "HIGH" || risk === "CRITICAL"
      ? {
          className: "alert medium",
          title: "⚠ Marine Safety Alert",
          severity: risk,
          description: "Current safety assessment indicates elevated marine risk",
        }
      : null,
  ].filter(Boolean) as {
    className: string;
    title: string;
    severity: string;
    description: string;
  }[];

  return (
    <div className="card alerts">
      <div className="alert-header">
        <strong>
          Active Alerts ({data ? alerts.length : "—"})
        </strong>

        <span className="details">
          View All →
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="alert medium">
          <div className="alert-title-row">
            <span>✓ No derived marine alerts</span>
            <span className="severity">Low</span>
          </div>
          <div className="alert-description">
            No alert threshold was triggered by the currently available data.
          </div>
        </div>
      ) : (
        alerts.map((alert, index) => (
          <div className={alert.className} key={`${alert.title}-${index}`}>
            <div className="alert-title-row">
              <span>{alert.title}</span>
              <span className="severity">{alert.severity}</span>
            </div>

            <div className="alert-description">
              {alert.description}
            </div>

            <div className="alert-time">
              Current data
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DataSources() {
  return (
    <div className="card sources">
      <span className="source-title">
        Data Sources
      </span>

      <span className="source">
        INCOIS
      </span>

      <span className="source">
        ISRO EOS
      </span>

      <span className="source">
        IMD
      </span>

      <span className="source">
        NOAA
      </span>

      <span className="source">
        GFS
      </span>

      <span className="source">
        OpenStreetMap
      </span>

      <button className="more-source">
        + More
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        let pfzUrl = "/api/pfz";

        try {
          const locationCookie = document.cookie
            .split("; ")
            .find((cookie) => cookie.startsWith("orca-location="));

          if (locationCookie) {
            const location = JSON.parse(
              decodeURIComponent(
                locationCookie.substring("orca-location=".length)
              )
            );

            if (
              Number.isFinite(Number(location?.latitude)) &&
              Number.isFinite(Number(location?.longitude))
            ) {
              pfzUrl =
                `/api/pfz?lat=${encodeURIComponent(location.latitude)}` +
                `&lon=${encodeURIComponent(location.longitude)}`;
            }
          }
        } catch {
          // Keep the default PFZ endpoint if the location cookie cannot be read.
        }

        const responses = await Promise.all([
          fetch("/api/safety", { cache: "no-store" }),
          fetch("/api/weather", { cache: "no-store" }),
          fetch("/api/ocean", { cache: "no-store" }),
          fetch("/api/tide", { cache: "no-store" }),
          fetch(pfzUrl, { cache: "no-store" }),
        ]);

        const [safety, weather, ocean, tide, pfz] = await Promise.all(
          responses.map(async (response) => {
            try {
              return await response.json();
            } catch {
              return null;
            }
          })
        );

        if (active) {
          setDashboardData({
            safety,
            weather,
            ocean,
            tide,
            pfz,
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard marine data:", error);
      }
    }

    loadDashboardData();

    const interval = setInterval(loadDashboardData, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="dashboard">
      <Sidebar />

      <section className="main">
        <Header />

        <div className="content-grid">
          <div className="left-content">
            <Stats data={dashboardData} />

            <div className="map-row">
              <MarineMap />
            </div>

            <LowerCards data={dashboardData} />

            <DataSources />
          </div>

          <aside className="right-column">
            <Recommendation data={dashboardData} />
            <Alerts data={dashboardData} />
          </aside>
        </div>
      </section>
    </main>
  );
}
