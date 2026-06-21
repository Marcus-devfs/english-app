"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  PhraseOfDayCard,
  WeeklyGoalCard,
  AchievementCard,
  StreakAlertCard,
} from "@/components/engagement/engagement-cards";
import { GOAL_LABELS, type UserProgress } from "@/types";
import { MessageCircle, Zap, ChevronRight, Briefcase, Crown } from "lucide-react";
import { PushPrompt } from "@/components/pwa/push-prompt";

interface DashboardData {
  user: {
    name: string;
    goal: string;
    level: string;
    progress: UserProgress;
  };
  dailyLesson: { title: string; phrase: string };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/lessons");
      const json = await res.json();
      if (json.success) {
        setData({ user: json.data.user, dailyLesson: json.data.dailyLesson });
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  }

  const progress = data?.user.progress;
  const firstName = data?.user.name?.split(" ")[0] ?? "aluno";
  const xpWeek = Math.min(progress?.xp ?? 0, 500);
  const quizAccuracy =
    progress && progress.quizzesCompleted > 0
      ? Math.min(95, 70 + progress.quizzesCompleted * 3)
      : 0;

  return (
    <AppShell userName={data?.user.name} streak={progress?.streakDays ?? 0}>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-norte-ink">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {GOAL_LABELS[data?.user.goal as keyof typeof GOAL_LABELS] ?? "Sua trilha"}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-norte-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
            {firstName[0]?.toUpperCase()}
          </div>
        </div>

        <PushPrompt />

        <StreakAlertCard streak={progress?.streakDays ?? 0} />

        {/* Lição do dia — card escuro */}
        <div className="rounded-2xl bg-norte-ink p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Lição do dia
          </p>
          <h2 className="text-lg font-bold text-white leading-snug pr-4">
            {data?.dailyLesson.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">5 min · vocabulário + fala</p>
          <Link href="/lessons">
            <Button variant="accent" size="sm" className="mt-4">
              Continuar
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Grid 2x2 progresso */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Nível atual</p>
            <p className="text-xl font-bold text-norte-ink">{data?.user.level ?? "B1"}</p>
            <p className="text-xs text-norte-green font-medium mt-0.5">+8%</p>
            <ProgressBar value={68} className="mt-2" color="blue" />
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">XP esta semana</p>
            <p className="text-xl font-bold text-norte-ink">
              {xpWeek} <span className="text-sm font-normal text-slate-400">/ 500</span>
            </p>
            <ProgressBar value={xpWeek} max={500} className="mt-2" color="yellow" />
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Lições</p>
            <p className="text-2xl font-bold text-norte-ink">{progress?.lessonsCompleted ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Precisão quiz</p>
            <p className="text-2xl font-bold text-norte-ink">{quizAccuracy}%</p>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/interview">
            <div className="rounded-2xl bg-gradient-to-br from-norte-ink to-slate-800 border border-slate-700 p-4 h-full active:scale-[0.98] transition-transform relative overflow-hidden">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-400/10" />
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-6 w-6 text-amber-400" />
                <Crown className="h-3.5 w-3.5 text-amber-400/80" />
              </div>
              <p className="font-semibold text-white text-sm">Entrevista IA</p>
              <p className="text-xs text-slate-400">Exclusivo PRO</p>
            </div>
          </Link>
          <Link href="/chat">
            <div className="rounded-2xl bg-norte-blue-light border border-norte-blue/10 p-4 h-full active:scale-[0.98] transition-transform">
              <MessageCircle className="h-6 w-6 text-norte-blue mb-2" />
              <p className="font-semibold text-norte-ink text-sm">Falar com a IA</p>
              <p className="text-xs text-slate-500">voz ou texto</p>
            </div>
          </Link>
          <Link href="/quiz">
            <div className="rounded-2xl bg-emerald-50 border border-norte-green/10 p-4 h-full active:scale-[0.98] transition-transform">
              <Zap className="h-6 w-6 text-norte-green mb-2" />
              <p className="font-semibold text-norte-ink text-sm">Quiz rápido</p>
              <p className="text-xs text-slate-500">5 perguntas</p>
            </div>
          </Link>
        </div>
        <PhraseOfDayCard />
        <WeeklyGoalCard daysCompleted={Math.min(5, progress?.streakDays ?? 0)} />
        <AchievementCard dialogues={Math.floor((progress?.speakingScore ?? 0) / 2)} />
      </div>
    </AppShell>
  );
}
