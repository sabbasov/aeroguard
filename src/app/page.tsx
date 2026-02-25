"use client";

import { useState } from "react";

interface TopFailure {
  partName: string;
  count: number;
}

interface AD {
  adNumber: string;
  subject: string;
  status: string;
  pdfPath: string;
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
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function riskColor(score: number) {
    if (score >= 70) return "text-accent-rose";
    if (score >= 40) return "text-accent-amber";
    return "text-accent-emerald";
  }

  function riskLabel(score: number) {
    if (score >= 70) return "High";
    if (score >= 40) return "Moderate";
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

          <div className="hidden items-center gap-6 text-sm font-medium text-foreground/60 sm:flex">
            <a href="#" className="transition hover:text-accent-cyan">
              Dashboard
            </a>
            <a href="#" className="transition hover:text-accent-cyan">
              Reports
            </a>
            <a href="#" className="transition hover:text-accent-cyan">
              Fleet
            </a>
            <div className="h-4 w-px bg-card-border" />
            <a
              href="https://github.com/sabuhiabbasov/aeroguard"
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

        <form
          className="glass-card search-glow mt-10 flex w-full max-w-2xl items-center gap-3 border border-card-border px-5 py-3 transition-all"
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
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
            <span className="font-mono text-foreground/70">142,389</span>
            <span>SDRs Indexed</span>
          </div>
          <div className="h-4 w-px bg-card-border" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground/70">8,217</span>
            <span>Active ADs</span>
          </div>
          <div className="h-4 w-px bg-card-border" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground/70">56,041</span>
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
        <div className="grid gap-6 md:grid-cols-3">
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
                {result.ads.map((ad) => (
                  <div
                    key={ad.adNumber}
                    className="rounded-lg border border-accent-amber/30 bg-accent-amber/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-amber/15">
                        <svg
                          className="h-4 w-4 text-accent-amber"
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">
                            Safety Alert
                          </span>
                          <span className="rounded-full bg-accent-amber/20 px-2 py-0.5 text-[10px] font-semibold text-accent-amber">
                            {ad.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground/90 mb-1">
                          AD {ad.adNumber}
                        </p>
                        <p className="text-xs text-foreground/50 mb-3">
                          {ad.subject}
                        </p>
                        <a
                          href={ad.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5 text-xs font-semibold text-accent-amber transition hover:bg-accent-amber/20"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          Read Full AD
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
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

          {/* Maintenance Risk Score */}
          <div className="glass-card flex flex-col p-6">
            <div className="mb-4 flex items-center gap-3">
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
                    result.riskScore >= 70
                      ? "bg-accent-rose/10 text-accent-rose"
                      : result.riskScore >= 40
                        ? "bg-accent-amber/10 text-accent-amber"
                        : "bg-accent-emerald/10 text-accent-emerald"
                  }`}
                >
                  {riskLabel(result.riskScore)} Risk
                </span>

                <div className="w-full space-y-2 text-xs text-foreground/50 mt-2">
                  <div className="flex justify-between border-t border-card-border pt-2">
                    <span>Active ADs</span>
                    <span className="font-mono text-foreground/70">
                      {result.ads.length} (+{result.ads.length * 50}pts)
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-card-border pt-2">
                    <span>Failed SDRs</span>
                    <span className="font-mono text-foreground/70">
                      {result.failedCount} (+{result.failedCount * 10}pts)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyCard
                color="emerald"
                icon={
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path
                      d="M12 7v5l3 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                }
                text="Risk score calculated after analysis"
              />
            )}
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-card-border bg-card-bg/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs text-foreground/30">
          <span>© 2026 AeroGuard — Aviation Safety Intelligence</span>
          <div className="flex items-center gap-1 font-mono">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
            All Systems Operational
          </div>
        </div>
      </footer>
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
