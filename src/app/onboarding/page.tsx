"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  GOAL_LABELS,
  LEVEL_LABELS,
  type LearningGoal,
  type CEFRLevel,
  type AssessmentQuestion,
} from "@/types";
import { VoiceRecorder } from "@/components/ui/voice-recorder";
import {
  Briefcase,
  Plane,
  GraduationCap,
  MessageCircle,
  Building2,
  Code2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const GOALS: { id: LearningGoal; icon: React.ElementType; description: string }[] = [
  { id: "tech_career", icon: Code2, description: "Trabalhar em empresas de tecnologia no exterior" },
  { id: "career_abroad", icon: Briefcase, description: "Oportunidades de carreira internacionais" },
  { id: "business", icon: Building2, description: "Reuniões, emails e negociações em inglês" },
  { id: "travel", icon: Plane, description: "Viajar com confiança pelo mundo" },
  { id: "academic", icon: GraduationCap, description: "Estudar ou pesquisar em universidades" },
  { id: "conversation", icon: MessageCircle, description: "Conversar fluentemente no dia a dia" },
];

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

type Step = "goal" | "assessment" | "diagnosis";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [selfLevel, setSelfLevel] = useState<CEFRLevel | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [liveSpeakingText, setLiveSpeakingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<{
    diagnosedLevel: CEFRLevel;
    score: number;
    recommendation: string;
    skillBreakdown: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
  } | null>(null);

  const loadQuestions = useCallback(async () => {
    const res = await fetch("/api/assessment/questions");
    const data = await res.json();
    if (data.success) setQuestions(data.data.questions);
  }, []);

  async function handleGoalSubmit() {
    if (!goal || !selfLevel) return;
    setLoading(true);
    try {
      await fetch("/api/onboarding/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, selfAssessedLevel: selfLevel }),
      });
      await loadQuestions();
      setStep("assessment");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssessmentSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfAssessedLevel: selfLevel,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagnosis(data.data);
        setStep("diagnosis");
      }
    } finally {
      setLoading(false);
    }
  }

  const question = questions[currentQ];
  const progress = step === "goal" ? 33 : step === "assessment" ? 66 : 100;

  const currentAnswer =
    question?.type === "speaking"
      ? answers[question.id] || liveSpeakingText
      : answers[question?.id ?? ""];

  return (
    <div className="min-h-dvh bg-norte-bg overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-norte-blue" />
            <span className="font-semibold text-norte-ink">Configurando sua trilha</span>
          </div>
          <ProgressBar value={progress} label="Progresso do onboarding" color="blue" />
        </div>

        {step === "goal" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Qual é o seu objetivo?</h1>
              <p className="text-slate-600 mt-2">
                Vamos personalizar todo o conteúdo para você.
              </p>
            </div>

            <div className="grid gap-3">
              {GOALS.map(({ id, icon: Icon, description }) => (
                <Card
                  key={id}
                  hover
                  className={goal === id ? "border-norte-blue/40 ring-2 ring-norte-blue-light" : ""}
                  onClick={() => setGoal(id)}
                >
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="h-11 w-11 rounded-xl bg-norte-blue-light flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-norte-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{GOAL_LABELS[id]}</p>
                      <p className="text-sm text-slate-500">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Qual nível você acha que tem?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelfLevel(level)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      selfLevel === level
                        ? "border-norte-blue/40 bg-norte-blue-light text-norte-blue"
                        : "border-slate-200 bg-white text-slate-600 hover:border-norte-blue/20"
                    }`}
                  >
                    {LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!goal || !selfLevel}
              loading={loading}
              onClick={handleGoalSubmit}
            >
              Continuar para avaliação
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "assessment" && question && (
          <div className="space-y-6">
            <div>
              <Badge variant="info">
                Questão {currentQ + 1} de {questions.length}
              </Badge>
              <h1 className="text-2xl font-bold text-slate-900 mt-3">{question.question}</h1>
              {question.hint && (
                <p className="text-sm text-slate-500 mt-2">💡 {question.hint}</p>
              )}
            </div>

            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => (
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
            )}

            {question.type === "fill_blank" && (
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

            {question.type === "speaking" && (
              <VoiceRecorder
                onComplete={(text) => {
                  setAnswers((prev) => ({ ...prev, [question.id]: text }));
                  setLiveSpeakingText(text);
                }}
                onTranscriptChange={(text) => {
                  setLiveSpeakingText(text);
                  if (text.trim()) {
                    setAnswers((prev) => ({ ...prev, [question.id]: text }));
                  }
                }}
              />
            )}

            <div className="flex gap-3">
              {currentQ > 0 && (
                <Button variant="secondary" onClick={() => setCurrentQ((q) => q - 1)}>
                  Anterior
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={!currentAnswer?.trim()}
                onClick={() => {
                  if (question.type === "speaking" && liveSpeakingText && !answers[question.id]) {
                    setAnswers((prev) => ({ ...prev, [question.id]: liveSpeakingText }));
                  }
                  if (currentQ < questions.length - 1) {
                    setCurrentQ((q) => q + 1);
                    setLiveSpeakingText("");
                  } else {
                    handleAssessmentSubmit();
                  }
                }}
                loading={loading && currentQ === questions.length - 1}
              >
                {currentQ < questions.length - 1 ? "Próxima" : "Ver meu diagnóstico"}
              </Button>
            </div>
          </div>
        )}

        {step === "diagnosis" && diagnosis && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-norte-ink flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">{diagnosis.diagnosedLevel}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Seu diagnóstico está pronto!</h1>
              <p className="text-slate-600 mt-2">{diagnosis.recommendation}</p>
            </div>

            <Card>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Pontuação geral</span>
                  <span className="text-2xl font-bold text-norte-blue">{diagnosis.score}%</span>
                </div>
                <ProgressBar value={diagnosis.score} color="blue" />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {Object.entries(diagnosis.skillBreakdown).map(([skill, score]) => (
                    <div key={skill} className="p-3 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 capitalize">{skill}</p>
                      <p className="text-lg font-bold text-slate-900">{score}%</p>
                    </div>
                  ))}
                </div>

                {diagnosis.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-emerald-700 mb-1">✅ Pontos fortes</p>
                    <div className="flex flex-wrap gap-2">
                      {diagnosis.strengths.map((s) => (
                        <Badge key={s} variant="success">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {diagnosis.weaknesses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-amber-700 mb-1">📈 Para melhorar</p>
                    <div className="flex flex-wrap gap-2">
                      {diagnosis.weaknesses.map((w) => (
                        <Badge key={w} variant="warning">{w}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
              Começar minha trilha 🚀
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
