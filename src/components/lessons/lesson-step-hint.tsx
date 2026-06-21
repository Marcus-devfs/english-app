"use client";

import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepHint } from "@/lib/lessons/build-steps";
import { cn } from "@/lib/utils/cn";

interface LessonStepHintProps {
  hint: StepHint;
  open: boolean;
  onToggle: () => void;
  className?: string;
}

export function LessonStepHint({ hint, open, onToggle, className }: LessonStepHintProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="text-norte-yellow hover:bg-amber-50 hover:text-amber-700 -ml-2"
      >
        <Lightbulb className="h-4 w-4" />
        {open ? "Ocultar dica" : "Precisa de ajuda?"}
      </Button>

      {open && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2 animate-in">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-amber-900">{hint.title}</p>
            <button
              type="button"
              onClick={onToggle}
              className="text-amber-600 hover:text-amber-800 shrink-0"
              aria-label="Fechar dica"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-amber-900/90 leading-relaxed">{hint.body}</p>
          {hint.extra && (
            <p className="text-xs text-amber-800/80 leading-relaxed border-t border-amber-200/80 pt-2">
              {hint.extra}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
