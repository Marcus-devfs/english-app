import { cn } from "@/lib/utils/cn";

type ProBadgeSize = "xs" | "sm" | "md";

const sizeClasses: Record<ProBadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[8px] tracking-[0.14em]",
  sm: "px-2 py-0.5 text-[9px] tracking-[0.16em]",
  md: "px-2.5 py-1 text-[10px] tracking-[0.18em]",
};

interface ProBadgeProps {
  size?: ProBadgeSize;
  label?: string;
  className?: string;
}

/** Black-client PRO badge — premium dark styling */
export function ProBadge({ size = "sm", label = "PRO", className }: ProBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold uppercase",
        "bg-norte-ink text-white shadow-sm ring-1 ring-black/10",
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}

interface ProBlackCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ProBlackCard({ children, className }: ProBlackCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-norte-ink text-white p-4 relative overflow-hidden",
        className
      )}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5" />
      <div className="relative">{children}</div>
    </div>
  );
}
