"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DailyLesson } from "@/types";
import {
  buildLessonSteps,
  checkSpeechAttempt,
  checkTranslation,
  type LessonStepType,
} from "@/lib/lessons/build-steps";
import { useVoiceRecorder } from "@/lib/hooks/use-voice-recorder";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Mic,
  Square,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TrailMeta {
  index: number;
  lessonTitle: string;
  isReview: boolean;
  isCurrent: boolean;
  moduleTitle: string;
}

function LessonsContent() {
  const searchParams = useSearchParams();
  const trailIndex = searchParams.get("index");

  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [trail, setTrail] = useState<TrailMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<LessonStepType>>(new Set());
  const [finished, setFinished] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);

  const [translationInput, setTranslationInput] = useState("");
  const [translationError, setTranslationError] = useState("");
  const [wordPicks, setWordPicks] = useState<Record<number, string>>({});
  const [wordPickError, setWordPickError] = useState("");
  const [speakError, setSpeakError] = useState("");

  const { isRecording, displayText, start, stop, reset: resetMic } = useVoiceRecorder("en-US");

  const steps = useMemo(() => (lesson ? buildLessonSteps(lesson) : []), [lesson]);
  const currentStepIndex = steps.findIndex((s) => !completedSteps.has(s.type));
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const progressPct = steps.length
    ? Math.round((completedSteps.size / steps.length) * 100)
    : 0;

  const fetchLesson = useCallback(async () => {
    const url = trailIndex !== null ? `/api/lessons?index=${trailIndex}` : "/api/lessons";
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setLesson(data.data.dailyLesson);
      setTrail(data.data.trail);
    }
    setLoading(false);
  }, [trailIndex]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const markStepDone = useCallback((type: LessonStepType) => {
    setCompletedSteps((prev) => new Set([...prev, type]));
  }, []);

  const completeLesson = useCallback(async () => {
    if (trail?.isReview) {
      setFinished(true);
      return;
    }
    setAutoCompleting(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "lesson" }),
    });
    setFinished(true);
    setAutoCompleting(false);
  }, [trail?.isReview]);

  useEffect(() => {
    if (
      lesson &&
      steps.length > 0 &&
      completedSteps.size === steps.length &&
      !finished &&
      !autoCompleting
    ) {
      completeLesson();
    }
  }, [completedSteps.size, steps.length, finished, autoCompleting, completeLesson, lesson]);

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  }

  function handleListen() {
    if (lesson) {
      speak(lesson.phrase);
      markStepDone("listen");
    }
  }

  function handleTranslateSubmit() {
    if (!lesson) return;
    if (checkTranslation(translationInput, lesson.translation)) {
      setTranslationError("");
      markStepDone("translate");
    } else {
      setTranslationError("Quase! Tente de novo — a tradução não precisa ser idêntica, mas deve captar o sentido.");
    }
  }

  function handleWordPickSubmit() {
    const step = steps.find((s) => s.type === "word_pick");
    if (!step?.blanks?.length) {
      markStepDone("word_pick");
      return;
    }
    const allCorrect = step.blanks.every(
      (b) => wordPicks[b.index]?.toLowerCase() === b.correct.toLowerCase()
    );
    if (allCorrect) {
      setWordPickError("");
      markStepDone("word_pick");
    } else {
      setWordPickError("Algumas palavras estão incorretas. Tente novamente.");
    }
  }

  function handleSpeakSubmit() {
    if (!lesson) return;
    const text = isRecording ? stop() : displayText;
    if (checkSpeechAttempt(text, lesson.phrase)) {
      setSpeakError("");
      markStepDone("speak");
      resetMic();
    } else {
      setSpeakError("Tente falar a frase completa em inglês. Toque no microfone e repita.");
    }
  }

  if (loading) {
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  }

  if (!lesson) return null;

  const wordPickStep = steps.find((s) => s.type === "word_pick");
  const phraseWords = lesson.phrase.split(/\s+/);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-5">
        <Link
          href="/trilha"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-norte-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à trilha
        </Link>

        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="info">
              {trail?.isReview ? "Revisão" : "Lição de hoje"}
            </Badge>
            {trail?.moduleTitle && (
              <Badge variant="level">{trail.moduleTitle}</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete todas as atividades para concluir automaticamente
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Progresso da lição</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-norte-blue transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full",
                  completedSteps.has(s.type)
                    ? "bg-norte-green/15 text-norte-green"
                    : i === currentStepIndex
                      ? "bg-norte-blue-light text-norte-blue"
                      : "bg-slate-100 text-slate-400"
                )}
              >
                {i + 1}. {s.title}
              </span>
            ))}
          </div>
        </div>

        {finished ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">
                  {trail?.isReview
                    ? "Revisão concluída!"
                    : "Lição concluída! +20 XP 🎉"}
                </p>
                <p className="text-sm opacity-80 mt-0.5">
                  Você completou todas as atividades desta lição.
                </p>
              </div>
            </div>
            <Link href="/trilha">
              <Button className="w-full" variant="secondary">
                Voltar à trilha
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Card className="border-norte-blue-light">
              <CardContent className="space-y-3 pt-6">
                <blockquote className="text-lg font-medium text-slate-800 italic">
                  &ldquo;{lesson.phrase}&rdquo;
                </blockquote>
                <p className="text-sm text-slate-500">{lesson.context}</p>
              </CardContent>
            </Card>

            {currentStep?.type === "listen" && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <CardTitle className="text-base">{currentStep.title}</CardTitle>
                  <p className="text-sm text-slate-600">{currentStep.description}</p>
                  <Button onClick={handleListen} className="w-full">
                    <Volume2 className="h-4 w-4" />
                    Ouvir frase
                  </Button>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Vocabulário</p>
                    {lesson.vocabulary.map(({ word, meaning }) => (
                      <div
                        key={word}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{word}</span>
                          <button
                            type="button"
                            onClick={() => speak(word)}
                            className="text-norte-blue"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-slate-500">{meaning}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep?.type === "translate" && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <CardTitle className="text-base">{currentStep.title}</CardTitle>
                  <p className="text-sm text-slate-600">{currentStep.description}</p>
                  <p className="text-sm font-medium text-norte-ink italic">
                    &ldquo;{lesson.phrase}&rdquo;
                  </p>
                  <Input
                    value={translationInput}
                    onChange={(e) => setTranslationInput(e.target.value)}
                    placeholder="Digite a tradução em português..."
                  />
                  {translationError && (
                    <p className="text-sm text-amber-600">{translationError}</p>
                  )}
                  <Button
                    onClick={handleTranslateSubmit}
                    disabled={!translationInput.trim()}
                    className="w-full"
                  >
                    Verificar tradução
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep?.type === "word_pick" && wordPickStep && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <CardTitle className="text-base">{currentStep.title}</CardTitle>
                  <p className="text-sm text-slate-600">{currentStep.description}</p>
                  <div className="flex flex-wrap gap-1.5 text-base leading-relaxed">
                    {phraseWords.map((word, i) => {
                      const blank = wordPickStep.blanks?.find((b) => b.index === i);
                      if (blank) {
                        return (
                          <select
                            key={i}
                            value={wordPicks[i] ?? ""}
                            onChange={(e) =>
                              setWordPicks((p) => ({ ...p, [i]: e.target.value }))
                            }
                            className="px-2 py-1 rounded-lg border border-norte-blue/30 bg-norte-blue-light text-norte-blue font-medium text-sm"
                          >
                            <option value="">___</option>
                            {blank.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <span key={i} className="text-slate-800">
                          {word}
                        </span>
                      );
                    })}
                  </div>
                  {wordPickError && (
                    <p className="text-sm text-amber-600">{wordPickError}</p>
                  )}
                  <Button
                    onClick={handleWordPickSubmit}
                    disabled={
                      !wordPickStep.blanks?.every((b) => wordPicks[b.index])
                    }
                    className="w-full"
                  >
                    Confirmar palavras
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep?.type === "speak" && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <CardTitle className="text-base">{currentStep.title}</CardTitle>
                  <p className="text-sm text-slate-600">{currentStep.description}</p>
                  <p className="text-sm font-medium italic text-norte-ink">
                    &ldquo;{lesson.phrase}&rdquo;
                  </p>
                  {isRecording && (
                    <p className="text-xs text-red-500 animate-pulse">
                      ● Gravando… fale a frase em inglês
                    </p>
                  )}
                  {displayText && (
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                      {displayText}
                    </p>
                  )}
                  {speakError && <p className="text-sm text-amber-600">{speakError}</p>}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isRecording ? "danger" : "secondary"}
                      onClick={() => (isRecording ? stop() : start())}
                      className="shrink-0"
                    >
                      {isRecording ? (
                        <Square className="h-4 w-4 fill-current" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={handleSpeakSubmit}
                      disabled={!displayText && !isRecording}
                      className="flex-1"
                    >
                      Verificar pronúncia
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-emerald-100 bg-emerald-50/30">
              <CardContent className="pt-6">
                <CardTitle className="mb-2 text-emerald-800 text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Dica de gramática
                </CardTitle>
                <p className="text-sm text-slate-700">{lesson.grammarTip}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function LessonsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Loading />
        </AppShell>
      }
    >
      <LessonsContent />
    </Suspense>
  );
}
