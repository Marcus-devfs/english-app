import { cn } from "@/lib/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "info" | "level";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variant === "default" && "bg-slate-100 text-slate-700",
        variant === "success" && "bg-emerald-100 text-norte-green",
        variant === "warning" && "bg-amber-100 text-amber-700",
        variant === "info" && "bg-norte-blue-light text-norte-blue",
        variant === "level" && "bg-norte-blue-light text-norte-blue",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
