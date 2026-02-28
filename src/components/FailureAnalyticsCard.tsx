import { AnalysisResult } from "@/types";
import { ScanningState } from "./ScanningState";
import { EmptyCard } from "./EmptyCard";

export function FailureAnalyticsCard({
  result,
  loading,
}: {
  result: AnalysisResult | null;
  loading: boolean;
}) {
  return (
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
  );
}
