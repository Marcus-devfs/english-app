"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useVoiceRecorder } from "@/lib/hooks/use-voice-recorder";

interface Message {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  corrections?: { original: string; corrected: string; explanation: string }[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isRecording, displayText, start, stop } = useVoiceRecorder();

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.messages.length > 0) {
          setMessages(data.data.messages);
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Hello! I'm Alex, your English teacher. Let's practice! Tell me about yourself or what you did today. Don't worry about mistakes — I'm here to help! 😊",
            },
          ]);
        }
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isRecording && displayText) {
      setInput(displayText);
    }
  }, [isRecording, displayText]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data.message]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleMicToggle() {
    if (isRecording) {
      const text = stop();
      if (text) setInput(text);
    } else {
      setInput("");
      start();
    }
  }

  return (
    <AppShell showHeader={false}>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-norte-blue">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-norte-ink">Alex — Professor IA</h1>
            <p className="text-xs text-slate-500">Correções em tempo real</p>
          </div>
          <Badge variant="success">Online</Badge>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "user" ? "bg-norte-blue-light" : "bg-emerald-50"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-norte-blue" />
                  ) : (
                    <Bot className="h-4 w-4 text-norte-green" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-norte-blue text-white rounded-tr-sm"
                      : "bg-white border border-slate-100 text-norte-ink rounded-tl-sm shadow-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.corrections && msg.corrections.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {msg.corrections.map((c, j) => (
                        <div key={j} className="text-xs bg-amber-50 rounded-lg p-2">
                          <p className="text-red-600 line-through">{c.original}</p>
                          <p className="text-norte-green font-medium">{c.corrected}</p>
                          <p className="text-slate-500 mt-0.5">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-norte-green" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
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

        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
          {isRecording && (
            <p className="text-xs text-red-500 font-medium text-center mb-2 animate-pulse">
              ● Gravando… toque no quadrado vermelho quando terminar
            </p>
          )}
          <div className="flex gap-2 items-end">
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={loading}
              className={cn(
                "shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all",
                isRecording
                  ? "bg-red-500 text-white recording-pulse"
                  : "bg-norte-blue-light text-norte-blue hover:bg-norte-blue/10"
              )}
            >
              {isRecording ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isRecording && sendMessage(input)}
              placeholder={isRecording ? "Falando…" : "Digite em inglês..."}
              disabled={loading || isRecording}
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-norte-blue text-sm"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || isRecording}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
