"use client";

import Link from "next/link";
import { Bell, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface NotificationPromptCardProps {
  loading?: boolean;
  isDenied?: boolean;
  onEnable: () => void;
  onShowHelp?: () => void;
  onDismiss: () => void;
  className?: string;
}

export function NotificationPromptCard({
  loading,
  isDenied,
  onEnable,
  onShowHelp,
  onDismiss,
  className,
}: NotificationPromptCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-4 shadow-sm",
        isDenied
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
          : "border-norte-blue/20 bg-gradient-to-br from-norte-blue-light to-white",
        className
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-slate-400 hover:text-slate-600"
        aria-label="Dispensar"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex gap-3 pr-6">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white",
            isDenied ? "bg-amber-500" : "bg-norte-blue"
          )}
        >
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-norte-ink">
            {isDenied ? "Permissão negada no celular" : "Lembretes desativados"}
          </p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {isDenied
              ? "Libere nas configurações do sistema — o app não consegue perguntar de novo sozinho."
              : "Ative push para não perder sua streak e receber mensagens no seu objetivo."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isDenied && onShowHelp ? (
              <>
                <Button size="sm" variant="accent" onClick={onShowHelp}>
                  Ver como liberar
                </Button>
                <Button size="sm" loading={loading} onClick={onEnable}>
                  Tentar de novo
                </Button>
              </>
            ) : (
              <Button size="sm" loading={loading} onClick={onEnable}>
                Ativar agora
              </Button>
            )}
            <Link
              href="/profile"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-norte-blue hover:underline"
            >
              Ver no perfil
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
