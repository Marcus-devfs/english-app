"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { detectInstallPlatform, isStandalonePwa } from "@/lib/pwa/detect-platform";
import {
  getNotificationPermissionState,
  getPermissionHelpIntro,
  getPermissionHelpSteps,
  getPermissionHelpTitle,
  type NotificationPermissionState,
} from "@/lib/pwa/notification-permission";

interface NotificationPermissionHelpProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  retryLoading?: boolean;
  language?: "pt" | "en";
}

export function NotificationPermissionHelp({
  open,
  onClose,
  onRetry,
  retryLoading,
  language = "pt",
}: NotificationPermissionHelpProps) {
  const denied = getNotificationPermissionState() === "denied";
  const steps = getPermissionHelpSteps(detectInstallPlatform(), isStandalonePwa());

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
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-norte-ink/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-norte-ink leading-tight">
              {getPermissionHelpTitle(denied, language)}
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          {getPermissionHelpIntro(denied, language)}
        </p>

        <ol className="space-y-3 mb-6">
          {steps.map((step, index) => (
            <li
              key={index}
              className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-norte-blue text-xs font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-norte-ink">{step.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {onRetry && (
          <Button className="w-full mb-2" loading={retryLoading} onClick={onRetry}>
            {language === "en" ? "I allowed it — try again" : "Já liberei — tentar de novo"}
          </Button>
        )}
        <button
          type="button"
          onClick={onClose}
          className={cn("w-full py-2 text-sm text-slate-500 hover:text-norte-ink")}
        >
          {language === "en" ? "Close" : "Fechar"}
        </button>
      </div>
    </div>
  );
}

export function useNotificationPermissionWatch() {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");

  const refresh = useCallback(() => {
    setPermission(getNotificationPermissionState());
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { permission, isDenied: permission === "denied", refresh };
}
