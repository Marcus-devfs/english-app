"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTrailForUser, getTodayLabel, type TrailLesson } from "@/lib/data/trail";
import { GOAL_LABELS, type LearningGoal } from "@/types";
import { Check, Lock, Play, ChevronRight, RotateCcw, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function TrilhaPage() {
  const [trail, setTrail] = useState<{
    module: { title: string };
    lessons: TrailLesson[];
    goal: LearningGoal;
    level: string;
    lessonsCompleted: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const { user } = data.data;
          const { module, lessons } = getTrailForUser(
            (user.goal ?? "conversation") as LearningGoal,
            user.progress?.lessonsCompleted ?? 0
          );
          setTrail({
            module,
            lessons,
            goal: user.goal ?? "conversation",
            level: user.level,
            lessonsCompleted: user.progress?.lessonsCompleted ?? 0,
          });
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

  const currentLesson = trail?.lessons.find((l) => l.status === "current");
  const completedCount = trail?.lessons.filter((l) => l.status === "completed").length ?? 0;

  return (
    <AppShell showHeader={false}>
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-norte-blue mb-2">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs font-medium capitalize">{getTodayLabel()}</span>
          </div>
          <h1 className="text-2xl font-bold text-norte-ink">Trilha de hoje</h1>
          <p className="text-sm text-slate-500 mt-1">
            Seu plano de aprendizado diário ·{" "}
            {GOAL_LABELS[trail?.goal ?? "conversation"]}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {completedCount}/{trail?.lessons.length ?? 0} lições concluídas nesta trilha
          </p>
        </div>

        <div className="mb-4 rounded-2xl bg-norte-blue-light border border-norte-blue/10 p-4">
          <p className="text-sm font-medium text-norte-blue">Lição do dia</p>
          <p className="text-norte-ink font-semibold mt-1">
            {currentLesson?.title ?? "Trilha concluída!"}
          </p>
          {currentLesson && (
            <Link href={`/lessons?index=${trail?.lessonsCompleted}`}>
              <Button size="sm" className="mt-3">
                Começar lição de hoje
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          {trail?.module.title}
        </p>

        <div className="relative space-y-0">
          {trail?.lessons.map((lesson, index) => {
            const isLast = index === (trail.lessons.length ?? 0) - 1;
            const canOpen = lesson.status === "completed" || lesson.status === "current";

            return (
              <div key={lesson.id} className="relative flex gap-4">
                <div className="flex flex-col items-center shrink-0 w-8">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10",
                      lesson.status === "completed" && "bg-norte-green text-white",
                      lesson.status === "current" && "bg-norte-blue text-white ring-4 ring-norte-blue/20",
                      lesson.status === "locked" && "bg-slate-200 text-slate-400"
                    )}
                  >
                    {lesson.status === "completed" && <Check className="h-4 w-4" strokeWidth={3} />}
                    {lesson.status === "current" && <Play className="h-3.5 w-3.5 fill-current" />}
                    {lesson.status === "locked" && <Lock className="h-3.5 w-3.5" />}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "w-0.5 flex-1 min-h-[2rem] my-1",
                        lesson.status === "completed" ? "bg-norte-green/40" : "bg-slate-200"
                      )}
                    />
                  )}
                </div>

                {canOpen ? (
                  <Link
                    href={`/lessons?index=${index}`}
                    className={cn(
                      "flex-1 mb-4 rounded-2xl p-4 transition-all block active:scale-[0.99]",
                      lesson.status === "completed" && "bg-white border border-slate-100 hover:border-norte-green/30",
                      lesson.status === "current" && "bg-norte-ink text-white shadow-lg"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={cn(
                            "font-semibold text-sm",
                            lesson.status === "current" ? "text-white" : "text-norte-ink"
                          )}
                        >
                          {lesson.title}
                        </h3>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            lesson.status === "current" ? "text-slate-400" : "text-slate-500"
                          )}
                        >
                          {lesson.status === "completed" && (
                            <span className="inline-flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" />
                              Revisar · +{lesson.xp} XP
                            </span>
                          )}
                          {lesson.status === "current" && `Lição de hoje · ${lesson.duration}`}
                        </p>
                      </div>
                      {lesson.status === "current" && (
                        <Badge className="bg-norte-yellow text-norte-ink shrink-0">
                          Hoje
                        </Badge>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex-1 mb-4 rounded-2xl p-4 bg-white/60 border border-slate-100 opacity-50">
                    <h3 className="font-semibold text-sm text-norte-ink">{lesson.title}</h3>
                    <p className="text-xs mt-1 text-slate-500">Complete a lição anterior para desbloquear</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
