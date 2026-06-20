"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/types";
import { Brain, CheckCircle2, XCircle } from "lucide-react";

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    total: number;
    xpEarned: number;
    results: { questionId: string; isCorrect: boolean; explanation?: string; correctAnswer?: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setQuestions(data.data.quiz);
        setLoading(false);
      });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: "daily",
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setResult(data.data);
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  }

  if (submitted && result) {
    return (
      <AppShell>
        <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-norte-blue-light flex items-center justify-center mx-auto mb-4">
              <Brain className="h-10 w-10 text-norte-blue" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Quiz concluído!</h1>
            <p className="text-4xl font-bold text-norte-blue mt-2">{result.score}%</p>
            <p className="text-slate-600 mt-1">
              {result.correct}/{result.total} corretas · +{result.xpEarned} XP
            </p>
          </div>

          <div className="space-y-3">
            {result.results.map((r, i) => {
              const q = questions.find((q) => q.id === r.questionId);
              return (
                <Card key={r.questionId} className={r.isCorrect ? "border-emerald-200" : "border-red-200"}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {r.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{q?.question}</p>
                        {!r.isCorrect && (
                          <p className="text-sm text-emerald-700 mt-1">
                            Resposta correta: {r.correctAnswer}
                          </p>
                        )}
                        {r.explanation && (
                          <p className="text-xs text-slate-500 mt-1">{r.explanation}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setSubmitted(false);
              setResult(null);
              setAnswers({});
              setCurrent(0);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      </AppShell>
    );
  }

  const question = questions[current];

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6">
        <div>
          <Badge variant="info">
            Questão {current + 1} de {questions.length}
          </Badge>
          <h1 className="text-xl font-bold text-slate-900 mt-3">{question?.question}</h1>
        </div>

        <div className="space-y-2">
          {question?.options.map((option) => (
            <button
              key={option}
              onClick={() =>
                setAnswers((prev) => ({ ...prev, [question.id]: option }))
              }
              className={`w-full p-4 rounded-xl border text-left text-sm transition-all ${
                answers[question.id] === option
                  ? "border-norte-blue/40 bg-norte-blue-light text-norte-ink"
                  : "border-slate-200 bg-white hover:border-norte-blue/20"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {current > 0 && (
            <Button variant="secondary" onClick={() => setCurrent((c) => c - 1)}>
              Anterior
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!answers[question?.id ?? ""]}
            loading={submitting}
            onClick={() => {
              if (current < questions.length - 1) {
                setCurrent((c) => c + 1);
              } else {
                handleSubmit();
              }
            }}
          >
            {current < questions.length - 1 ? "Próxima" : "Finalizar quiz"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
