"use client";

import Link from "next/link";
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
                item.href === "/alerts" ? "active" : ""
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

          <ChevronDown
            size={15}
            className="user-arrow"
          />
        </div>
      </div>
    </aside>
  );
}

export default function AlertsPage() {
  return (
    <main className="dashboard">
      <Sidebar />

      <section className="main">
        <header className="topbar">
          <div className="ask-area">
            <div className="ask-title">
              Marine Safety
            </div>

            <div className="ask-box">
              Active marine alerts and safety warnings
            </div>
          </div>

          <div className="location">
            <strong>
              📍 Visakhapatnam, India
            </strong>

            <div className="date">
              Marine Alert Center
            </div>
          </div>
        </header>

        <div className="content-grid">
          <div className="left-content">
            <div className="stats">
              <div className="card stat-card">
                <div className="stat-title">
                  Active Alerts
                </div>

                <div className="stat-value red">
                  3
                </div>

                <div className="stat-small">
                  Requiring attention
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">
                  High Severity
                </div>

                <div className="stat-value caution">
                  1
                </div>

                <div className="stat-small caution">
                  Immediate attention
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">
                  Moderate
                </div>

                <div className="stat-value">
                  2
                </div>

                <div className="stat-small">
                  Exercise caution
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">
                  Status
                </div>

                <div className="stat-value green">
                  MONITOR
                </div>

                <div className="stat-small">
                  Marine conditions monitored
                </div>
              </div>
            </div>

            <div className="card alerts">
              <div className="alert-header">
                <strong>
                  Active Marine Alerts
                </strong>

                <span className="details">
                  Visakhapatnam
                </span>
              </div>

              <div className="alert high">
                <div className="alert-title-row">
                  <span>
                    ⚠ Small Craft Advisory
                  </span>

                  <span className="severity">
                    High
                  </span>
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
                  <span>
                    ⚠ High Wave Warning
                  </span>

                  <span className="severity">
                    Medium
                  </span>
                </div>

                <div className="alert-description">
                  Wave height expected between
                  1.5 – 2.5 m.
                </div>

                <div className="alert-time">
                  Today, 04:45 PM IST
                </div>
              </div>

              <div className="alert medium">
                <div className="alert-title-row">
                  <span>
                    ⚠ Fishermen Advisory
                  </span>

                  <span className="severity">
                    Medium
                  </span>
                </div>

                <div className="alert-description">
                  Avoid venturing out during early
                  morning hours.
                </div>

                <div className="alert-time">
                  Today, 04:30 PM IST
                </div>
              </div>
            </div>

            <div className="lower-grid">
              <div className="card info-card">
                <div className="info-title">
                  Safety Guidance
                </div>

                <div className="info-subtitle">
                  Recommended actions
                </div>

                <div className="metric">
                  <span>
                    Small vessels
                  </span>

                  <span className="red">
                    Exercise caution
                  </span>
                </div>

                <div className="metric">
                  <span>
                    Fishing activity
                  </span>

                  <span className="caution">
                    Monitor conditions
                  </span>
                </div>

                <div className="metric">
                  <span>
                    Coastal operations
                  </span>

                  <span className="green">
                    Monitor
                  </span>
                </div>
              </div>

              <div className="card info-card">
                <div className="info-title">
                  Alert Intelligence
                </div>

                <div className="info-subtitle">
                  Conditions being monitored
                </div>

                <div className="metric">
                  <span>
                    Wind
                  </span>

                  <span>
                    24 km/h
                  </span>
                </div>

                <div className="metric">
                  <span>
                    Waves
                  </span>

                  <span>
                    1.8 m
                  </span>
                </div>

                <div className="metric">
                  <span>
                    Weather
                  </span>

                  <span className="green">
                    Stable
                  </span>
                </div>
              </div>

              <div className="card info-card">
                <div className="info-title">
                  ORCA Monitoring
                </div>

                <div className="info-subtitle">
                  Marine intelligence status
                </div>

                <div className="metric">
                  <span>
                    Data monitoring
                  </span>

                  <span className="green">
                    Active
                  </span>
                </div>

                <div className="metric">
                  <span>
                    Safety assessment
                  </span>

                  <span className="green">
                    Active
                  </span>
                </div>

                <div className="metric">
                  <span>
                    Alert generation
                  </span>

                  <span className="green">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside className="right-column">
            <div className="card recommendation">
              <div className="panel-heading">
                <span>
                  <ShieldAlert size={15} />
                  Current Safety Status
                </span>

                <span className="status-pill">
                  CAUTION
                </span>
              </div>

              <div className="recommendation-main">
                Marine conditions require
                <strong>
                  increased caution
                </strong>
              </div>

              <div className="recommendation-description">
                Strong wind and elevated wave
                conditions may affect small-vessel
                and fishing operations.
              </div>

              <div className="divider" />

              <div className="reasons-title">
                <span>
                  Alert Factors
                </span>
              </div>

              <div className="metric">
                <span>
                  Wind
                </span>

                <span className="caution">
                  24 km/h ↑
                </span>
              </div>

              <div className="metric">
                <span>
                  Wave height
                </span>

                <span className="caution">
                  1.8 m ↑
                </span>
              </div>

              <div className="metric">
                <span>
                  Storm warning
                </span>

                <span className="green">
                  No
                </span>
              </div>
            </div>

            <div className="card recommendation">
              <div className="panel-heading">
                <span>
                  <AlertTriangle size={15} />
                  Important
                </span>
              </div>

              <div className="recommendation-description">
                Check the latest marine conditions
                before beginning any offshore
                activity.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}