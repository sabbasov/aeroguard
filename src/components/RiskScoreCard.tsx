import { AnalysisResult } from "@/types";
import { riskColor, riskLabel } from "@/lib/utils";
import { generateReport } from "@/lib/generateReport";
import { ScanningState } from "./ScanningState";
import { EmptyCard } from "./EmptyCard";

export function RiskScoreCard({
  result,
  loading,
  onCopyToClipboard,
}: {
  result: AnalysisResult | null;
  loading: boolean;
  onCopyToClipboard: () => void;
}) {
  function handleExportPDF() {
    if (!result) return;
    generateReport({
      tailNumber: result.tailNumber,
      matchType: result.matchType,
      registry: result.registry,
      count: result.count,
      topFailures: result.topFailures,
      ads: result.ads.map((ad) => ({
        adNumber: ad.adNumber,
        subject: ad.subject,
        applicable: ad.applicable,
        confidence: ad.confidence,
        reasoning: ad.reasoning,
      })),
      riskScore: result.riskScore,
      failedCount: result.failedCount,
      excessWearCount: result.excessWearCount,
      applicableCount: result.applicableCount,
      totalADsMatched: result.totalADsMatched,
    });
  }

  return (
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
            <div className="flex items-center gap-1">
              <button
                onClick={onCopyToClipboard}
                className="p-2 rounded-lg hover:bg-card-bg transition text-foreground/60 hover:text-foreground"
                aria-label="Copy analysis to clipboard"
                title="Copy to clipboard"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </button>
              <button
                onClick={handleExportPDF}
                className="p-2 rounded-lg hover:bg-card-bg transition text-foreground/60 hover:text-foreground"
                aria-label="Export PDF report"
                title="Export PDF"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
              </button>
            </div>
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
  );
}
