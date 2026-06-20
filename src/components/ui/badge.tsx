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
        variant === "success" && "bg-emerald-100 text-emerald-700",
        variant === "warning" && "bg-amber-100 text-amber-700",
        variant === "info" && "bg-indigo-100 text-indigo-700",
        variant === "level" && "bg-violet-100 text-violet-700",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
