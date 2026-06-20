import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all",
          error && "border-red-400 focus:ring-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
