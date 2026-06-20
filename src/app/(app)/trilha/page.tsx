"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getTrailForUser, type TrailLesson } from "@/lib/data/trail";
import { GOAL_LABELS, type LearningGoal } from "@/types";
import { Check, Lock, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function TrilhaPage() {
  const [trail, setTrail] = useState<{
    module: { title: string };
    lessons: TrailLesson[];
    goal: string;
    level: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const { user } = data.data;
          const { module, lessons } = getTrailForUser(
            (user.goal ?? "career_abroad") as LearningGoal,
            user.progress?.lessonsCompleted ?? 0
          );
          setTrail({
            module,
            lessons,
            goal: user.goal,
            level: user.level,
          });
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AppShell showHeader={false}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-norte-blue border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const currentLesson = trail?.lessons.find((l) => l.status === "current");

  return (
    <AppShell showHeader={false}>
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-norte-ink">Sua trilha</h1>
          <p className="text-sm text-slate-500 mt-1">
            Módulo 3 · {GOAL_LABELS[trail?.goal as keyof typeof GOAL_LABELS] ?? "Inglês"}
          </p>
        </div>

        <div className="relative space-y-0">
          {trail?.lessons.map((lesson, index) => {
            const isLast = index === (trail.lessons.length ?? 0) - 1;

            return (
              <div key={lesson.id} className="relative flex gap-4">
                {/* Linha vertical da trilha */}
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

                {/* Card da lição */}
                <div
                  className={cn(
                    "flex-1 mb-4 rounded-2xl p-4 transition-all",
                    lesson.status === "completed" && "bg-white border border-slate-100 opacity-80",
                    lesson.status === "current" && "bg-norte-ink text-white shadow-lg",
                    lesson.status === "locked" && "bg-white/60 border border-slate-100 opacity-50"
                  )}
                >
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
                    {lesson.status === "completed" && `Concluído · +${lesson.xp} XP`}
                    {lesson.status === "current" && `Em andamento · ${lesson.duration}`}
                    {lesson.status === "locked" && "Bloqueado"}
                  </p>

                  {lesson.status === "current" && (
                    <Link href="/lessons">
                      <Button variant="accent" size="sm" className="mt-3">
                        Continuar
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {currentLesson && (
          <div className="mt-4 rounded-2xl bg-norte-blue-light border border-norte-blue/10 p-4 text-center">
            <p className="text-sm text-norte-blue font-medium">
              Próximo passo: {currentLesson.title}
            </p>
            <Link href="/lessons">
              <Button size="sm" className="mt-2">
                Ir para lição
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
