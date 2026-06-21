"use client";

import { cn } from "@/lib/utils/cn";
import type { StepCheckResult } from "@/lib/lessons/build-steps";

interface LessonStepFeedbackProps {
  result: StepCheckResult;
  className?: string;
}

export function LessonStepFeedback({ result, className }: LessonStepFeedbackProps) {
  if (!result.message && result.missing.length === 0 && result.incorrect.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl p-4 text-sm space-y-2",
        result.passed
          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
          : "bg-amber-50 border border-amber-200 text-amber-900",
        className
      )}
    >
      {result.score > 0 && (
        <p className="font-medium">
          {result.passed ? "✓ " : ""}
          {result.score}% de acerto
        </p>
      )}
      {result.message && <p>{result.message}</p>}
      {result.missing.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">
            {result.passed ? "Pode melhorar" : "O que falta ou revisar"}
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            {result.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {result.incorrect.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">
            Corrija
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            {result.incorrect.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
