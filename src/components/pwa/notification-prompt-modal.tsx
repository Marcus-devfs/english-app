"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface NotificationPromptModalProps {
  open: boolean;
  loading?: boolean;
  isDenied?: boolean;
  onEnable: () => void;
  onShowHelp?: () => void;
  onDismiss: () => void;
}

export function NotificationPromptModal({
  open,
  loading,
  isDenied,
  onEnable,
  onShowHelp,
  onDismiss,
}: NotificationPromptModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-norte-ink/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onDismiss}
      />

      <div
        className={cn(
          "relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl",
          "animate-in fade-in slide-in-from-bottom-4 duration-300"
        )}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative mb-4">
            <Image
              src="/icons/norte-icon-192.png"
              alt="Norte"
              width={64}
              height={64}
              className="rounded-2xl"
            />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-norte-blue text-white shadow-lg">
              <Bell className="h-4 w-4" />
            </span>
          </div>

          <h2 id="push-modal-title" className="text-xl font-bold text-norte-ink mb-2">
            {isDenied ? "Notificações bloqueadas" : "Ative os lembretes"}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-[280px]">
            {isDenied
              ? "Você negou a permissão antes. Toque abaixo para ver como liberar nas configurações do celular."
              : "Receba lembretes personalizados para manter sua streak e bater sua meta diária de prática."}
          </p>

          {isDenied ? (
            <>
              <Button className="w-full mb-3" onClick={onShowHelp}>
                Como liberar notificações
              </Button>
              <Button
                variant="secondary"
                className="w-full mb-3"
                loading={loading}
                onClick={onEnable}
              >
                Já liberei — tentar de novo
              </Button>
            </>
          ) : (
            <Button className="w-full mb-3" loading={loading} onClick={onEnable}>
              Ativar notificações
            </Button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-slate-500 hover:text-norte-ink py-2"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
