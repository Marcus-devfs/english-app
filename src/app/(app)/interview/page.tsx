"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ProBadge } from "@/components/subscription/pro-badge";
import { Loading } from "@/components/ui/loading";
import { useInterviewVoice } from "@/lib/hooks/use-interview-voice";
import {
  ArrowLeft,
  Crown,
  Lock,
  Mic,
  Square,
  ClipboardCheck,
  Volume2,
  Sparkles,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Feedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

function phaseLabel(phase: string, isRecording: boolean) {
  if (phase === "ai_speaking") return "Alex está falando…";
  if (phase === "transcribing") return "Transcrevendo sua resposta…";
  if (phase === "thinking") return "Alex está preparando a próxima pergunta…";
  if (isRecording || phase === "listening") return "Gravando — toque para enviar";
  if (phase === "ready") return "Toque no microfone para responder";
  return "";
}

function InterviewContent() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);

  const {
    phase,
    sessionId,
    questionCount,
    lastAiText,
    lastUserText,
    error,
    isRecording,
    micDisabled,
    startInterview,
    resumeSession,
    toggleMic,
    finishInterview,
    reset,
  } = useInterviewVoice();

  useEffect(() => {
    fetch("/api/interview")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setIsPro(data.data.isPro);
          if (data.data.activeSession) {
            resumeSession(
              data.data.activeSession.id,
              data.data.activeSession.messages
            );
          }
        }
      });
  }, [resumeSession]);

  async function handleStart() {
    setStarting(true);
    setFeedback(null);
    reset();
    await startInterview();
    setStarting(false);
  }

  async function handleFinish() {
    setFinishing(true);
    const result = await finishInterview();
    if (result) setFeedback(result);
    setFinishing(false);
  }

  if (isPro === null) {
    return (
      <AppShell showHeader={false}>
        <Loading />
      </AppShell>
    );
  }

  if (!isPro) {
    return (
      <AppShell showHeader={false}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-norte-ink">Entrevista com IA</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">
            Simulação profissional só por voz — Alex fala as perguntas e você responde em
            áudio. Usa seu progresso nas lições para personalizar a entrevista.
          </p>
          <Link href="/pro" className="mt-6 w-full max-w-xs">
            <Button variant="accent" className="w-full gap-2">
              <Crown className="h-4 w-4" />
              Assinar PRO — $2.99/mês
            </Button>
          </Link>
          <Link href="/dashboard" className="mt-3 text-sm text-slate-500">
            Voltar ao início
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showHeader={false}>
      <div className="flex flex-col h-full min-h-0 bg-gradient-to-b from-slate-900 to-norte-ink text-white">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold truncate">Entrevista com Alex</h1>
                <ProBadge size="sm" className="shrink-0" />
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Headphones className="h-3 w-3" />
                {sessionId
                  ? `${questionCount} pergunta(s) · só áudio`
                  : "Entrevista personalizada · só áudio"}
              </p>
            </div>
            {sessionId && (
              <button
                type="button"
                onClick={() => setShowCaptions((v) => !v)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-white/10"
              >
                {showCaptions ? "Ocultar texto" : "Legendas"}
              </button>
            )}
          </div>
        </div>

        {!sessionId && !feedback && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center mb-6 ring-4 ring-white/5">
              <ClipboardCheck className="h-9 w-9 text-norte-yellow" />
            </div>
            <h2 className="text-xl font-bold">Entrevista por voz</h2>
            <p className="text-sm text-slate-400 mt-3 max-w-sm leading-relaxed">
              Diferente do chat, aqui é uma simulação real de entrevista. Alex faz perguntas em
              voz alta com base nas suas lições, nível e objetivo. Você responde falando — a IA
              transcreve e conduz a conversa.
            </p>
            <ul className="text-xs text-slate-500 mt-4 space-y-1.5 text-left max-w-xs">
              <li className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-norte-yellow shrink-0" />
                Alex fala as perguntas (voz natural)
              </li>
              <li className="flex items-center gap-2">
                <Mic className="h-3.5 w-3.5 text-norte-yellow shrink-0" />
                Você responde só por áudio
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-norte-yellow shrink-0" />
                Perguntas baseadas no seu progresso
              </li>
            </ul>
            <Button
              variant="accent"
              className="mt-8"
              onClick={handleStart}
              disabled={starting}
            >
              {starting ? "Preparando entrevista…" : "Iniciar entrevista por voz"}
            </Button>
          </div>
        )}

        {feedback && (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-5 text-center">
              <p className="text-sm text-slate-400">Pontuação geral</p>
              <p className="text-4xl font-bold text-norte-yellow mt-1">
                {feedback.overallScore}%
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm font-semibold mb-2">Resumo</p>
              <p className="text-sm text-slate-300">{feedback.summary}</p>
            </div>
            {feedback.strengths.length > 0 && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <p className="text-sm font-semibold text-emerald-300 mb-2">Pontos fortes</p>
                <ul className="text-sm text-emerald-200/90 space-y-1">
                  {feedback.strengths.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.improvements.length > 0 && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                <p className="text-sm font-semibold text-amber-300 mb-2">Para melhorar</p>
                <ul className="text-sm text-amber-200/90 space-y-1">
                  {feedback.improvements.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button variant="accent" className="w-full" onClick={handleStart}>
              Nova entrevista
            </Button>
          </div>
        )}

        {sessionId && !feedback && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
              <div
                className={cn(
                  "relative h-32 w-32 rounded-full flex items-center justify-center transition-all duration-500",
                  phase === "ai_speaking"
                    ? "bg-norte-blue ring-8 ring-norte-blue/30 scale-105"
                    : isRecording
                      ? "bg-red-500/20 ring-8 ring-red-500/30"
                      : "bg-white/10 ring-4 ring-white/10"
                )}
              >
                {phase === "ai_speaking" && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-norte-blue/50 animate-ping" />
                    <Volume2 className="h-12 w-12 text-white relative z-10" />
                  </>
                )}
                {isRecording && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-ping" />
                    <Mic className="h-12 w-12 text-red-400 relative z-10" />
                  </>
                )}
                {!isRecording && phase !== "ai_speaking" && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white/90">Alex</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                      Entrevistador
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-300 text-center min-h-[2.5rem]">
                {phaseLabel(phase, isRecording)}
              </p>

              {showCaptions && (
                <div className="w-full max-w-md space-y-3">
                  {lastAiText && (
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Alex</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{lastAiText}</p>
                    </div>
                  )}
                  {lastUserText && (
                    <div className="rounded-xl bg-norte-blue/20 border border-norte-blue/30 p-3">
                      <p className="text-[10px] text-slate-400 uppercase mb-1">Você</p>
                      <p className="text-sm text-white leading-relaxed">{lastUserText}</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
              )}
            </div>

            {questionCount >= 3 && (
              <div className="px-6 pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white/10 text-white border-white/10 hover:bg-white/20"
                  onClick={handleFinish}
                  disabled={finishing || phase === "ai_speaking" || isRecording}
                >
                  {finishing ? "Gerando feedback…" : "Encerrar e ver feedback"}
                </Button>
              </div>
            )}

            <div className="shrink-0 px-6 py-6 pb-safe flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={toggleMic}
                disabled={micDisabled && !isRecording}
                className={cn(
                  "relative h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-xl disabled:opacity-40",
                  isRecording
                    ? "bg-red-500 recording-pulse"
                    : "bg-norte-yellow text-norte-ink hover:scale-105 active:scale-95"
                )}
                aria-label={isRecording ? "Enviar resposta" : "Gravar resposta"}
              >
                {isRecording ? (
                  <Square className="h-8 w-8 text-white fill-white" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
                {isRecording && (
                  <span className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-40" />
                )}
              </button>
              <p className="text-xs text-slate-500">
                {isRecording ? "Toque para enviar sua resposta" : "Segure o ritmo de uma entrevista real"}
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <AppShell showHeader={false}>
          <Loading />
        </AppShell>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}
