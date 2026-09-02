"use client";

import dynamic from "next/dynamic";
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
  { icon: Home, label: "Dashboard", active: true },
  { icon: MessageIcon, label: "Ask ORCA" },
  { icon: Map, label: "Map Explorer" },
  { icon: Bell, label: "Alerts", badge: 3 },
  { icon: Fish, label: "Fisheries" },
  { icon: Waves, label: "Ocean Conditions" },
  { icon: Cloud, label: "Weather" },
  { icon: Navigation, label: "Tides" },
  { icon: Info, label: "Advisories" },
  { icon: Route, label: "Routes & Planning" },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
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
            <div
              key={item.label}
              className={`nav-item ${item.active ? "active" : ""}`}
            >
              <span className="nav-icon">
                <Icon size={19} />
              </span>

              <span>{item.label}</span>

              {item.badge && (
                <span className="badge">{item.badge}</span>
              )}
            </div>
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
        <strong>📍 Visakhapatnam, India</strong>
        <div className="date">
          01 Sept 2026 | 03:23 PM IST
        </div>
      </div>
    </header>
  );
}

function Stats() {
  return (
    <div className="stats">
      <div className="card stat-card">
        <div className="stat-title">Overall Recommendation</div>

        <div className="stat-value caution">CAUTION</div>

        <div className="stat-small caution">
          Why caution?
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">Risk Score</div>

        <div className="risk-row">
          <div className="risk-circle">48</div>

          <div>
            <div>
              <strong>48</strong>
              <span className="muted"> /100</span>
            </div>

            <div className="stat-small caution">
              Moderate Risk
            </div>
          </div>
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">Suitable Window</div>

        <div className="stat-value">
          9:30 AM - 1:30 PM
        </div>

        <div className="stat-small">
          Tomorrow
        </div>

        <div className="stat-small green">
          Better conditions expected
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">Nearest PFZ</div>

        <div className="stat-value">18.6 km</div>

        <div className="stat-small green">
          North East
        </div>
      </div>

      <div className="card stat-card">
        <div className="stat-title">Active Alerts</div>

        <div className="stat-value red">3</div>

        <div className="stat-small">
          <span className="green">View Alerts →</span>
        </div>
      </div>
    </div>
  );
}

function Recommendation() {
  const reasons = [
    ["Wave Height", "1.8 m", "up"],
    ["Wind Speed", "24 km/h", "up"],
    ["Tide", "Moderate", "ok"],
    ["Weather", "No major storm", "ok"],
    ["Lightning Risk", "Low", "ok"],
    ["Cyclone Warning", "No", "ok"],
  ];

  return (
    <div className="card recommendation">
      <div className="panel-heading">
        <span>
          ORCA Recommendation <Info size={12} />
        </span>

        <span className="status-pill">CAUTION</span>
      </div>

      <div className="recommendation-main">
        Fishing is not recommended between

        <strong>
          6:00 AM – 8:00 AM
        </strong>
      </div>

      <div className="recommendation-description">
        Elevated wind and wave conditions may increase
        risk during this time.
      </div>

      <div className="divider" />

      <div className="reasons-title">
        <span>Key Reasons</span>
        <span className="details">View Details →</span>
      </div>

      {reasons.map(([name, value, status]) => (
        <div className="metric" key={name}>
          <span>{name}</span>

          <span className="metric-value">
            {value}{" "}
            {status === "up" ? (
              <span className="red">↑</span>
            ) : (
              <span className="green">✓</span>
            )}
          </span>
        </div>
      ))}
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
      <div className="info-title">{title}</div>
      <div className="info-subtitle">{subtitle}</div>

      {children}
    </div>
  );
}

function LowerCards() {
  return (
    <div className="lower-grid">
      <InfoCard
        title="Ocean Conditions"
        subtitle="Tomorrow, 6 AM"
      >
        <div className="metric">
          <span>〰 Wave Height</span>
          <span>
            1.8 m <span className="red">↑</span>
          </span>
        </div>

        <div className="metric">
          <span>≋ Sea State</span>
          <span>Moderate</span>
        </div>

        <div className="metric">
          <span>♨ Sea Surface Temp.</span>
          <span>
            29.4 °C <span className="red">↑</span>
          </span>
        </div>

        <div className="metric">
          <span>〰 Current Speed</span>
          <span>
            0.6 m/s <span className="green">↓</span>
          </span>
        </div>

        <div className="more">
          More Details →
        </div>
      </InfoCard>

      <InfoCard
        title="Weather Forecast"
        subtitle="Tomorrow, 6 AM"
      >
        <div className="metric">
          <span>〰 Wind Speed</span>
          <span>
            24 km/h <span className="red">↑</span>
          </span>
        </div>

        <div className="metric">
          <span>⌁ Wind Direction</span>
          <span>NE</span>
        </div>

        <div className="metric">
          <span>☁ Rainfall</span>
          <span>0 mm</span>
        </div>

        <div className="metric">
          <span>☁ Cloud Cover</span>
          <span>
            32 % <span className="green">↓</span>
          </span>
        </div>

        <div className="more">
          More Details →
        </div>
      </InfoCard>

      <InfoCard
        title="Tide Information"
        subtitle="Tomorrow"
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
          <span>Low · 5:48 AM</span>
          <span>0.3 m</span>
        </div>

        <div className="metric">
          <span>High · 11:36 AM</span>
          <span>1.1 m</span>
        </div>

        <div className="more">
          More Details →
        </div>
      </InfoCard>
    </div>
  );
}

function Alerts() {
  return (
    <div className="card alerts">
      <div className="alert-header">
        <strong>Active Alerts (3)</strong>
        <span className="details">View All →</span>
      </div>

      <div className="alert high">
        <div className="alert-title-row">
          <span>⚠ Small Craft Advisory</span>
          <span className="severity">High</span>
        </div>

        <div className="alert-description">
          Bay of Bengal (North Andhra Coast)
        </div>

        <div className="alert-time">
          Today, 05:30 PM IST
        </div>
      </div>

      <div className="alert medium">
        <div className="alert-title-row">
          <span>⚠ High Wave Warning</span>
          <span className="severity">Medium</span>
        </div>

        <div className="alert-description">
          Wave height expected 1.5 – 2.5 m
        </div>

        <div className="alert-time">
          Today, 04:45 PM IST
        </div>
      </div>

      <div className="alert medium">
        <div className="alert-title-row">
          <span>⚠ Fishermen Advisory</span>
          <span className="severity">Medium</span>
        </div>

        <div className="alert-description">
          Avoid venturing out during early morning hours
        </div>

        <div className="alert-time">
          Today, 04:30 PM IST
        </div>
      </div>
    </div>
  );
}

function DataSources() {
  return (
    <div className="card sources">
      <span className="source-title">Data Sources</span>
      <span className="source">INCOIS</span>
      <span className="source">ISRO EOS</span>
      <span className="source">IMD</span>
      <span className="source">NOAA</span>
      <span className="source">GFS</span>
      <span className="source">OpenStreetMap</span>

      <button className="more-source">
        + More
      </button>
    </div>
  );
}

export default function Dashboard() {
  return (
    <main className="dashboard">
      <Sidebar />

      <section className="main">
        <Header />

        <div className="content-grid">
          <div className="left-content">
            <Stats />

            <div className="map-row">
              <MarineMap />
            </div>

            <LowerCards />

            <DataSources />
          </div>

          <aside className="right-column">
            <Recommendation />
            <Alerts />
          </aside>
        </div>
      </section>
    </main>
  );
}