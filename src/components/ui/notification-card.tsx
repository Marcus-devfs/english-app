"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { useState } from "react";

interface NotificationCardProps {
  id: string;
  type: "achievement" | "reminder" | "streak" | "tip" | "level_up";
  title: string;
  message: string;
  onDismiss?: (id: string) => void;
}

const typeStyles = {
  achievement: "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50",
  reminder: "border-norte-blue/20 bg-gradient-to-r from-norte-blue-light to-white",
  streak: "border-orange-200 bg-gradient-to-r from-orange-50 to-red-50",
  tip: "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50",
  level_up: "border-norte-blue/20 bg-gradient-to-r from-norte-blue-light to-white",
};

export function NotificationCard({ id, type, title, message, onDismiss }: NotificationCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "relative flex gap-3 p-4 rounded-2xl border animate-in slide-in-from-top-2 duration-300",
        typeStyles[type]
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm">{title}</p>
        <p className="text-sm text-slate-600 mt-0.5">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss(id);
          }}
          className="shrink-0 p-1 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
