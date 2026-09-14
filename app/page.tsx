"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { fuseMarineEvidence } from "@/lib/marine/data-fusion";
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
  BookOpen,
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
  { icon: Navigation, label: "What-If Scenarios", href: "/scenarios" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: BookOpen, label: "Knowledge Base", href: "/knowledge" },
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

    const locationChanged = () => updateLocation();
    window.addEventListener("orca-location-changed", locationChanged);

    const timeInterval = setInterval(updateTime, 1000);
    const locationInterval = setInterval(updateLocation, 750);

    return () => {
      window.removeEventListener("orca-location-changed", locationChanged);
      clearInterval(timeInterval);
      clearInterval(locationInterval);
    };
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
  hazards: any;
  geofence: any;
  chlorophyll: any;
  fusion: ReturnType<typeof fuseMarineEvidence> | null;
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

function sourceFreshness(value: any): { label: "FRESH" | "AGING" | "UNAVAILABLE"; className: string } {
  if (!value) return { label: "UNAVAILABLE", className: "red" };
  const explicit = String(value?.status ?? "").toUpperCase();
  if (explicit === "FRESH") return { label: "FRESH", className: "green" };
  if (explicit === "AGING") return { label: "AGING", className: "caution" };

  const timestamp = value?.timestamp ?? value?.time ?? value?.updatedAt ?? value?.updated ?? value?.observedAt;
  if (!timestamp) return { label: "FRESH", className: "green" };
  const parsed = new Date(String(timestamp));
  if (Number.isNaN(parsed.getTime())) return { label: "FRESH", className: "green" };
  const ageMinutes = (Date.now() - parsed.getTime()) / 60000;
  if (ageMinutes <= 60) return { label: "FRESH", className: "green" };
  if (ageMinutes <= 180) return { label: "AGING", className: "caution" };
  return { label: "UNAVAILABLE", className: "red" };
}

function FreshBadge({ value }: { value: any }) {
  const status = sourceFreshness(value);
  return <span className={`stat-small ${status.className}`}>{status.label}</span>;
}

