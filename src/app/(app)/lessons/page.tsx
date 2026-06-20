"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DailyLesson } from "@/types";
import { BookOpen, CheckCircle2, Volume2 } from "lucide-react";

export default function LessonsPage() {
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLesson(data.data.dailyLesson);
        setLoading(false);
      });
  }, []);

  async function markComplete() {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "lesson" }),
    });
    setCompleted(true);
  }

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  if (!lesson) return null;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6">
        <div>
          <Badge variant="info">Lição do dia</Badge>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">{lesson.title}</h1>
        </div>

        <Card className="border-indigo-100">
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <blockquote className="text-xl font-medium text-slate-800 italic flex-1">
                &ldquo;{lesson.phrase}&rdquo;
              </blockquote>
              <button
                onClick={() => speak(lesson.phrase)}
                className="shrink-0 p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>
            <p className="text-slate-600">{lesson.translation}</p>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-sm text-slate-500 mb-1">Contexto de uso</p>
              <p className="text-slate-700">{lesson.context}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Vocabulário
            </CardTitle>
            <div className="space-y-3">
              {lesson.vocabulary.map(({ word, meaning }) => (
                <div
                  key={word}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{word}</span>
                    <button
                      onClick={() => speak(word)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-slate-500">{meaning}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardContent>
            <CardTitle className="mb-2 text-emerald-800">💡 Dica de gramática</CardTitle>
            <p className="text-slate-700">{lesson.grammarTip}</p>
          </CardContent>
        </Card>

        {completed ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Lição concluída! +20 XP 🎉</span>
          </div>
        ) : (
          <Button className="w-full" size="lg" onClick={markComplete}>
            Marcar lição como concluída
          </Button>
        )}
      </div>
    </AppShell>
  );
}
