"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { useVoiceRecorder } from "@/lib/hooks/use-voice-recorder";
import {
  ArrowLeft,
  Bot,
  Crown,
  Lock,
  Mic,
  Send,
  Square,
  User,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Feedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

function InterviewContent() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isRecording, displayText, start, stop } = useVoiceRecorder("en-US");

  useEffect(() => {
    fetch("/api/interview")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setIsPro(data.data.isPro);
          if (data.data.activeSession) {
            setSessionId(data.data.activeSession.id);
            setMessages(data.data.activeSession.messages);
            setQuestionCount(
              data.data.activeSession.messages.filter(
                (m: Message) => m.role === "assistant"
              ).length
            );
          }
        }
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, feedback]);

  useEffect(() => {
    if (isRecording && displayText) setInput(displayText);
  }, [isRecording, displayText]);

  async function startInterview() {
    setStarting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.data.sessionId);
        setMessages([data.data.message]);
        setQuestionCount(1);
      }
    } finally {
      setStarting(false);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !sessionId) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          sessionId,
          message: text.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data.message]);
        setQuestionCount(data.data.questionCount ?? questionCount + 1);
      } else {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  }

  async function finishInterview() {
    if (!sessionId || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.data.feedback);
        setSessionId(null);
      }
    } finally {
      setLoading(false);
    }
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
            Simule uma entrevista real em inglês com contexto das lições que você já estudou.
            Disponível no plano PRO.
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
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-norte-blue">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-norte-ink truncate">Entrevista com Alex</h1>
                <Badge className="shrink-0 bg-amber-100 text-amber-700">PRO</Badge>
              </div>
              <p className="text-xs text-slate-500">
                {sessionId
                  ? `${questionCount} pergunta(s) · responda em inglês`
                  : "Simulação profissional baseada no seu progresso"}
              </p>
            </div>
          </div>
        </div>

        {!sessionId && !feedback && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-norte-blue flex items-center justify-center mb-4">
              <ClipboardCheck className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-norte-ink">Pronto para a entrevista?</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              Alex vai conduzir uma entrevista em inglês usando o vocabulário e temas das suas
              lições completadas. Responda com naturalidade — como numa entrevista real.
            </p>
            <Button
              variant="accent"
              className="mt-6"
              onClick={startInterview}
              disabled={starting}
            >
              {starting ? "Preparando..." : "Começar entrevista"}
            </Button>
          </div>
        )}

        {feedback && (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <div className="rounded-2xl bg-norte-blue-light border border-norte-blue/10 p-5 text-center">
              <p className="text-sm text-slate-500">Pontuação geral</p>
              <p className="text-4xl font-bold text-norte-blue mt-1">{feedback.overallScore}%</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-100 p-4">
              <p className="text-sm font-semibold text-norte-ink mb-2">Resumo</p>
              <p className="text-sm text-slate-600">{feedback.summary}</p>
            </div>
            {feedback.strengths.length > 0 && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-sm font-semibold text-emerald-800 mb-2">Pontos fortes</p>
                <ul className="text-sm text-emerald-700 space-y-1">
                  {feedback.strengths.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.improvements.length > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">Para melhorar</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {feedback.improvements.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button variant="accent" className="w-full" onClick={startInterview}>
              Nova entrevista
            </Button>
          </div>
        )}

        {sessionId && !feedback && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        msg.role === "user" ? "bg-norte-blue" : "bg-slate-200"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-norte-blue text-white rounded-tr-md"
                          : "bg-white border border-slate-100 text-norte-ink rounded-tl-md"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-white border border-slate-100">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-slate-300 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {questionCount >= 3 && (
              <div className="px-4 pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={finishInterview}
                  disabled={loading}
                >
                  Finalizar entrevista e ver feedback
                </Button>
              </div>
            )}

            <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white pb-safe">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Answer in English..."
                  rows={1}
                  className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-norte-blue/30 max-h-24"
                />
                <button
                  type="button"
                  onClick={isRecording ? stop : start}
                  className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isRecording ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="h-11 w-11 rounded-full bg-norte-blue text-white flex items-center justify-center shrink-0 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
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
