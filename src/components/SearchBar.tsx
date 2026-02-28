"use client";

import React from "react";

export function SearchBar({
  query,
  onQueryChange,
  onSubmit,
  loading,
  history,
  showHistory,
  onShowHistoryChange,
  searchInputRef,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  loading: boolean;
  history: string[];
  showHistory: boolean;
  onShowHistoryChange: (show: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative w-full max-w-2xl">
      <form
        className="glass-card search-glow mt-10 flex items-center gap-3 border border-card-border px-5 py-3 transition-all"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
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
            onQueryChange(e.target.value);
            onShowHistoryChange(true);
          }}
          onFocus={() => onShowHistoryChange(true)}
          onBlur={() => setTimeout(() => onShowHistoryChange(false), 200)}
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
                  onQueryChange(item);
                  onShowHistoryChange(false);
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
  );
}
