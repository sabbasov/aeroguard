import React from "react";

const colorBgMap: Record<string, string> = {
  emerald: "bg-accent-emerald/5",
  rose: "bg-accent-rose/5",
  amber: "bg-accent-amber/5",
};

export function EmptyCard({
  color,
  icon,
  text,
}: {
  color: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-card-border py-12">
      <div
        className={`mb-3 h-10 w-10 rounded-full ${colorBgMap[color] ?? "bg-accent-emerald/5"} flex items-center justify-center`}
      >
        <svg
          className="h-5 w-5 text-foreground/20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {icon}
        </svg>
      </div>
      <p className="text-sm text-foreground/30">{text}</p>
    </div>
  );
}
