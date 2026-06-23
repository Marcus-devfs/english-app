"use client";

import { useEffect } from "react";
import { Mic, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAudioRecorder } from "@/lib/hooks/use-audio-recorder";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onComplete: (text: string) => void;
  onTranscriptChange?: (text: string) => void;
  lang?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function VoiceRecorder({
  onComplete,
  onTranscriptChange,
  placeholder = "Toque para gravar. A IA vai transcrever o que você falar.",
  className,
  compact = false,
}: VoiceRecorderProps) {
  const {
    isRecording,
    isTranscribing,
    displayText,
    micError,
    transcribeSource,
    start,
    stop,
    reset,
  } = useAudioRecorder();

  useEffect(() => {
    onTranscriptChange?.(displayText);
  }, [displayText, onTranscriptChange]);

  async function handleToggle() {
    if (isRecording) {
      const text = await stop();
      if (text) onComplete(text);
    } else {
      reset();
      await start();
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isTranscribing}
        className={cn(
          "shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-60",
          isRecording
            ? "bg-red-500 text-white recording-pulse"
            : "bg-norte-blue-light text-norte-blue hover:bg-norte-blue/10",
          className
        )}
        aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
      >
        {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl bg-norte-blue-light border border-norte-blue/10 p-6 text-center">
        <p className="text-sm text-norte-blue mb-4">
          {isTranscribing
            ? "Transcrevendo com IA…"
            : isRecording
              ? "Fale com calma. Toque no vermelho quando terminar."
              : placeholder}
        </p>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isTranscribing}
          className={cn(
            "relative h-20 w-20 rounded-full mx-auto flex items-center justify-center transition-all shadow-lg disabled:opacity-60",
            isRecording ? "bg-red-500 recording-pulse" : "bg-norte-blue hover:bg-norte-blue/90"
          )}
        >
          {isRecording ? (
            <Square className="h-8 w-8 text-white fill-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
          {isRecording && (
            <span className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-40" />
          )}
        </button>

        {isRecording && (
          <p className="text-sm font-medium text-red-600 mt-4 animate-pulse">
            ● Gravando… toque para finalizar
          </p>
        )}

        {isTranscribing && (
          <p className="text-sm font-medium text-norte-blue mt-4 flex items-center justify-center gap-1">
            <Sparkles className="h-4 w-4" />
            IA transcrevendo seu áudio
          </p>
        )}

        {micError && <p className="text-sm text-red-600 mt-3">{micError}</p>}
      </div>

      {displayText && (
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500">
              {transcribeSource === "gemini" ? "Transcrição (IA):" : "Transcrição:"}
            </p>
            {transcribeSource === "gemini" && (
              <span className="text-[10px] text-norte-blue flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Gemini
              </span>
            )}
          </div>
          <p className="text-norte-ink leading-relaxed">{displayText}</p>
          {!isRecording && !isTranscribing && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => onComplete(displayText)}
            >
              Usar esta resposta
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