function chlorophyllDisplay(chlorophyll: any) {
  if (chlorophyll?.value !== undefined && chlorophyll?.value !== null) {
    return `${Number(chlorophyll.value).toFixed(2)} mg/m³`;
  }
  return "Unavailable";
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
        <div className="stat-title">Active Hazards</div>
        <div className="stat-value red">
          {data ? (Array.isArray(data.hazards?.hazards) ? data.hazards.hazards.length : 0) : "—"}
        </div>
        <div className="stat-small">
          {data?.hazards?.live ? "Live hazard feed" : "No live hazard data"}
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">Chlorophyll</div>
        <div className="stat-value">{chlorophyllDisplay(data?.chlorophyll)}</div>
        <div className="stat-small">Historical prototype source</div>
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

  const confidence =
    data?.safety?.confidence ??
    data?.safety?.confidenceScore ??
    "Unavailable";

  const generatedAt =
    data?.safety?.generatedAt ??
    data?.safety?.timestamp ??
    data?.weather?.generatedAt ??
    data?.weather?.timestamp ??
    null;

  const reasons = [
    [
      "Wave Height",
      formatValue(waveHeight, " m"),
      typeof waveHeight === "number" && waveHeight > 1.5
        ? "up"
        : "ok",
    ],
    [
      "Wind Speed",
      formatValue(windSpeed, " km/h"),
      typeof windSpeed === "number" && windSpeed > 20
        ? "up"
        : "ok",
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
    [
      "Lightning Risk",
      "Unavailable",
      "up",
    ],
    [
      "Cyclone Warning",
      "Unavailable",
      "up",
    ],
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

  const explanation =
    risk === "CRITICAL" || risk === "HIGH"
      ? "The recommendation is driven by elevated marine risk factors in the available observations and forecast data."
      : risk === "MODERATE"
      ? "The recommendation is based on the available wind, wave, tide and weather conditions. Some hazard inputs are currently unavailable."
      : "The recommendation is based on the currently available marine conditions for the selected location.";

  const sourceList = [
    data?.weather ? "Open-Meteo Weather" : null,
    data?.ocean ? "Open-Meteo Marine" : null,
    data?.tide ? "Open-Meteo Marine Tide" : null,
    data?.safety ? "ORCA Safety Model" : null,
  ].filter(Boolean);

  const waveValue =
    typeof waveHeight === "number" ? Math.max(0, waveHeight) : null;

  const windValue =
    typeof windSpeed === "number" ? Math.max(0, windSpeed) : null;

  const waveBar =
    waveValue === null
      ? 0
      : Math.min(100, (waveValue / 2.5) * 100);

  const windBar =
    windValue === null
      ? 0
      : Math.min(100, (windValue / 40) * 100);

  return (
    <div className="card recommendation">
      <div className="panel-heading">
        <span>
          ORCA Recommendation <Info size={12} />
        </span>

        <span className="status-pill">
          {status}
        </span>
      </div>

      <div className="recommendation-main">
        {recommendation}
      </div>

      <div className="recommendation-description">
        {explanation}
      </div>

      <div className="divider" />

      <div className="reasons-title">
        <span>Why this recommendation?</span>
      </div>

      {reasons.map(([name, value, statusValue]) => (
        <div className="metric" key={name}>
          <span>{name}</span>

          <span className="metric-value">
            {value}{" "}
            {statusValue === "up" ? (
              <span className="red">↑</span>
            ) : (
              <span className="green">✓</span>
            )}
          </span>
        </div>
      ))}

      <div className="divider" />

      <div className="reasons-title">
        <span>Visual Evidence</span>
      </div>

      <div style={{ marginTop: "12px" }}>
        <div style={{ marginBottom: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
              fontSize: "12px",
            }}
          >
            <span className="muted">Wave Height</span>
            <span>
              {waveValue !== null
                ? `${waveValue.toFixed(2)} m`
                : "Unavailable"}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              height: "7px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${waveBar}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  waveValue !== null && waveValue > 1.5
                    ? "#ef4444"
                    : "#22c55e",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "5px",
              fontSize: "10px",
              color: "#64748b",
            }}
          >
            Caution threshold: 1.5 m
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
              fontSize: "12px",
            }}
          >
            <span className="muted">Wind Speed</span>
            <span>
              {windValue !== null
                ? `${windValue.toFixed(1)} km/h`
                : "Unavailable"}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              height: "7px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${windBar}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  windValue !== null && windValue > 20
                    ? "#ef4444"
                    : "#22c55e",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "5px",
              fontSize: "10px",
              color: "#64748b",
            }}
          >
            Caution threshold: 20 km/h
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="reasons-title">
        <span>Confidence</span>
        <span className="details">
          {typeof confidence === "number"
            ? `${confidence}%`
            : confidence}
        </span>
      </div>

      <div className="recommendation-description">
        Confidence reflects the availability of the inputs used by the
        ORCA safety assessment.
      </div>

      <div className="divider" />

      <div className="reasons-title">
        <span>Sources</span>
      </div>

      {sourceList.length > 0 ? (
        sourceList.map((source) => (
          <div className="metric" key={String(source)}>
            <span>{source}</span>
            <span className="metric-value">
              Available <span className="green">✓</span>
            </span>
          </div>
        ))
      ) : (
        <div className="recommendation-description">
          Source information unavailable.
        </div>
      )}

      <div className="recommendation-description">
        Timestamp:{" "}
        {generatedAt
          ? new Date(String(generatedAt)).toLocaleString("en-IN")
          : "Unavailable"}
      </div>
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
        <FreshBadge value={ocean} />
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
          <span>↗ Wave Direction</span>
          <span>
            {formatValue(ocean?.waveDirection, "°")}
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
          <span>🟢 Chlorophyll</span>
          <span>{chlorophyllDisplay(data?.chlorophyll)}</span>
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
        <FreshBadge value={weather} />
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
        <FreshBadge value={data?.tide} />
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

function freshnessFromData(value: any, kind: string) {
  if (!value) return { status: "UNAVAILABLE", ageMinutes: null };

  const explicit = String(value?.status ?? "").toUpperCase();
  if (explicit === "FRESH" || explicit === "AGING" || explicit === "UNAVAILABLE") {
    return {
      status: explicit,
      ageMinutes: Number.isFinite(Number(value?.ageMinutes)) ? Number(value.ageMinutes) : null,
    };
  }

  // Geofence uses a static Marine Regions dataset. Its dataset date is the
  // authoritative freshness marker, so an older dataset is shown as AGING.
  if (kind === "Geofence" && value?.datasetDate) {
    const t = new Date(String(value.datasetDate)).getTime();
    if (Number.isFinite(t)) {
      const ageMinutes = Math.max(0, (Date.now() - t) / 60000);
      return { status: "AGING", ageMinutes };
    }
  }

  const timestamp =
    value?.timestamp ??
    value?.time?.marine ??
    value?.time?.weather ??
    value?.time ??
    value?.updatedAt ??
    value?.updated ??
    value?.observedAt;

  if (timestamp) {
    const t = new Date(String(timestamp)).getTime();
    if (Number.isFinite(t)) {
      const ageMinutes = Math.max(0, (Date.now() - t) / 60000);
      return { status: ageMinutes <= 60 ? "FRESH" : "AGING", ageMinutes };
    }
  }

  // Live endpoints without a timestamp still provide source-backed data.
  // The Tide API explicitly marks its model-derived forecast as live.
  if (kind === "Tide" && value?.live === true) {
    return { status: "FRESH", ageMinutes: null };
  }

  if (kind === "PFZ" || kind === "Hazards") {
    if (kind === "Hazards" && value?.live === false) {
      return { status: "UNAVAILABLE", ageMinutes: null };
    }
    return { status: "FRESH", ageMinutes: null };
  }

  return { status: "UNAVAILABLE", ageMinutes: null };
}

