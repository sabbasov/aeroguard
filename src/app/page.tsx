export default function Home() {
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
            <button className="rounded-lg border border-card-border bg-card-bg px-4 py-1.5 text-foreground/80 transition hover:border-accent-cyan/30 hover:text-accent-cyan">
              Sign In
            </button>
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

        <div className="glass-card search-glow mt-10 flex w-full max-w-2xl items-center gap-3 border border-card-border px-5 py-3 transition-all">
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
            placeholder="Search by Aircraft Tail Number (e.g. N12345)"
            className="w-full bg-transparent text-base text-foreground placeholder-foreground/30 outline-none"
          />
          <button className="shrink-0 rounded-lg bg-accent-cyan px-5 py-2 text-sm font-semibold text-background transition hover:bg-accent-cyan/90 active:scale-[0.97]">
            Analyze
          </button>
        </div>

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

      <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-8">
        <div className="grid gap-6 md:grid-cols-3">
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

            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-card-border py-12">
              <div className="mb-3 h-10 w-10 rounded-full bg-accent-rose/5 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-foreground/20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 3v18h18" />
                  <path d="m7 16 4-8 4 5 4-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-foreground/30">
                Enter a tail number to view failure trends
              </p>
            </div>
          </div>

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

            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-card-border py-12">
              <div className="mb-3 h-10 w-10 rounded-full bg-accent-amber/5 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-foreground/20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12h6M9 16h3" strokeLinecap="round" />
                  <path d="M9 8h6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-foreground/30">
                AD compliance status will appear here
              </p>
            </div>
          </div>

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
                  AI-powered risk assessment
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-card-border py-12">
              <div className="mb-3 h-10 w-10 rounded-full bg-accent-emerald/5 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-foreground/20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-foreground/30">
                Risk score calculated after analysis
              </p>
            </div>
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
