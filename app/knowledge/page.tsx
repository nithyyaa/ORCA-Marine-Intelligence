"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Anchor,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  Home,
  Map,
  Search,
  ShieldAlert,
  Waves,
} from "lucide-react";

type Result = {
  title: string;
  content: string;
  source: string;
  similarity: number | null;
};

type SearchResponse = {
  available?: boolean;
  results?: Result[];
  retrievedAt?: string;
  source?: string;
  message?: string;
};

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Search, label: "Ask ORCA", href: "/ask" },
  { icon: Map, label: "Marine Map", href: "/map" },
  { icon: Waves, label: "Fisheries", href: "/fisheries" },
  { icon: ShieldAlert, label: "Alerts", href: "/alerts" },
  { icon: Anchor, label: "Routes & Planning", href: "/routes" },
  { icon: ChevronRight, label: "What-If Scenarios", href: "/scenarios" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: BookOpen, label: "Knowledge Base", href: "/knowledge", active: true },
];

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [retrievedAt, setRetrievedAt] = useState<string | null>(null);

  async function searchKnowledge() {
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setSearched(true);
    setError("");
    setSelected(null);

    try {
      const response = await fetch(`/api/knowledge?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Knowledge search failed.");
      }

      const nextResults = Array.isArray(data.results) ? data.results : [];
      setResults(nextResults);
      setSelected(nextResults[0] ?? null);
      setRetrievedAt(data.retrievedAt ?? null);

      if (!nextResults.length) {
        setError(data.message || "No relevant marine knowledge was found.");
      }
    } catch (err) {
      setResults([]);
      setSelected(null);
      setError(err instanceof Error ? err.message : "Knowledge search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-row">
            <div className="orca-icon">◉</div>
            <div>
              <div className="logo">ORCA</div>
              <div className="logo-subtitle">MARINE INTELLIGENCE</div>
            </div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(({ icon: Icon, label, href, active }) => (
            <Link
              key={label}
              href={href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon className="nav-icon" size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="theme-switch">
            <span>System</span>
            <span className="badge">LIVE</span>
          </div>
          <div className="user-card">
            <div className="user-avatar">O</div>
            <div>
              <div className="user-name">ORCA User</div>
              <div className="user-location">Marine Operations</div>
            </div>
          </div>
        </div>
      </aside>

      <section className="main knowledge-main">
        <header className="page-header">
          <div>
            <div className="eyebrow">MARINE INTELLIGENCE · KNOWLEDGE</div>
            <h1>Marine Knowledge Base</h1>
            <p>
              Search the ORCA marine knowledge layer using evidence retrieved
              from the connected knowledge sources.
            </p>
          </div>
          <div className="header-status">
            <span className="status-dot" />
            RAG SEARCH
          </div>
        </header>

        <div className="knowledge-search card">
          <div className="search-label">SEARCH MARINE KNOWLEDGE</div>
          <div className="search-row">
            <Search size={19} className="search-icon" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") searchKnowledge();
              }}
              placeholder="e.g. high wave advisory, ocean state forecast, INCOIS..."
              aria-label="Marine knowledge search"
            />
            <button onClick={searchKnowledge} disabled={!query.trim() || loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          <div className="search-hint">
            Semantic retrieval · ranked evidence · source attribution
          </div>
        </div>

        {!searched && (
          <div className="knowledge-grid">
            <div className="card knowledge-intro">
              <div className="icon-box"><BookOpen size={22} /></div>
              <h2>Evidence-backed marine knowledge</h2>
              <p>
                Find relevant marine advisories, forecasts, bulletins and
                knowledge documents already connected to ORCA.
              </p>
              <div className="capability-list">
                <span>✓ Semantic retrieval</span>
                <span>✓ Relevance ranking</span>
                <span>✓ Source metadata</span>
                <span>✓ Retrieval timestamp</span>
              </div>
            </div>

            <div className="card source-card">
              <div className="card-title">CONNECTED KNOWLEDGE</div>
              <div className="source-row">
                <div className="source-mark">IN</div>
                <div>
                  <strong>INCOIS</strong>
                  <span>Marine information & advisories</span>
                </div>
                <span className="available">CONNECTED</span>
              </div>
              <div className="source-note">
                Results are shown only when evidence is returned by the
                connected retrieval layer. Missing information is not invented.
              </div>
            </div>
          </div>
        )}

        {searched && (
          <div className="results-layout">
            <div className="results-column">
              <div className="section-head">
                <div>
                  <span className="section-kicker">RETRIEVAL RESULTS</span>
                  <h2>{results.length} relevant result{results.length === 1 ? "" : "s"}</h2>
                </div>
                {retrievedAt && (
                  <span className="retrieved">
                    Retrieved {new Date(retrievedAt).toLocaleTimeString("en-IN")}
                  </span>
                )}
              </div>

              {error && (
                <div className="empty-state card">
                  <BookOpen size={22} />
                  <strong>No evidence available</strong>
                  <p>{error}</p>
                </div>
              )}

              {results.map((result, index) => (
                <button
                  key={`${result.title}-${index}`}
                  className={`result-card card ${selected === result ? "selected" : ""}`}
                  onClick={() => setSelected(result)}
                >
                  <div className="result-topline">
                    <span className="result-number">0{index + 1}</span>
                    <span className="result-source">{result.source}</span>
                  </div>
                  <h3>{result.title}</h3>
                  <p>{result.content.slice(0, 260)}{result.content.length > 260 ? "..." : ""}</p>
                  <div className="result-footer">
                    <span>
                      Relevance {result.similarity !== null
                        ? `${Math.round(result.similarity * 100)}%`
                        : "Unavailable"}
                    </span>
                    <span>View evidence →</span>
                  </div>
                </button>
              ))}
            </div>

            <aside className="evidence-panel card">
              {selected ? (
                <>
                  <div className="evidence-kicker">SELECTED EVIDENCE</div>
                  <h2>{selected.title}</h2>
                  <div className="evidence-meta">
                    <span>Source</span>
                    <strong>{selected.source}</strong>
                  </div>
                  <div className="evidence-meta">
                    <span>Relevance</span>
                    <strong>
                      {selected.similarity !== null
                        ? `${Math.round(selected.similarity * 100)}%`
                        : "Unavailable"}
                    </strong>
                  </div>
                  <div className="evidence-divider" />
                  <div className="evidence-label">RETRIEVED CONTENT</div>
                  <p className="evidence-content">{selected.content}</p>
                  <div className="evidence-warning">
                    <span>i</span>
                    Evidence is retrieved content. ORCA does not treat missing
                    information as a positive or negative finding.
                  </div>
                </>
              ) : (
                <div className="select-placeholder">
                  <BookOpen size={28} />
                  <strong>Select a result</strong>
                  <span>Its retrieved evidence will appear here.</span>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>

      <style jsx global>{`
        .knowledge-main { overflow-y: auto; padding-bottom: 28px; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; margin-bottom:18px; }
        .eyebrow,.search-label,.section-kicker,.evidence-kicker,.evidence-label { font-size:10px; letter-spacing:.16em; font-weight:700; color:#64748b; }
        .page-header h1 { margin:7px 0 5px; font-size:30px; letter-spacing:-.03em; color:#f8fafc; }
        .page-header p { margin:0; max-width:700px; color:#94a3b8; font-size:13px; line-height:1.6; }
        .header-status { display:flex; align-items:center; gap:8px; padding:8px 11px; border:1px solid rgba(34,211,238,.16); border-radius:10px; background:rgba(34,211,238,.05); color:#67e8f9; font-size:10px; letter-spacing:.12em; font-weight:700; }
        .status-dot { width:6px; height:6px; border-radius:50%; background:#22d3ee; box-shadow:0 0 10px rgba(34,211,238,.7); }
        .card { border:1px solid rgba(148,163,184,.12); background:linear-gradient(145deg,rgba(15,23,42,.82),rgba(10,18,32,.72)); border-radius:15px; box-shadow:0 12px 35px rgba(0,0,0,.12); }
        .knowledge-search { padding:16px; margin-bottom:16px; }
        .search-row { display:flex; align-items:center; gap:10px; margin-top:9px; }
        .search-icon { color:#22d3ee; flex:0 0 auto; }
        .search-row input { flex:1; min-width:0; border:0; outline:0; background:transparent; color:#e2e8f0; font-size:14px; padding:9px 2px; }
        .search-row input::placeholder { color:#475569; }
        .search-row button { border:0; border-radius:9px; padding:10px 17px; background:#22d3ee; color:#07111f; font-weight:800; font-size:12px; cursor:pointer; }
        .search-row button:disabled { opacity:.45; cursor:not-allowed; }
        .search-hint { margin-top:8px; color:#475569; font-size:10px; }
        .knowledge-grid { display:grid; grid-template-columns:1.4fr 1fr; gap:16px; }
        .knowledge-intro,.source-card { padding:22px; }
        .icon-box { width:44px; height:44px; display:grid; place-items:center; border-radius:12px; color:#67e8f9; background:rgba(34,211,238,.08); margin-bottom:15px; }
        .knowledge-intro h2 { margin:0 0 8px; color:#f1f5f9; font-size:19px; }
        .knowledge-intro p { margin:0; color:#94a3b8; font-size:13px; line-height:1.7; max-width:650px; }
        .capability-list { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:18px; color:#a5f3fc; font-size:11px; }
        .card-title { color:#64748b; font-size:10px; letter-spacing:.15em; font-weight:700; margin-bottom:17px; }
        .source-row { display:flex; align-items:center; gap:11px; }
        .source-mark { width:38px; height:38px; border-radius:10px; display:grid; place-items:center; background:rgba(34,211,238,.1); color:#67e8f9; font-weight:800; font-size:12px; }
        .source-row strong { display:block; color:#e2e8f0; font-size:13px; }
        .source-row span:not(.available) { display:block; color:#64748b; font-size:11px; margin-top:3px; }
        .available { margin-left:auto; color:#86efac; font-size:9px; letter-spacing:.1em; font-weight:700; }
        .source-note { margin-top:20px; padding-top:15px; border-top:1px solid rgba(148,163,184,.1); color:#64748b; font-size:11px; line-height:1.6; }
        .results-layout { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr); gap:16px; align-items:start; }
        .section-head { display:flex; align-items:end; justify-content:space-between; margin-bottom:11px; }
        .section-head h2 { margin:5px 0 0; color:#f1f5f9; font-size:17px; }
        .retrieved { color:#64748b; font-size:10px; }
        .result-card { width:100%; text-align:left; padding:16px; margin-bottom:10px; color:inherit; cursor:pointer; transition:.18s ease; }
        .result-card:hover,.result-card.selected { border-color:rgba(34,211,238,.32); transform:translateY(-1px); }
        .result-topline,.result-footer { display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .result-number { color:#22d3ee; font-size:10px; font-weight:800; }
        .result-source { color:#64748b; font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .result-card h3 { margin:10px 0 6px; color:#e2e8f0; font-size:14px; }
        .result-card p { margin:0; color:#94a3b8; font-size:11px; line-height:1.65; }
        .result-footer { margin-top:13px; padding-top:10px; border-top:1px solid rgba(148,163,184,.08); color:#64748b; font-size:9px; }
        .result-footer span:last-child { color:#67e8f9; }
        .evidence-panel { padding:20px; position:sticky; top:0; min-height:390px; }
        .evidence-panel h2 { color:#f1f5f9; font-size:18px; line-height:1.35; margin:8px 0 17px; }
        .evidence-meta { display:flex; justify-content:space-between; gap:15px; margin:8px 0; font-size:10px; }
        .evidence-meta span { color:#64748b; }
        .evidence-meta strong { color:#cbd5e1; text-align:right; }
        .evidence-divider { height:1px; background:rgba(148,163,184,.1); margin:18px 0; }
        .evidence-content { color:#cbd5e1; font-size:11px; line-height:1.75; white-space:pre-wrap; max-height:420px; overflow:auto; }
        .evidence-warning { display:flex; gap:8px; margin-top:18px; padding:10px; border:1px solid rgba(251,191,36,.12); border-radius:9px; color:#94a3b8; font-size:9px; line-height:1.5; }
        .evidence-warning span { color:#fbbf24; font-weight:800; }
        .empty-state { padding:30px; text-align:center; color:#64748b; }
        .empty-state strong { display:block; margin-top:10px; color:#cbd5e1; font-size:13px; }
        .empty-state p { margin:7px 0 0; font-size:11px; }
        .select-placeholder { min-height:350px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#475569; text-align:center; }
        .select-placeholder strong { color:#94a3b8; font-size:13px; }
        .select-placeholder span { font-size:10px; }
        @media (max-width: 1050px) { .knowledge-grid,.results-layout { grid-template-columns:1fr; } .evidence-panel { position:static; } }
        @media (max-width: 700px) { .page-header { flex-direction:column; } .capability-list { grid-template-columns:1fr; } }
      `}</style>
    </main>
  );
}
