import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: "blue" | "green" | "yellow" | "ink";
  className?: string;
}

export function ProgressBar({ value, max = 100, label, color = "blue", className }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{label}</span>
          <span className="font-medium text-norte-ink">{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color === "blue" && "bg-norte-blue",
            color === "green" && "bg-norte-green",
            color === "yellow" && "bg-norte-yellow",
            color === "ink" && "bg-norte-ink"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
