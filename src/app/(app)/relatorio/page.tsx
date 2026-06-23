"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ChevronRight } from "lucide-react";

interface WeeklyReport {
  weekLabel: string;
  goal: string;
  level: string;
  streakDays: number;
  totalXp: number;
  lessonsCompleted: number;
  weekly: {
    xpThisWeek: number;
    studyDaysThisWeek: number;
    studyMinutesThisWeek: number;
    lessonsThisWeek: number;
    chatMessagesThisWeek: number;
    quizAccuracy: number | null;
  };
  highlights: string[];
  focusAreas: string[];
  recentLessons: { title: string; score?: number }[];
  vocabCardsReviewed: number;
}

export default function ReportPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/report/weekly")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReport(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  }

  if (!report) return null;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-norte-blue" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Relatório semanal</h1>
            <p className="text-sm text-slate-500">{report.weekLabel}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-norte-blue">{report.weekly.xpThisWeek}</p>
                <p className="text-xs text-slate-500">XP esta semana</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-norte-green">
                  {report.weekly.studyDaysThisWeek}
                </p>
                <p className="text-xs text-slate-500">Dias praticados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-norte-ink">
                  {report.weekly.lessonsThisWeek}
                </p>
                <p className="text-xs text-slate-500">Lições</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-norte-ink">
                  {report.weekly.chatMessagesThisWeek}
                </p>
                <p className="text-xs text-slate-500">Msgs no chat</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 text-center pt-2">
              {report.weekly.studyMinutesThisWeek} min de estudo · Nível {report.level} ·{" "}
              {report.goal}
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="font-semibold text-norte-ink mb-2">Destaques</h2>
          <ul className="space-y-2">
            {report.highlights.map((h, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-norte-green">✓</span> {h}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-norte-ink mb-2">Foco para próxima semana</h2>
          <div className="flex flex-wrap gap-2">
            {report.focusAreas.map((area) => (
              <span
                key={area}
                className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        {report.recentLessons.length > 0 && (
          <div>
            <h2 className="font-semibold text-norte-ink mb-2">Lições recentes</h2>
            <div className="space-y-2">
              {report.recentLessons.map((l, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm p-3 rounded-xl bg-slate-50"
                >
                  <span>{l.title}</span>
                  {l.score !== undefined && (
                    <span className="text-norte-blue font-medium">{l.score}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-center text-sm">
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="font-bold text-norte-ink">{report.streakDays}</p>
            <p className="text-xs text-slate-500">Dias de streak</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="font-bold text-norte-ink">{report.vocabCardsReviewed}</p>
            <p className="text-xs text-slate-500">Palavras revisadas</p>
          </div>
        </div>

        <Link href="/lessons">
          <Button className="w-full">
            Continuar praticando
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}
