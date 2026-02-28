"use client";

import { useEffect, useState, useRef } from "react";

interface TopFailure {
  partName: string;
  count: number;
}

interface AD {
  adNumber: string;
  subject: string;
  adLink: string | null;
  applicable: boolean;
  confidence: number;
  reasoning: string;
}

interface AnalysisResult {
  tailNumber: string;
  matchType: string;
  registry: Record<string, string> | null;
  count: number;
  topFailures: TopFailure[];
  ads: AD[];
  riskScore: number;
  failedCount: number;
  excessWearCount: number;
  applicableCount: number;
  totalADsMatched: number;
}

interface Stats {
  sdrCount: number;
  adCount: number;
  aircraftTracked: number;
  supabaseOk: boolean;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({ sdrCount: 0, adCount: 0, aircraftTracked: 56041, supabaseOk: false }));

    // Initialize theme from localStorage
    const saved = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (saved) setTheme(saved);

    // Load search history
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Keyboard shortcut: Cmd+K to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Apply theme
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    
    if (theme === "system") {
      root.style.colorScheme = "light dark";
      root.removeAttribute("data-theme");
    } else {
      root.style.colorScheme = theme;
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };

  const addToHistory = (tailNumber: string) => {
    const newHistory = [tailNumber, ...history.filter(h => h !== tailNumber)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `AeroGuard Analysis - ${result.registry?.model || "Unknown"} S/N ${result.registry?.serialNumber || "Unknown"}
Risk Score: ${result.riskScore}/100
Applicable ADs: ${result.applicableCount}/${result.totalADsMatched}
Top Failures: ${result.topFailures.map(f => `${f.partName} (${f.count}x)`).join(", ")}`;
    
    navigator.clipboard.writeText(text).then(() => {
      showToast("Analysis copied to clipboard!");
    });
  };

  async function handleAnalyze() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tailNumber: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
      addToHistory(trimmed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function riskColor(score: number) {
    if (score > 70) return "text-accent-rose";
    if (score > 30) return "text-accent-amber";
    return "text-accent-emerald";
  }

  function riskLabel(score: number) {
    if (score > 70) return "High";
    if (score > 30) return "Moderate";
    return "Low";
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <nav className="w-full border-b border-card-border bg-card-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
              <svg
                className="h-5 w-5 text-accent-cyan"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              AeroGuard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card-bg/50 text-foreground transition-all hover:border-accent-cyan/30 hover:bg-card-bg/80 hover:text-accent-cyan group"
              title={`Theme: ${theme} (click to cycle)`}
            >
              {/* Sun icon - shows in light mode */}
              <svg
                className={`h-5 w-5 absolute transition-all duration-300 ${
                  theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              
              {/* Moon icon - shows in dark mode */}
              <svg
                className={`h-5 w-5 absolute transition-all duration-300 ${
                  theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>

              {/* System icon - shows in system mode */}
              <svg
                className={`h-5 w-5 absolute transition-all duration-300 ${
                  theme === "system" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg>
            </button>

            <a
              href="https://github.com/sabbasov/aeroguard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-card-border bg-card-bg px-4 py-1.5 text-foreground/80 transition hover:border-accent-cyan/30 hover:text-accent-cyan"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <section className="flex flex-col items-center px-6 pt-20 pb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 px-4 py-1.5 text-xs font-medium text-accent-cyan">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
          </span>
          FAA Data Sync — Live
        </div>

        <h1 className="max-w-2xl text-center text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Aviation Safety &{" "}
          <span className="bg-gradient-to-r from-accent-cyan to-accent-emerald bg-clip-text text-transparent">
            Compliance Intelligence
          </span>
        </h1>

        <p className="mt-4 max-w-lg text-center text-base leading-relaxed text-foreground/50">
          Cross-reference FAA Service Difficulty Reports with Airworthiness
          Directives. Enter a tail number to begin analysis.
        </p>

        <div className="relative w-full max-w-2xl">
          <form
            className="glass-card search-glow mt-10 flex items-center gap-3 border border-card-border px-5 py-3 transition-all"
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyze();
            }}
          >
            <svg
              className="h-5 w-5 shrink-0 text-foreground/30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowHistory(true);
              }}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              placeholder="Search by Aircraft Tail Number (e.g. N12345)"
              className="w-full bg-transparent text-base text-foreground placeholder-foreground/30 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-lg bg-accent-cyan px-5 py-2 text-sm font-semibold text-background transition hover:bg-accent-cyan/90 active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? "Scanning…" : "Analyze"}
            </button>
          </form>

          {/* Search History Dropdown */}
          {showHistory && history.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-card border border-card-border z-50">
              <div className="max-h-64 overflow-y-auto">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(item);
                      setShowHistory(false);
                      setTimeout(() => {
                        const formElement = document.querySelector("form");
                        if (formElement) {
                          const event = new Event("submit", { bubbles: true });
                          formElement.dispatchEvent(event);
                        }
                      }, 0);
                    }}
                    className="block w-full px-5 py-3 text-left text-sm text-foreground/80 hover:bg-card-bg transition border-b border-card-border last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 text-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                      <span className="font-mono text-foreground/70">{item}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {result?.registry && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
            {result.registry.manufacturer && (
              <span className="rounded-full border border-card-border bg-card-bg px-3 py-1 text-foreground/60">
                {result.registry.manufacturer} {result.registry.model}
              </span>
            )}
            {result.registry.serialNumber && (
              <span className="rounded-full border border-card-border bg-card-bg px-3 py-1 font-mono text-foreground/50">
                S/N {result.registry.serialNumber}
              </span>
            )}
            {result.matchType === "model_fallback" && (
              <span className="rounded-full border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-accent-amber text-xs">
                No tail match — showing model-wide data
              </span>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-foreground/40">
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground/70">
              {stats ? stats.sdrCount.toLocaleString() : "—"}
            </span>
            <span>SDRs Indexed</span>
          </div>
          <div className="h-4 w-px bg-card-border" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground/70">
              {stats ? stats.adCount.toLocaleString() : "—"}
            </span>
            <span>Active ADs</span>
          </div>
          <div className="h-4 w-px bg-card-border" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground/70">
              {stats ? stats.aircraftTracked.toLocaleString() : "—"}
            </span>
            <span>Aircraft Tracked</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-5 py-3 text-sm text-accent-rose">
          {error}
        </div>
      )}

      <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Maintenance Risk Score - Larger left column */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="glass-card flex flex-col p-6 h-full">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-emerald/10 border border-accent-emerald/20">
                    <svg
                      className="h-5 w-5 text-accent-emerald"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Maintenance Risk Score
                    </h2>
                    <p className="text-xs text-foreground/40">
                      Composite risk assessment
                    </p>
                  </div>
                </div>
                {result && (
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg hover:bg-card-bg transition text-foreground/60 hover:text-foreground"
                    aria-label="Copy analysis to clipboard"
                    title="Copy to clipboard"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                  </button>
                )}
              </div>

              {loading ? (
                <ScanningState />
              ) : result ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
                  <div className="relative flex h-28 w-28 items-center justify-center">
                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        className="text-card-border"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        className={riskColor(result.riskScore)}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${result.riskScore * 2.64} 264`}
                      />
                    </svg>
                    <span
                      className={`text-3xl font-bold ${riskColor(result.riskScore)}`}
                    >
                      {result.riskScore}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      result.riskScore > 70
                        ? "bg-accent-rose/10 text-accent-rose"
                        : result.riskScore > 30
                          ? "bg-accent-amber/10 text-accent-amber"
                          : "bg-accent-emerald/10 text-accent-emerald"
                    }`}
                  >
                    {riskLabel(result.riskScore)} Risk
                  </span>

                  <div className="w-full space-y-2 text-xs text-foreground/50 mt-2">
                    <div className="flex justify-between border-t border-card-border pt-2">
                      <span>Base</span>
                      <span className="font-mono text-foreground/70">+10pts</span>
                    </div>
                    <div className="flex justify-between border-t border-card-border pt-2">
                      <span>Applicable ADs (AI)</span>
                      <span className="font-mono text-foreground/70">
                        +{result.applicableCount * 40}pts
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-card-border pt-2">
                      <span>Failed / Cracked</span>
                      <span className="font-mono text-foreground/70">
                        +{result.failedCount * 10}pts
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-card-border pt-2">
                      <span>Excess Wear</span>
                      <span className="font-mono text-foreground/70">
                        +{result.excessWearCount * 2}pts
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyCard
                  color="emerald"
                  icon={
                    <>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M10 12v2m4-2v2" strokeLinecap="round" />
                    </>
                  }
                  text="Enter a tail number to view risk assessment"
                />
              )}
            </div>
          </div>

          {/* Right column with 2 cards stacked */}
          <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Failure Analytics */}
          <div className="glass-card flex flex-col p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-rose/10 border border-accent-rose/20">
                <svg
                  className="h-5 w-5 text-accent-rose"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Failure Analytics
                </h2>
                <p className="text-xs text-foreground/40">
                  SDR pattern recognition
                </p>
              </div>
            </div>

            {loading ? (
              <ScanningState />
            ) : result && result.topFailures.length > 0 ? (
              <div className="flex flex-1 flex-col gap-3">
                <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">
                  Top Part Failures ({result.count} SDRs)
                </p>
                {result.topFailures.map((f, i) => (
                  <div
                    key={f.partName}
                    className="flex items-center justify-between rounded-lg border border-card-border bg-card-bg/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-rose/10 text-xs font-bold text-accent-rose">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground/80">
                        {f.partName}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-accent-rose">
                      {f.count}×
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyCard
                color="rose"
                icon={
                  <>
                    <path d="M3 3v18h18" />
                    <path
                      d="m7 16 4-8 4 5 4-10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                }
                text="Enter a tail number to view failure trends"
              />
            )}
          </div>

          {/* Legal Compliance */}
          <div className="glass-card flex flex-col p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-amber/10 border border-accent-amber/20">
                <svg
                  className="h-5 w-5 text-accent-amber"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Legal Compliance
                </h2>
                <p className="text-xs text-foreground/40">
                  Airworthiness Directives
                </p>
              </div>
            </div>

            {loading ? (
              <ScanningState />
            ) : result && result.ads.length > 0 ? (
              <div className="flex flex-1 flex-col gap-3">
                <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1">
                  {result.applicableCount} of {result.totalADsMatched} ADs applicable
                </p>
                {result.ads.map((ad) => {
                  const borderColor = ad.applicable
                    ? "border-accent-rose/40"
                    : "border-accent-emerald/30";
                  const bgColor = ad.applicable
                    ? "bg-accent-rose/5"
                    : "bg-accent-emerald/5";
                  const accentColor = ad.applicable
                    ? "text-accent-rose"
                    : "text-accent-emerald";
                  return (
                    <div
                      key={ad.adNumber}
                      className={`rounded-lg border ${borderColor} ${bgColor} p-4`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            ad.applicable ? "bg-accent-rose/15" : "bg-accent-emerald/15"
                          }`}
                        >
                          {ad.applicable ? (
                            <svg className="h-4 w-4 text-accent-rose" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-accent-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-wider ${accentColor}`}>
                              {ad.applicable ? "Applicable" : "Not Applicable"}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              ad.applicable
                                ? "bg-accent-rose/20 text-accent-rose"
                                : "bg-accent-emerald/20 text-accent-emerald"
                            }`}>
                              {ad.confidence}% confidence
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground/90 mb-1">
                            AD {ad.adNumber}
                          </p>
                          <p className="text-xs text-foreground/50 mb-2">
                            {ad.subject}
                          </p>
                          <div className="rounded-md border border-card-border bg-card-bg/60 px-3 py-2 mb-3">
                            <p className="text-xs text-foreground/60 italic leading-relaxed">
                              <span className="font-semibold text-accent-cyan not-italic">AI: </span>
                              {ad.reasoning}
                            </p>
                          </div>
                          {ad.adLink && (
                            <a
                              href={ad.adLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5 text-xs font-semibold text-accent-amber transition hover:bg-accent-amber/20"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              View Full AD
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyCard
                color="amber"
                icon={
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 12h6M9 16h3" strokeLinecap="round" />
                    <path d="M9 8h6" strokeLinecap="round" />
                  </>
                }
                text={
                  result
                    ? "No applicable ADs found for this aircraft"
                    : "AD compliance status will appear here"
                }
              />
            )}
          </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-card-border bg-card-bg/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs text-foreground/30">
          <span>© 2026 AeroGuard — Aviation Safety Intelligence</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full animate-pulse ${
                stats === null
                  ? "bg-foreground/20"
                  : stats.supabaseOk
                    ? "bg-accent-emerald"
                    : "bg-accent-amber"
              }`}
            />
            {stats === null
              ? "Connecting…"
              : stats.supabaseOk
                ? "All Systems Operational"
                : "Supabase Connection Issue"}
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in">
          <div className="glass-card border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm text-accent-emerald">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScanningState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 animate-ping rounded-full bg-accent-cyan" />
        <span className="h-2 w-2 animate-ping rounded-full bg-accent-cyan [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-ping rounded-full bg-accent-cyan [animation-delay:300ms]" />
      </div>
      <p className="text-sm text-accent-cyan/70 animate-pulse">
        Scanning FAA Registry…
      </p>
    </div>
  );
}

function EmptyCard({
  color,
  icon,
  text,
}: {
  color: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-card-border py-12">
      <div
        className={`mb-3 h-10 w-10 rounded-full bg-accent-${color}/5 flex items-center justify-center`}
      >
        <svg
          className="h-5 w-5 text-foreground/20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {icon}
        </svg>
      </div>
      <p className="text-sm text-foreground/30">{text}</p>
    </div>
  );
}
