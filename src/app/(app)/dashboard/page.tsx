"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { NotificationCard } from "@/components/ui/notification-card";
import { Button } from "@/components/ui/button";
import { GOAL_LABELS, LEVEL_LABELS, type UserProgress } from "@/types";
import {
  BookOpen,
  Brain,
  MessageCircle,
  Flame,
  Trophy,
  Star,
  ChevronRight,
  Zap,
} from "lucide-react";

interface DashboardData {
  user: {
    name: string;
    goal: string;
    level: string;
    progress: UserProgress;
  };
  dailyLesson: { title: string; phrase: string };
  notifications: {
    id: string;
    type: "achievement" | "reminder" | "streak" | "tip" | "level_up";
    title: string;
    message: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [lessonsRes, progressRes] = await Promise.all([
        fetch("/api/lessons"),
        fetch("/api/progress"),
      ]);
      const lessons = await lessonsRes.json();
      const progress = await progressRes.json();

      if (lessons.success && progress.success) {
        setData({
          user: lessons.data.user,
          dailyLesson: lessons.data.dailyLesson,
          notifications: progress.data.notifications,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const progress = data?.user.progress;
  const xpToNextLevel = 200;
  const xpProgress = progress ? (progress.xp % xpToNextLevel) : 0;

  return (
    <AppShell userName={data?.user.name}>
      <div className="flex-1 overflow-y-auto p-4 pb-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {data?.user.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-600 mt-1">
            Continue sua trilha de {GOAL_LABELS[data?.user.goal as keyof typeof GOAL_LABELS] ?? "inglês"}
          </p>
        </div>

        {data?.notifications && data.notifications.length > 0 && (
          <div className="space-y-3">
            {data.notifications.slice(0, 2).map((n) => (
              <NotificationCard key={n.id} {...n} />
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Star, label: "Nível", value: data?.user.level ?? "—", color: "text-violet-600", bg: "bg-violet-50" },
            { icon: Flame, label: "Streak", value: `${progress?.streakDays ?? 0} dias`, color: "text-orange-600", bg: "bg-orange-50" },
            { icon: Zap, label: "XP Total", value: progress?.xp ?? 0, color: "text-indigo-600", bg: "bg-indigo-50" },
            { icon: Trophy, label: "Lições", value: progress?.lessonsCompleted ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="info">Lição do dia</Badge>
                  <CardTitle className="mt-2">{data?.dailyLesson.title}</CardTitle>
                </div>
                <BookOpen className="h-6 w-6 text-indigo-400" />
              </div>
              <blockquote className="text-lg font-medium text-slate-800 italic border-l-4 border-indigo-400 pl-4">
                &ldquo;{data?.dailyLesson.phrase}&rdquo;
              </blockquote>
              <Link href="/lessons">
                <Button className="w-full">
                  Estudar lição do dia
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <CardTitle>Seu progresso XP</CardTitle>
              <ProgressBar
                value={xpProgress}
                max={xpToNextLevel}
                label={`${xpProgress} / ${xpToNextLevel} XP`}
                color="violet"
              />
              <div className="space-y-3 pt-2">
                <ProgressBar value={progress?.grammarScore ?? 0} max={100} label="Gramática" color="indigo" />
                <ProgressBar value={progress?.vocabularyScore ?? 0} max={100} label="Vocabulário" color="emerald" />
                <ProgressBar value={progress?.speakingScore ?? 0} max={100} label="Conversação" color="amber" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { href: "/quiz", icon: Brain, title: "Quiz rápido", desc: "Teste seus conhecimentos", color: "bg-violet-50 text-violet-600" },
            { href: "/chat", icon: MessageCircle, title: "Conversar com IA", desc: "Pratique speaking agora", color: "bg-emerald-50 text-emerald-600" },
            { href: "/vocabulary", icon: BookOpen, title: "Vocabulário", desc: "Palavras do seu objetivo", color: "bg-amber-50 text-amber-600" },
          ].map(({ href, icon: Icon, title, desc, color }) => (
            <Link key={href} href={href}>
              <Card hover>
                <CardContent className="py-5">
                  <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Seu nível CEFR</p>
                <p className="text-2xl font-bold text-slate-900">
                  {LEVEL_LABELS[data?.user.level as keyof typeof LEVEL_LABELS] ?? data?.user.level}
                </p>
              </div>
              <Badge variant="level">{progress?.quizzesCompleted ?? 0} quizzes feitos</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
