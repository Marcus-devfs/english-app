"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GOAL_LABELS, type LearningGoal } from "@/types";

interface GoalPickerSheetProps {
  open: boolean;
  value: LearningGoal;
  onClose: () => void;
  onChange: (goal: LearningGoal) => void;
  title: string;
}

export function GoalPickerSheet({
  open,
  value,
  onClose,
  onChange,
  title,
}: GoalPickerSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-picker-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-norte-ink/50 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-t-3xl bg-white p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="goal-picker-title" className="text-base font-bold text-norte-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto overscroll-contain">
          {(Object.keys(GOAL_LABELS) as LearningGoal[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                onChange(g);
                onClose();
              }}
              className={cn(
                "w-full rounded-xl px-4 py-3.5 text-left text-sm transition-all",
                value === g
                  ? "bg-norte-blue-light font-medium text-norte-blue"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {GOAL_LABELS[g]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
