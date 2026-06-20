"use client";

import Link from "next/link";
import { PHRASE_OF_THE_DAY, WEEKLY_GOAL_DAYS } from "@/lib/data/trail";
import { cn } from "@/lib/utils/cn";

export function PhraseOfDayCard() {
  return (
    <div className="rounded-2xl bg-norte-blue-light border border-norte-blue/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-norte-blue mb-2">
        ☀️ Frase do dia
      </p>
      <p className="font-bold text-norte-ink text-sm leading-snug">
        &ldquo;{PHRASE_OF_THE_DAY.phrase}&rdquo;
      </p>
      <p className="text-xs text-slate-600 mt-2">{PHRASE_OF_THE_DAY.meaning}</p>
    </div>
  );
}

export function WeeklyGoalCard({ daysCompleted = 4 }: { daysCompleted?: number }) {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-norte-ink text-sm">Meta semanal</p>
        <p className="text-xs font-bold text-norte-blue">{daysCompleted}/5 dias</p>
      </div>
      <div className="flex justify-between gap-1">
        {WEEKLY_GOAL_DAYS.map((day, i) => {
          const done = i < daysCompleted;
          const isToday = i === todayIndex;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                  done && "bg-norte-green text-white",
                  !done && isToday && "bg-norte-blue text-white ring-2 ring-norte-blue/30",
                  !done && !isToday && "bg-slate-100 text-slate-400"
                )}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AchievementCard({ dialogues = 5 }: { dialogues?: number }) {
  const nextAt = 7;
  return (
    <div className="rounded-2xl bg-emerald-50 border border-norte-green/10 p-4">
      <div className="flex gap-2 mb-3">
        {["🥇", "🔒", "🔒"].map((icon, i) => (
          <div
            key={i}
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-lg",
              i === 0 ? "bg-white shadow-sm" : "bg-white/50"
            )}
          >
            {icon}
          </div>
        ))}
      </div>
      <p className="font-semibold text-norte-ink text-sm">Conquista desbloqueada</p>
      <p className="text-xs text-slate-600 mt-1">
        &ldquo;Conversador&rdquo; — {dialogues} diálogos com a IA. Faltam{" "}
        {Math.max(0, nextAt - dialogues)} para a próxima.
      </p>
    </div>
  );
}

export function StreakAlertCard({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex gap-3">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="font-semibold text-norte-ink text-sm">
          Sua ofensiva de {streak} dias está em risco!
        </p>
        <p className="text-xs text-slate-600 mt-0.5">5 min salvam ela.</p>
        <Link href="/lessons" className="text-xs font-semibold text-norte-blue mt-1 inline-block">
          Continuar agora →
        </Link>
      </div>
    </div>
  );
}
