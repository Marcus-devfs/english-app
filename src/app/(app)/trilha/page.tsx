"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTodayLabel } from "@/lib/data/trail";
import type { TrailDailyState, TrailLessonView } from "@/lib/trail/daily";
import { GOAL_LABELS, type LearningGoal } from "@/types";
import { Check, Lock, Play, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function TrilhaPage() {
  const [trail, setTrail] = useState<TrailDailyState | null>(null);
  const [goal, setGoal] = useState<LearningGoal>("conversation");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trail")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTrail(data.data.trail);
          setGoal(data.data.user.goal ?? "conversation");
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AppShell showHeader={false}>
        <Loading />
      </AppShell>
    );
  }

  const todayLesson = trail?.lessons.find((l) => l.displayStatus === "current");
  const doneTodayLesson = trail?.lessons.find(
    (l) => l.displayStatus === "completed_today"
  );

  return (
    <AppShell showHeader={false}>
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-norte-blue mb-2">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs font-medium capitalize">{getTodayLabel()}</span>
          </div>
          <h1 className="text-2xl font-bold text-norte-ink">Sua trilha</h1>
          <p className="text-sm text-slate-500 mt-1">
            {GOAL_LABELS[goal]} · {trail?.lessonsCompleted ?? 0} lições no total
          </p>
        </div>

        <div
          className={cn(
            "mb-4 rounded-2xl border p-4",
            trail?.todayLessonDone
              ? "bg-emerald-50 border-emerald-200"
              : "bg-norte-blue-light border-norte-blue/10"
          )}
        >
          {trail?.todayLessonDone ? (
            <>
              <p className="text-sm font-medium text-emerald-700">Lição de hoje concluída ✓</p>
              <p className="text-norte-ink font-semibold mt-1">
                {doneTodayLesson?.title}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                A próxima lição desbloqueia amanhã. Você pode revisar as anteriores.
              </p>
            </>
          ) : todayLesson ? (
            <>
              <p className="text-sm font-medium text-norte-blue">Lição de hoje</p>
              <p className="text-norte-ink font-semibold mt-1">{todayLesson.title}</p>
              <Link href={`/lessons?index=${trail?.todayLessonIndex}`}>
                <Button size="sm" className="mt-3">
                  Começar lição de hoje
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-norte-blue">Trilha concluída!</p>
              <p className="text-sm text-slate-600 mt-1">
                Você completou todas as lições deste módulo.
              </p>
            </>
          )}
        </div>

        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          {trail?.module.title}
        </p>

        <div className="relative space-y-0">
          {trail?.lessons.map((lesson, index) => (
            <TrailLessonRow
              key={lesson.id}
              lesson={lesson}
              index={index}
              isLast={index === (trail.lessons.length ?? 0) - 1}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function TrailLessonRow({
  lesson,
  index,
  isLast,
}: {
  lesson: TrailLessonView;
  index: number;
  isLast: boolean;
}) {
  const iconClass = cn(
    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10",
    lesson.displayStatus === "completed" && "bg-norte-green text-white",
    lesson.displayStatus === "completed_today" && "bg-emerald-500 text-white",
    lesson.displayStatus === "current" && "bg-norte-blue text-white ring-4 ring-norte-blue/20",
    (lesson.displayStatus === "locked" || lesson.displayStatus === "locked_tomorrow") &&
      "bg-slate-200 text-slate-400"
  );

  const card = (
    <div
      className={cn(
        "flex-1 mb-4 rounded-2xl p-4 transition-all",
        lesson.displayStatus === "completed" && "bg-white border border-slate-100",
        lesson.displayStatus === "completed_today" && "bg-emerald-50 border border-emerald-200",
        lesson.displayStatus === "current" && "bg-norte-ink text-white shadow-lg",
        (lesson.displayStatus === "locked" || lesson.displayStatus === "locked_tomorrow") &&
          "bg-white/60 border border-slate-100 opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3
            className={cn(
              "font-semibold text-sm",
              lesson.displayStatus === "current" ? "text-white" : "text-norte-ink"
            )}
          >
            {lesson.title}
          </h3>
          <p
            className={cn(
              "text-xs mt-1",
              lesson.displayStatus === "current" ? "text-slate-400" : "text-slate-500"
            )}
          >
            {lesson.subtitle}
          </p>
        </div>
        {lesson.displayStatus === "current" && (
          <Badge className="bg-norte-yellow text-norte-ink shrink-0">Hoje</Badge>
        )}
        {lesson.displayStatus === "completed_today" && (
          <Badge className="bg-emerald-100 text-emerald-800 shrink-0">Hoje ✓</Badge>
        )}
        {lesson.displayStatus === "locked_tomorrow" && (
          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center shrink-0 w-8">
        <div className={iconClass}>
          {(lesson.displayStatus === "completed" ||
            lesson.displayStatus === "completed_today") && (
            <Check className="h-4 w-4" strokeWidth={3} />
          )}
          {lesson.displayStatus === "current" && (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          {(lesson.displayStatus === "locked" ||
            lesson.displayStatus === "locked_tomorrow") && (
            <Lock className="h-3.5 w-3.5" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[2rem] my-1",
              lesson.displayStatus === "completed" ||
                lesson.displayStatus === "completed_today"
                ? "bg-norte-green/40"
                : "bg-slate-200"
            )}
          />
        )}
      </div>

      {lesson.canOpen ? (
        <Link href={`/lessons?index=${index}`} className="flex-1 block active:scale-[0.99]">
          {card}
        </Link>
      ) : (
        <div className="flex-1">{card}</div>
      )}
    </div>
  );
}
