"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AssessmentQuestion } from "@/types";

export default function ReassessPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notDue, setNotDue] = useState(false);
  const [lessonsUntil, setLessonsUntil] = useState(0);

  useEffect(() => {
    fetch("/api/assessment/reassess")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          if (!data.data.due) {
            setNotDue(true);
            setLessonsUntil(data.data.lessonsUntilReassess ?? 0);
          } else {
            setQuestions(data.data.questions);
          }
        }
        setLoading(false);
      });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch("/api/assessment/reassess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      }),
    });
    const data = await res.json();
    if (data.success) {
      router.push("/dashboard");
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

  if (notDue) {
    return (
      <AppShell>
        <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6 text-center">
          <h1 className="text-xl font-bold">Reavaliação de nível</h1>
          <p className="text-slate-600">
            Disponível a cada 20 lições. Faltam {lessonsUntil} lição(ões).
          </p>
          <Link href="/dashboard">
            <Button variant="secondary">Voltar</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const question = questions[current];

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6">
        <div>
          <Badge variant="info">Reavaliação de nível</Badge>
          <h1 className="text-xl font-bold text-slate-900 mt-3">
            Questão {current + 1} de {questions.length}
          </h1>
          <p className="text-slate-600 mt-1">{question?.question}</p>
        </div>

        {question?.type === "multiple_choice" && question.options && (
          <div className="space-y-2">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                className={`w-full p-4 rounded-xl border text-left text-sm transition-all ${
                  answers[question.id] === option
                    ? "border-norte-blue/40 bg-norte-blue-light"
                    : "border-slate-200 bg-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question?.type === "fill_blank" && (
          <input
            type="text"
            placeholder="Digite sua resposta..."
            value={answers[question.id] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
            }
            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-norte-blue"
          />
        )}

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
            {current < questions.length - 1 ? "Próxima" : "Ver resultado"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
