import { AnalysisResult } from "@/types";
import { ScanningState } from "./ScanningState";
import { EmptyCard } from "./EmptyCard";

export function ADComplianceCard({
  result,
  loading,
}: {
  result: AnalysisResult | null;
  loading: boolean;
}) {
  return (
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
  );
}