function formatFreshnessAge(ageMinutes: number | null) {
  if (ageMinutes === null) return "";
  if (ageMinutes < 60) return ` · ${Math.round(ageMinutes)} min ago`;
  if (ageMinutes < 1440) return ` · ${Math.round(ageMinutes / 60)} hr ago`;
  return ` · ${Math.round(ageMinutes / 1440)} days ago`;
}

function DataFreshness({ data }: { data: DashboardData | null }) {
  const freshness = data?.safety?.dataFreshness;

  const items = [
    { name: "Weather", item: freshness?.weather ?? data?.weather },
    { name: "Ocean", item: freshness?.ocean ?? data?.ocean },
    { name: "Tide", item: freshness?.tide ?? data?.tide },
    { name: "Geofence", item: data?.geofence ?? freshness?.geofence },
    { name: "PFZ", item: data?.pfz },
    { name: "Hazards", item: data?.hazards },
  ];

  return (
    <div className="card sources">
      <span className="source-title">
        Data Freshness
      </span>

      {items.map(({ name, item }) => {
        const freshness = freshnessFromData(item, name);
        const className =
          freshness.status === "FRESH"
            ? "green"
            : freshness.status === "AGING"
              ? "caution"
              : "red";

        return (
          <span className="source" key={name}>
            <strong>{name}:</strong>{" "}
            <span className={className}>{freshness.status}</span>
            {formatFreshnessAge(freshness.ageMinutes)}
          </span>
        );
      })}
    </div>
  );
}

