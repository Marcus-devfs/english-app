"use client";

import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useVoiceRecorder } from "@/lib/hooks/use-voice-recorder";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onComplete: (text: string) => void;
  lang?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function VoiceRecorder({
  onComplete,
  lang = "en-US",
  placeholder = "Toque para falar. Toque no botão vermelho quando terminar.",
  className,
  compact = false,
}: VoiceRecorderProps) {
  const { isRecording, displayText, start, stop, reset } = useVoiceRecorder(lang);

  function handleToggle() {
    if (isRecording) {
      const text = stop();
      if (text) onComplete(text);
    } else {
      reset();
      start();
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all",
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
          {isRecording
            ? "Fale com calma. Toque no botão vermelho quando terminar."
            : placeholder}
        </p>

        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "relative h-20 w-20 rounded-full mx-auto flex items-center justify-center transition-all shadow-lg",
            isRecording
              ? "bg-red-500 recording-pulse"
              : "bg-norte-blue hover:bg-norte-blue/90"
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
      </div>

      {displayText && (
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">
            {isRecording ? "Transcrição ao vivo:" : "Sua resposta:"}
          </p>
          <p className="text-norte-ink leading-relaxed">{displayText}</p>
          {!isRecording && (
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
