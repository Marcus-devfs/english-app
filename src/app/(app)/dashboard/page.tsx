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
import { GOAL_LABELS } from "@/types";
import { MessageCircle, Zap, ChevronRight, Briefcase, BarChart3, RotateCcw } from "lucide-react";
import { PushPrompt } from "@/components/pwa/push-prompt";
import { ProBadge, ProBlackCard } from "@/components/subscription/pro-badge";
import { useSubscription } from "@/lib/hooks/use-subscription";

interface DashboardStats {
  user: {
    name: string;
    goal: string;
    level: string;
    progress: {
      streakDays: number;
      lessonsCompleted: number;
      xp: number;
    };
  };
  weekly: {
    xpThisWeek: number;
    studyDaysThisWeek: number;
    studyMinutesThisWeek: number;
    lessonsThisWeek: number;
    chatMessagesThisWeek: number;
    quizAccuracy: number | null;
    levelProgressPct: number;
    practiceDaysGoal: number;
    practiceMinutesGoal: number;
  };
  totalChatMessages: number;
  reassessDue: boolean;
}

interface LessonData {
  dailyLesson: { title: string };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isPro } = useSubscription();

  useEffect(() => {
    async function load() {
      const [statsRes, lessonsRes] = await Promise.all([
        fetch("/api/stats/dashboard"),
        fetch("/api/lessons"),
      ]);
      const statsJson = await statsRes.json();
      const lessonsJson = await lessonsRes.json();
      if (statsJson.success) setStats(statsJson.data);
      if (lessonsJson.success) setLesson(lessonsJson.data);
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

  const progress = stats?.user.progress;
  const weekly = stats?.weekly;
  const firstName = stats?.user.name?.split(" ")[0] ?? "aluno";
  const minutesGoal = (weekly?.practiceMinutesGoal ?? 15) * (weekly?.practiceDaysGoal ?? 5);

  return (
    <AppShell userName={stats?.user.name} streak={progress?.streakDays ?? 0}>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-norte-ink">
                {getGreeting()}, {firstName} 👋
              </h1>
              {isPro && <ProBadge size="md" />}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {GOAL_LABELS[stats?.user.goal as keyof typeof GOAL_LABELS] ?? "Sua trilha"}
            </p>
          </div>
        </div>

        {stats?.reassessDue && (
          <Link href="/reassess">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <RotateCcw className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-norte-ink text-sm">Hora de medir seu progresso!</p>
                <p className="text-xs text-slate-600">Reavaliação de nível disponível</p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-600 ml-auto" />
            </div>
          </Link>
        )}

        {isPro && (
          <ProBlackCard className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Membro Black
              </p>
              <p className="text-sm font-semibold mt-0.5">Entrevista IA desbloqueada</p>
            </div>
            <Link href="/interview">
              <Button variant="accent" size="sm">
                Iniciar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </ProBlackCard>
        )}

        <PushPrompt />
        <StreakAlertCard streak={progress?.streakDays ?? 0} />

        <div className="rounded-2xl bg-norte-ink p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Lição do dia
          </p>
          <h2 className="text-lg font-bold text-white leading-snug pr-4">
            {lesson?.dailyLesson.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">5 min · vocabulário + fala</p>
          <Link href="/lessons">
            <Button variant="accent" size="sm" className="mt-4">
              Continuar
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Nível atual</p>
            <p className="text-xl font-bold text-norte-ink">{stats?.user.level ?? "B1"}</p>
            <p className="text-xs text-norte-green font-medium mt-0.5">
              {weekly?.levelProgressPct ?? 0}% da trilha
            </p>
            <ProgressBar value={weekly?.levelProgressPct ?? 0} className="mt-2" color="blue" />
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">XP esta semana</p>
            <p className="text-xl font-bold text-norte-ink">
              {weekly?.xpThisWeek ?? 0}{" "}
              <span className="text-sm font-normal text-slate-400">/ 500</span>
            </p>
            <ProgressBar
              value={weekly?.xpThisWeek ?? 0}
              max={500}
              className="mt-2"
              color="yellow"
            />
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Lições</p>
            <p className="text-2xl font-bold text-norte-ink">{progress?.lessonsCompleted ?? 0}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {weekly?.lessonsThisWeek ?? 0} esta semana
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Precisão quiz</p>
            <p className="text-2xl font-bold text-norte-ink">
              {weekly?.quizAccuracy !== null && weekly?.quizAccuracy !== undefined
                ? `${weekly.quizAccuracy}%`
                : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/interview">
            <div className="rounded-2xl bg-gradient-to-br from-norte-ink to-slate-800 border border-slate-700 p-4 h-full active:scale-[0.98] transition-transform relative overflow-hidden">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/5" />
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-6 w-6 text-white" />
                {isPro && <ProBadge size="xs" />}
              </div>
              <p className="font-semibold text-white text-sm">Entrevista IA</p>
              <p className="text-xs text-slate-400">
                {isPro ? "Disponível agora" : "Exclusivo PRO"}
              </p>
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
              <p className="text-xs text-slate-500">Quiz diário · 5 perguntas</p>
            </div>
          </Link>
          <Link href="/review">
            <div className="rounded-2xl bg-violet-50 border border-violet-200 p-4 h-full active:scale-[0.98] transition-transform">
              <RotateCcw className="h-6 w-6 text-violet-600 mb-2" />
              <p className="font-semibold text-norte-ink text-sm">Revisar palavras</p>
              <p className="text-xs text-slate-500">Repetição espaçada</p>
            </div>
          </Link>
        </div>

        <Link href="/relatorio">
          <div className="rounded-2xl bg-white border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-sm">
            <BarChart3 className="h-6 w-6 text-norte-blue" />
            <div>
              <p className="font-semibold text-norte-ink text-sm">Relatório semanal</p>
              <p className="text-xs text-slate-500">Veja seu progresso desta semana</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
          </div>
        </Link>

        <PhraseOfDayCard />
        <WeeklyGoalCard
          daysCompleted={weekly?.studyDaysThisWeek ?? 0}
          daysGoal={weekly?.practiceDaysGoal ?? 5}
          minutesCompleted={weekly?.studyMinutesThisWeek ?? 0}
          minutesGoal={minutesGoal}
        />
        <AchievementCard dialogues={stats?.totalChatMessages ?? 0} />
      </div>
    </AppShell>
  );
}