function DataFusion({ data }: { data: DashboardData | null }) {
  const fusion = data?.fusion;

  if (!fusion) {
    return (
      <div className="card sources">
        <span className="source-title">Multi-Source Data Fusion</span>
        <span className="source">
          Fusion status: <span className="red">UNAVAILABLE</span>
        </span>
      </div>
    );
  }

  const statusClass =
    fusion.status === "AVAILABLE"
      ? "green"
      : fusion.status === "PARTIAL"
        ? "caution"
        : "red";

  return (
    <div className="card sources">
      <span className="source-title">Multi-Source Data Fusion</span>

      <div className="metric">
        <span>Overall fusion</span>
        <span className={statusClass}>{fusion.status}</span>
      </div>

      <div className="metric">
        <span>Safety relationship</span>
        <span>{fusion.safety.relationship}</span>
      </div>

      <div className="metric">
        <span>Fishing relationship</span>
        <span>{fusion.fishing.relationship}</span>
      </div>

      <div className="metric">
        <span>Route-risk relationship</span>
        <span>{fusion.routeRisk.relationship}</span>
      </div>

      {fusion.evidence.map((item) => (
        <div className="source" key={item}>
          {item}
        </div>
      ))}

      <div className="source">
        Sources: {fusion.sources.filter((source) => source.status !== "UNAVAILABLE").length}/
        {fusion.sources.length} available
      </div>
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
      <span className="source">
        Chlorophyll: <span className="caution">Historical prototype</span>
      </span>

      <button className="more-source">
        + More
      </button>
    </div>
  );
}
function GeofenceStatus() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGeofence() {
      try {
        const savedLocation = localStorage.getItem("orca-location");

        if (!savedLocation) {
          throw new Error("No location selected");
        }

        const location = JSON.parse(savedLocation);

        const response = await fetch(
          `/api/geofence?lat=${encodeURIComponent(
            location.latitude
          )}&lon=${encodeURIComponent(location.longitude)}`
        );

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Geofence request failed:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGeofence();

    const locationChanged = () => loadGeofence();
    window.addEventListener("orca-location-changed", locationChanged);

    const interval = setInterval(loadGeofence, 30000);

    return () => {
      window.removeEventListener("orca-location-changed", locationChanged);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="card geofence-card">
        <div className="geofence-loading">
          <div className="geofence-loading-dot" />
          <div>
            <div className="geofence-label">
              GEOFENCE STATUS
            </div>
            <div className="geofence-loading-text">
              Checking maritime boundary...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="card geofence-card">
        <div className="geofence-error">
          <div className="geofence-label">
            GEOFENCE STATUS
          </div>

          <strong>
            Unable to check maritime boundary
          </strong>
        </div>
      </div>
    );
  }

  const inside = data.insideEEZ;
  const warning = data.warning ?? "UNKNOWN";

  return (
    <div className={`card geofence-card ${inside ? "geofence-inside" : "geofence-outside"}`}>

      {/* HEADER */}
      <div className="geofence-header">

        <div className="geofence-title-group">
          <div className="geofence-label">
            GEOFENCE STATUS
          </div>

          <div className="geofence-location-status">
            <span className={`geofence-dot ${inside ? "dot-inside" : "dot-outside"}`} />
            <span>
              {inside ? "Maritime boundary verified" : "Outside protected maritime zone"}
            </span>
          </div>
        </div>

        <div className={`geofence-status-badge ${inside ? "badge-inside" : "badge-outside"}`}>
          <span>{inside ? "✓" : "!"}</span>
          {inside ? "INSIDE EEZ" : "OUTSIDE EEZ"}
        </div>

      </div>


      {/* MAIN ZONE */}
      <div className="geofence-zone">

        <div className="geofence-zone-icon">
          🌊
        </div>

        <div>
          <div className="geofence-zone-label">
            CURRENT MARITIME ZONE
          </div>

          <div className="geofence-zone-name">
            {inside
              ? data.boundary?.name ?? "Maritime Zone"
              : "Outside EEZ"}
          </div>
        </div>

      </div>


      {/* METRICS */}
      {inside && (
        <div className="geofence-metrics">

          <div className="geofence-metric">
            <span className="geofence-metric-label">
              Distance to boundary
            </span>

            <span className="geofence-metric-value">
              {data.distanceToBoundaryKm !== null
                ? `${Number(data.distanceToBoundaryKm).toFixed(2)} km`
                : "Unavailable"}
            </span>
          </div>


          <div className="geofence-metric">
            <span className="geofence-metric-label">
              Boundary status
            </span>

            <span className={`geofence-warning ${warning.toLowerCase()}`}>
              {warning}
            </span>
          </div>

        </div>
      )}


      {!inside && (
        <div className="geofence-outside-message">
          <span>!</span>
          <div>
            <strong>Outside Indian EEZ</strong>
            <p>
              The selected location is outside the detected
              maritime boundary.
            </p>
          </div>
        </div>
      )}


      {/* SOURCE */}
      <div className="geofence-footer">

        <div className="geofence-source">
          <span>DATA SOURCE</span>
          <strong>
            {data.source ?? "Marine Regions"}
          </strong>
        </div>

        <div className="geofence-dataset">
          <span>DATASET</span>
          <strong>World EEZ v12</strong>
        </div>

        {data.datasetDate && (
          <div className="geofence-date">
            <span>UPDATED</span>
            <strong>
              {new Date(data.datasetDate).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}
            </strong>
          </div>
        )}

      </div>

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
        let hazardUrl = "/api/hazard";
        let geofenceUrl = "/api/geofence";

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
              hazardUrl =
                `/api/hazard?lat=${encodeURIComponent(location.latitude)}` +
                `&lon=${encodeURIComponent(location.longitude)}`;
              geofenceUrl =
                `/api/geofence?lat=${encodeURIComponent(location.latitude)}` +
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
          fetch(hazardUrl, { cache: "no-store" }),
          fetch(geofenceUrl, { cache: "no-store" }),
        ]);

        const [safety, weather, ocean, tide, pfz, hazards, geofence] = await Promise.all(
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
            hazards,
            geofence,
            // No live chlorophyll API is connected yet. Keep this explicit
            // so the dashboard shows Unavailable instead of inventing a value.
            chlorophyll: null,
            // Fuse the already-fetched live service outputs. The fusion layer
            // does not fetch data or invent missing measurements.
            fusion: fuseMarineEvidence({
              weather,
              ocean,
              tide,
              hazards,
              geofence,
              pfz,
            }),
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard marine data:", error);
      }
    }

    loadDashboardData();

    let lastLocationKey = "";
    const readLocationKey = () => {
      try {
        const raw = localStorage.getItem("orca-location");
        if (!raw) return "default";
        const location = JSON.parse(raw);
        return `${location?.latitude ?? ""},${location?.longitude ?? ""}`;
      } catch {
        return "default";
      }
    };

    lastLocationKey = readLocationKey();

    const refreshForLocationChange = () => {
      lastLocationKey = readLocationKey();
      loadDashboardData();
    };

    window.addEventListener("orca-location-changed", refreshForLocationChange);

    const dataInterval = setInterval(loadDashboardData, 30000);
    const locationInterval = setInterval(() => {
      const nextLocationKey = readLocationKey();
      if (nextLocationKey !== lastLocationKey) {
        lastLocationKey = nextLocationKey;
        loadDashboardData();
      }
    }, 750);

    return () => {
      active = false;
      window.removeEventListener("orca-location-changed", refreshForLocationChange);
      clearInterval(dataInterval);
      clearInterval(locationInterval);
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

<GeofenceStatus />

<div className="map-row">
  <MarineMap />
</div>

            <LowerCards data={dashboardData} />

            <DataFreshness data={dashboardData} />

            <DataFusion data={dashboardData} />

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
