import { Stats } from "@/types";

export function StatsBar({ stats }: { stats: Stats | null }) {
  return (
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
  );
}
