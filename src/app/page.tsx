"use client";

import { useEffect, useState, useRef } from "react";
import { AnalysisResult, Stats } from "@/types";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { AircraftInfo } from "@/components/AircraftInfo";
import { StatsBar } from "@/components/StatsBar";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { FailureAnalyticsCard } from "@/components/FailureAnalyticsCard";
import { ADComplianceCard } from "@/components/ADComplianceCard";
import { Footer } from "@/components/Footer";
import { Toast } from "@/components/Toast";

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
    try {
      const savedHistory = localStorage.getItem("searchHistory");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          setHistory(parsed);
        }
      }
    } catch {
      // Ignore invalid data
    }

    // Keyboard shortcut: Cmd+K to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Auto-analyze from URL parameter
    const params = new URLSearchParams(window.location.search);
    const tailParam = params.get("tail");
    if (tailParam && tailParam.length <= 10) {
      setQuery(tailParam);
      setTimeout(() => handleAnalyze(tailParam), 0);
    }

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

  async function handleAnalyze(tailOverride?: string) {
    const trimmed = (tailOverride ?? query).trim();
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

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <Navbar theme={theme} onThemeChange={setTheme} />

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

        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleAnalyze}
          loading={loading}
          history={history}
          showHistory={showHistory}
          onShowHistoryChange={setShowHistory}
          searchInputRef={searchInputRef}
        />

        <AircraftInfo registry={result?.registry ?? null} matchType={result?.matchType ?? ""} />

        <StatsBar stats={stats} />
      </section>

      {error && (
        <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-5 py-3 text-sm text-accent-rose">
          {error}
        </div>
      )}

      <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Maintenance Risk Score - Larger left column */}
          <RiskScoreCard result={result} loading={loading} onCopyToClipboard={copyToClipboard} />

          {/* Right column with 2 cards stacked */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <FailureAnalyticsCard result={result} loading={loading} />
            <ADComplianceCard result={result} loading={loading} />
          </div>
        </div>
      </section>

      <Footer stats={stats} />

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
