export function ScanningState() {
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
