import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: "indigo" | "emerald" | "amber" | "violet";
  className?: string;
}

export function ProgressBar({ value, max = 100, label, color = "indigo", className }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{label}</span>
          <span className="font-medium text-slate-900">{pct}%</span>
        </div>
      )}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color === "indigo" && "bg-indigo-500",
            color === "emerald" && "bg-emerald-500",
            color === "amber" && "bg-amber-500",
            color === "violet" && "bg-violet-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
