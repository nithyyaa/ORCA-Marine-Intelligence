"use client";

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
  Database,
  Activity,
  Layers3,
  Download,
  ChevronDown,
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
  { icon: Navigation, label: "What-If Scenarios", href: "/scenarios" },
  { icon: BarChart3, label: "Researcher Analytics", href: "/researcher" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function MessageIcon(props: any) {
  return <span {...props}>▣</span>;
}

const datasets = [
  {
    name: "Sea Surface Temperature",
    short: "SST",
    source: "Historical marine dataset",
    status: "HISTORICAL",
    coverage: "Historical coverage only",
    icon: Waves,
  },
  {
    name: "Chlorophyll",
    short: "CHL",
    source: "NOAA CoastWatch VIIRS Chlorophyll OCI via ERDDAP",
    status: "HISTORICAL",
    coverage: "2018-08-09 → 2021-09-02",
    icon: Activity,
  },
  {
    name: "PFZ / Fishing Observations",
    short: "PFZ",
    source: "INCOIS",
    status: "AVAILABLE",
    coverage: "Indian coastal waters",
    icon: Fish,
  },
  {
    name: "Live Weather",
    short: "WX",
    source: "Open-Meteo",
    status: "AVAILABLE",
    coverage: "Selected location",
    icon: Cloud,
  },
  {
    name: "Live Ocean",
    short: "OCEAN",
    source: "Open-Meteo Marine",
    status: "AVAILABLE",
    coverage: "Selected location",
    icon: Waves,
  },
  {
    name: "Live Chlorophyll",
    short: "CHL-LIVE",
    source: "No live source connected",
    status: "UNAVAILABLE",
    coverage: "No live observations",
    icon: Database,
  },
];

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
                item.href === "/researcher" ? "active" : ""
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

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "AVAILABLE"
      ? "available"
      : status === "HISTORICAL"
        ? "historical"
        : "unavailable";

  return (
    <span className={`research-status ${className}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

export default function ResearcherAnalytics() {
  const selectedDataset = datasets[1];

  return (
<main className="dashboard">      <Sidebar />

      <section className="main">
        <header className="research-topbar">
          <div>
            <div className="research-eyebrow">
              MARINE INTELLIGENCE · ANALYTICS
            </div>

            <h1>Researcher Analytics</h1>

            <p>
              Explore marine observations, environmental trends and
              spatial evidence across ORCA data sources.
            </p>
          </div>

          <div className="research-location">
            <strong>📍 Indian Coastal Waters</strong>
            <span>Research &amp; Scientific Analysis</span>
          </div>
        </header>

        <div className="research-content">
          {/* SUMMARY STRIP */}
          <section className="research-stats">
            <div className="research-stat-card">
              <div className="research-stat-icon blue">
                <Database size={19} />
              </div>

              <div>
                <div className="research-stat-label">Datasets</div>
                <div className="research-stat-value">6</div>
                <div className="research-stat-meta">
                  3 available · 2 historical
                </div>
              </div>
            </div>

            <div className="research-stat-card">
              <div className="research-stat-icon green">
                <Activity size={19} />
              </div>

              <div>
                <div className="research-stat-label">Live Sources</div>
                <div className="research-stat-value">3</div>
                <div className="research-stat-meta">
                  Weather · Ocean · PFZ
                </div>
              </div>
            </div>

            <div className="research-stat-card">
              <div className="research-stat-icon amber">
                <BarChart3 size={19} />
              </div>

              <div>
                <div className="research-stat-label">
                  Analysis Modules
                </div>
                <div className="research-stat-value">4</div>
                <div className="research-stat-meta">
                  Time · Spatial · Seasonal · Correlation
                </div>
              </div>
            </div>

            <div className="research-stat-card">
              <div className="research-stat-icon purple">
                <Layers3 size={19} />
              </div>

              <div>
                <div className="research-stat-label">Evidence Mode</div>
                <div className="research-stat-value">SOURCE-AWARE</div>
                <div className="research-stat-meta">
                  Historical ≠ live
                </div>
              </div>
            </div>
          </section>

          <div className="research-grid">
            {/* DATASETS */}
            <section className="research-card dataset-card">
              <div className="card-header">
                <div>
                  <div className="card-kicker">DATA LAYER</div>
                  <h2>Marine Datasets</h2>
                  <p>
                    Select a dataset to inspect provenance, coverage and
                    evidence status.
                  </p>
                </div>

                <div className="header-chip">
                  <Database size={14} />
                  DATA CATALOG
                </div>
              </div>

              <div className="dataset-list">
                {datasets.map((dataset, index) => {
                  const Icon = dataset.icon;
                  const selected = index === 1;

                  return (
                    <button
                      key={dataset.name}
                      className={`dataset-row ${
                        selected ? "selected" : ""
                      }`}
                    >
                      <div className="dataset-icon">
                        <Icon size={18} />
                      </div>

                      <div className="dataset-info">
                        <div className="dataset-name">
                          {dataset.name}
                        </div>
                        <div className="dataset-source">
                          {dataset.source}
                        </div>
                      </div>

                      <StatusBadge status={dataset.status} />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* METADATA */}
            <section className="research-card metadata-card">
              <div className="card-header">
                <div>
                  <div className="card-kicker">PROVENANCE</div>
                  <h2>Dataset Metadata</h2>
                  <p>Evidence details for the selected dataset.</p>
                </div>

                <div className="dataset-code">
                  {selectedDataset.short}
                </div>
              </div>

              <div className="metadata-status">
                <div>
                  <span>Evidence status</span>
                  <strong>HISTORICAL</strong>
                </div>

                <StatusBadge status="HISTORICAL" />
              </div>

              <div className="metadata-list">
                <div>
                  <span>Dataset</span>
                  <strong>{selectedDataset.name}</strong>
                </div>

                <div>
                  <span>Source</span>
                  <strong>{selectedDataset.source}</strong>
                </div>

                <div>
                  <span>Coverage</span>
                  <strong>{selectedDataset.coverage}</strong>
                </div>

                <div>
                  <span>Temporal Resolution</span>
                  <strong>Historical time series</strong>
                </div>

                <div>
                  <span>Spatial Resolution</span>
                  <strong>Spatial grid</strong>
                </div>
              </div>

              <div className="evidence-warning">
                <span>!</span>
                <div>
                  <strong>Historical evidence</strong>
                  <p>
                    This dataset must not be interpreted as a live
                    2026 observation.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ANALYSIS */}
          <section className="research-card analysis-card">
            <div className="card-header">
              <div>
                <div className="card-kicker">SCIENTIFIC ANALYSIS</div>
                <h2>Research Analysis</h2>
                <p>
                  Analytical workflows built around validated marine
                  evidence.
                </p>
              </div>

              <div className="analysis-note">
                Correlation ≠ causation
              </div>
            </div>

            <div className="analysis-grid">
              <button className="analysis-module">
                <div className="module-icon">
                  <Activity size={21} />
                </div>

                <div>
                  <strong>Time Series</strong>
                  <span>
                    Examine environmental variables across time.
                  </span>
                </div>

                <div className="module-arrow">→</div>
              </button>

              <button className="analysis-module">
                <div className="module-icon">
                  <Map size={21} />
                </div>

                <div>
                  <strong>Spatial Analysis</strong>
                  <span>
                    Compare marine conditions across geographic areas.
                  </span>
                </div>

                <div className="module-arrow">→</div>
              </button>

              <button className="analysis-module">
                <div className="module-icon">
                  <Waves size={21} />
                </div>

                <div>
                  <strong>Seasonal Analysis</strong>
                  <span>
                    Investigate seasonal environmental patterns.
                  </span>
                </div>

                <div className="module-arrow">→</div>
              </button>

              <button className="analysis-module">
                <div className="module-icon">
                  <BarChart3 size={21} />
                </div>

                <div>
                  <strong>Correlation</strong>
                  <span>
                    Compare relationships between marine variables.
                  </span>
                </div>

                <div className="module-arrow">→</div>
              </button>
            </div>
          </section>

          {/* LOWER GRID */}
          <div className="research-lower-grid">
            <section className="research-card insight-card">
              <div className="card-kicker">RESEARCH INSIGHT</div>

              <div className="insight-title">
                Evidence-aware marine research
              </div>

              <p>
                ORCA keeps historical datasets, live observations and
                unavailable sources explicitly separated so analytical
                results preserve their evidence status.
              </p>

              <div className="insight-pills">
                <span>LIVE DATA</span>
                <span>HISTORICAL</span>
                <span>UNAVAILABLE</span>
              </div>
            </section>

            <section className="research-card export-card">
              <div className="export-icon">
                <Download size={21} />
              </div>

              <div className="export-content">
                <div className="card-kicker">RESEARCH OUTPUT</div>
                <h3>Export Analysis</h3>
                <p>
                  Export validated datasets and analytical results
                  when the analysis workflow is connected.
                </p>
              </div>

              <button className="export-button" disabled>
                Export
                <span>COMING NEXT</span>
              </button>
            </section>
          </div>
        </div>
      </section>

     
      <style jsx global>{`
        .research-shell {
          min-height: 100vh;
          display: flex;
          gap: 14px;
          padding: 14px;
          color: #e8f1fb;
          background:
            radial-gradient(
              circle at 70% 5%,
              rgba(18, 71, 110, 0.24),
              transparent 34%
            ),
            linear-gradient(
              135deg,
              #061321 0%,
              #071827 50%,
              #05111d 100%
            );
          font-family: Arial, Helvetica, sans-serif;
        }

        .research-sidebar {
          width: 225px;
          min-height: calc(100vh - 28px);
          border: 1px solid #183149;
          border-radius: 15px;
          background: rgba(7, 19, 32, 0.96);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
        }

        .research-logo-section {
          padding: 20px 18px 16px;
          border-bottom: 1px solid #183149;
        }

        .research-logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .research-orca-icon {
          font-size: 40px;
        }

        .research-logo {
          font-size: 31px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .research-logo-subtitle {
          margin-top: 7px;
          margin-left: 54px;
          color: #9eb1c6;
          font-size: 12px;
          line-height: 1.45;
        }

        .research-nav {
          padding: 12px 0;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }

        .research-nav-item {
          height: 46px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 0 18px;
          color: #b9c9da;
          font-size: 13px;
          border-left: 3px solid transparent;
          text-decoration: none;
        }

        .research-nav-item:hover {
          background: #0b233c;
          color: white;
        }

        .research-nav-item.active {
          background: linear-gradient(90deg, #10386b, #0a294c);
          border-left-color: #2f8cff;
          color: white;
        }

        .research-nav-icon {
          width: 20px;
          text-align: center;
          display: flex;
          justify-content: center;
        }

        .research-badge {
          margin-left: auto;
          width: 21px;
          height: 21px;
          border-radius: 50%;
          background: #e34d55;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
        }

        .research-sidebar-bottom {
          padding: 14px;
        }

        .research-theme-switch {
          height: 42px;
          border: 1px solid #183149;
          border-radius: 22px;
          padding: 4px;
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          color: #71879c;
          font-size: 11px;
        }

        .research-theme-switch div {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
        }

        .research-theme-switch .selected {
          color: white;
          background: #102d49;
        }

        .research-user-card {
          border: 1px solid #183149;
          border-radius: 11px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #9eb1c6;
        }

        .research-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #102d49;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .research-user-name {
          color: #e8f1fb;
          font-size: 11px;
          font-weight: 700;
        }

        .research-user-location {
          margin-top: 2px;
          font-size: 9px;
          color: #71879c;
        }

        .research-user-card svg {
          margin-left: auto;
        }

        .research-main {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .research-topbar {
          min-height: 118px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          padding: 10px 8px 22px;
        }

        .research-eyebrow {
          color: #5f88ac;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.8px;
          margin-bottom: 8px;
        }

        .research-topbar h1 {
          margin: 0;
          color: #f5f9ff;
          font-size: 29px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }

        .research-topbar p {
          margin: 8px 0 0;
          max-width: 650px;
          color: #8299ad;
          font-size: 13px;
          line-height: 1.5;
        }

        .research-location {
          min-width: 235px;
          border: 1px solid #183149;
          border-radius: 10px;
          padding: 11px 14px;
          background: rgba(7, 25, 42, 0.72);
        }

        .research-location strong {
          display: block;
          color: #e8f1fb;
          font-size: 12px;
        }

        .research-location span {
          display: block;
          margin-top: 5px;
          color: #71879c;
          font-size: 10px;
        }

        .research-content {
          padding: 0 8px 30px;
        }

        .research-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .research-stat-card {
          min-height: 92px;
          border: 1px solid #183149;
          border-radius: 12px;
          background: rgba(7, 26, 42, 0.88);
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .research-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .research-stat-icon.blue {
          color: #54aaff;
          background: rgba(47, 140, 255, 0.1);
        }

        .research-stat-icon.green {
          color: #2ee88b;
          background: rgba(46, 232, 139, 0.09);
        }

        .research-stat-icon.amber {
          color: #ffd02d;
          background: rgba(255, 208, 45, 0.09);
        }

        .research-stat-icon.purple {
          color: #9d8cff;
          background: rgba(157, 140, 255, 0.09);
        }

        .research-stat-label {
          color: #71879c;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .research-stat-value {
          margin-top: 4px;
          color: #f5f9ff;
          font-size: 20px;
          font-weight: 700;
        }

        .research-stat-meta {
          margin-top: 3px;
          color: #71879c;
          font-size: 9px;
        }

        .research-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .research-card {
          border: 1px solid #183149;
          border-radius: 14px;
          background: #071a2a;
          overflow: hidden;
        }

        .card-header {
          padding: 18px 19px 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #122b40;
        }

        .card-kicker {
          color: #4e82aa;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-bottom: 5px;
        }

        .card-header h2 {
          margin: 0;
          color: #f1f7fd;
          font-size: 17px;
          font-weight: 600;
        }

        .card-header p {
          margin: 5px 0 0;
          color: #71879c;
          font-size: 11px;
        }

        .header-chip,
        .dataset-code {
          flex-shrink: 0;
          border: 1px solid #23445e;
          border-radius: 7px;
          padding: 7px 9px;
          color: #7198b8;
          background: #091f32;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dataset-code {
          color: #5caeff;
          font-size: 11px;
        }

        .dataset-list {
          padding: 9px;
        }

        .dataset-row {
          width: 100%;
          min-height: 62px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: inherit;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 10px;
          text-align: left;
          margin-bottom: 4px;
        }

        .dataset-row:hover {
          background: #0a2034;
          border-color: #183149;
        }

        .dataset-row.selected {
          background: linear-gradient(
            90deg,
            rgba(24, 68, 105, 0.7),
            rgba(9, 31, 49, 0.8)
          );
          border-color: #2b5777;
        }

        .dataset-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #0b253b;
          color: #57a9df;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dataset-info {
          min-width: 0;
          flex: 1;
        }

        .dataset-name {
          color: #eaf3fb;
          font-size: 12px;
          font-weight: 700;
        }

        .dataset-source {
          margin-top: 4px;
          color: #6f879c;
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .research-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          padding: 5px 7px;
          border-radius: 6px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.6px;
        }

        .research-status.available {
          color: #2ee88b;
          border: 1px solid rgba(46, 232, 139, 0.22);
          background: rgba(46, 232, 139, 0.06);
        }

        .research-status.historical {
          color: #ffd02d;
          border: 1px solid rgba(255, 208, 45, 0.22);
          background: rgba(255, 208, 45, 0.06);
        }

        .research-status.unavailable {
          color: #ff6670;
          border: 1px solid rgba(255, 102, 112, 0.22);
          background: rgba(255, 102, 112, 0.06);
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .metadata-status {
          margin: 13px 18px;
          padding: 11px;
          border: 1px solid #183149;
          border-radius: 9px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metadata-status span,
        .metadata-list span {
          display: block;
          color: #668198;
          font-size: 9px;
          margin-bottom: 4px;
        }

        .metadata-status strong {
          color: #ffd02d;
          font-size: 11px;
        }

        .metadata-list {
          padding: 0 18px;
        }

        .metadata-list > div {
          padding: 10px 0;
          border-bottom: 1px solid #10283b;
        }

        .metadata-list strong {
          color: #dce9f4;
          font-size: 11px;
          line-height: 1.4;
        }

        .evidence-warning {
          margin: 13px 18px 18px;
          padding: 11px;
          border: 1px solid rgba(255, 208, 45, 0.2);
          border-radius: 9px;
          background: rgba(255, 208, 45, 0.04);
          display: flex;
          gap: 9px;
        }

        .evidence-warning > span {
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: rgba(255, 208, 45, 0.12);
          color: #ffd02d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .evidence-warning strong {
          color: #dce9f4;
          font-size: 10px;
        }

        .evidence-warning p {
          margin: 3px 0 0;
          color: #71879c;
          font-size: 9px;
          line-height: 1.4;
        }

        .analysis-card {
          margin-bottom: 12px;
        }

        .analysis-note {
          color: #71879c;
          border: 1px solid #183149;
          border-radius: 7px;
          padding: 7px 9px;
          font-size: 9px;
        }

        .analysis-grid {
          padding: 11px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 9px;
        }

        .analysis-module {
          min-height: 82px;
          border: 1px solid #17344c;
          border-radius: 10px;
          background: #081e31;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 11px;
          color: inherit;
          text-align: left;
        }

        .analysis-module:hover {
          border-color: #2c668e;
          background: #0a243a;
        }

        .module-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          color: #4eaff1;
          background: rgba(47, 140, 255, 0.09);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .analysis-module strong {
          display: block;
          color: #eaf3fb;
          font-size: 11px;
        }

        .analysis-module span {
          display: block;
          margin-top: 4px;
          color: #6f879c;
          font-size: 9px;
          line-height: 1.35;
        }

        .module-arrow {
          margin-left: auto;
          color: #4e82aa;
          font-size: 15px;
        }

        .research-lower-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 12px;
        }

        .insight-card {
          padding: 18px;
        }

        .insight-title {
          margin-top: 8px;
          color: #edf5fb;
          font-size: 15px;
          font-weight: 600;
        }

        .insight-card p {
          margin: 8px 0 14px;
          color: #71879c;
          font-size: 10px;
          line-height: 1.55;
        }

        .insight-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .insight-pills span {
          padding: 5px 7px;
          border: 1px solid #183149;
          border-radius: 5px;
          color: #7894aa;
          font-size: 8px;
          font-weight: 700;
        }

        .export-card {
          min-height: 122px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .export-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          color: #55aef2;
          background: rgba(47, 140, 255, 0.09);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .export-content {
          flex: 1;
        }

        .export-content h3 {
          margin: 3px 0 4px;
          color: #edf5fb;
          font-size: 14px;
        }

        .export-content p {
          margin: 0;
          color: #71879c;
          font-size: 9px;
          line-height: 1.4;
        }

        .export-button {
          border: 1px solid #183149;
          border-radius: 7px;
          padding: 8px 11px;
          background: #091b2b;
          color: #49667e;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex-shrink: 0;
        }

        .export-button span {
          font-size: 7px;
          color: #3e586c;
        }

        @media (max-width: 1200px) {
          .research-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .research-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .research-sidebar {
            display: none;
          }

          .research-shell {
            padding: 8px;
          }

          .research-topbar {
            flex-direction: column;
          }

          .research-location {
            width: 100%;
          }

          .research-stats {
            grid-template-columns: 1fr 1fr;
          }

          .research-lower-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .research-stats,
          .analysis-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}