import { Stats } from "@/types";

export function Footer({ stats }: { stats: Stats | null }) {
  return (
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
  );
}
