"use client";

import dynamic from "next/dynamic";
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
  Layers,
  LocateFixed,
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
  {
    icon: Waves,
    label: "Ocean Conditions",
    href: "/ocean-conditions",
  },
  { icon: Cloud, label: "Weather", href: "/weather" },
  { icon: Navigation, label: "Tides", href: "/tides" },
  { icon: Info, label: "Advisories", href: "/advisories" },
  {
    icon: Route,
    label: "Routes & Planning",
    href: "/routes",
  },
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
                item.href === "/map-explorer" ? "active" : ""
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

export default function MapExplorer() {
  return (
    <main className="dashboard">
      <Sidebar />

      <section className="main">
        <header className="topbar">
          <div className="ask-area">
            <div className="ask-title">Marine Map</div>

            <div className="ask-box">
              Explore marine conditions, fishing zones and
              hazard areas
            </div>
          </div>

          <div className="location">
            <strong>📍 Visakhapatnam, India</strong>

            <div className="date">
              Marine Intelligence Map
            </div>
          </div>
        </header>

        <div
          className="content-grid"
          style={{
            gridTemplateColumns: "1fr",
          }}
        >
          <div className="left-content">
            <div className="stats">
              <div className="card stat-card">
                <div className="stat-title">
                  Map Location
                </div>

                <div className="stat-value">
                  Visakhapatnam
                </div>

                <div className="stat-small">
                  Andhra Pradesh, India
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">
                  Fishing Zones
                </div>

                <div className="stat-value green">
                  3 PFZs
                </div>

                <div className="stat-small">
                  Potential fishing areas
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">
                  Marine Hazards
                </div>

                <div className="stat-value caution">
                  2
                </div>

                <div className="stat-small caution">
                  Areas requiring caution
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-title">
                  Data Status
                </div>

                <div className="stat-value green">
                  LIVE
                </div>

                <div className="stat-small">
                  Marine intelligence data
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "0",
                overflow: "hidden",
                minHeight: "620px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 22px",
                  borderBottom:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                    }}
                  >
                    Marine Intelligence Map
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    Explore fishing zones, hazards and
                    marine conditions
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      background:
                        "rgba(255,255,255,0.04)",
                      color: "#94a3b8",
                      padding: "9px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <Layers size={15} />
                    Layers
                  </button>

                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      background:
                        "rgba(255,255,255,0.04)",
                      color: "#94a3b8",
                      padding: "9px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <LocateFixed size={15} />
                    Locate
                  </button>
                </div>
              </div>

              <div
                style={{
                  height: "550px",
                  width: "100%",
                }}
              >
                <MarineMap />
              </div>
            </div>

            <div className="lower-grid">
              <div className="card info-card">
                <div className="info-title">
                  Map Legend
                </div>

                <div className="info-subtitle">
                  Marine intelligence layers
                </div>

                <div className="metric">
                  <span>
                    🟢 Potential Fishing Zone
                  </span>

                  <span>PFZ</span>
                </div>

                <div className="metric">
                  <span>
                    🔴 Hazard Area
                  </span>

                  <span>Hazard</span>
                </div>

                <div className="metric">
                  <span>
                    📍 Current Location
                  </span>

                  <span>17.6868° N</span>
                </div>
              </div>

              <div className="card info-card">
                <div className="info-title">
                  Marine Layers
                </div>

                <div className="info-subtitle">
                  Available intelligence
                </div>

                <div className="metric">
                  <span>Weather</span>
                  <span className="green">
                    Available
                  </span>
                </div>

                <div className="metric">
                  <span>Ocean Conditions</span>
                  <span className="green">
                    Available
                  </span>
                </div>

                <div className="metric">
                  <span>Fishing Zones</span>
                  <span className="green">
                    Available
                  </span>
                </div>
              </div>

              <div className="card info-card">
                <div className="info-title">
                  Map Intelligence
                </div>

                <div className="info-subtitle">
                  Current area
                </div>

                <div className="metric">
                  <span>Latitude</span>
                  <span>17.6868° N</span>
                </div>

                <div className="metric">
                  <span>Longitude</span>
                  <span>83.2185° E</span>
                </div>

                <div className="metric">
                  <span>Region</span>
                  <span>Bay of Bengal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}