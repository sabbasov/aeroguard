export function AircraftInfo({
  registry,
  matchType,
}: {
  registry: Record<string, string> | null;
  matchType: string;
}) {
  if (!registry) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
      {registry.manufacturer && (
        <span className="rounded-full border border-card-border bg-card-bg px-3 py-1 text-foreground/60">
          {registry.manufacturer} {registry.model}
        </span>
      )}
      {registry.serialNumber && (
        <span className="rounded-full border border-card-border bg-card-bg px-3 py-1 font-mono text-foreground/50">
          S/N {registry.serialNumber}
        </span>
      )}
      {matchType === "model_fallback" && (
        <span className="rounded-full border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-accent-amber text-xs">
          No tail match — showing model-wide data
        </span>
      )}
    </div>
  );
}
