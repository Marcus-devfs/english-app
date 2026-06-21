"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/layout/tab-bar";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { ProBadge } from "@/components/subscription/pro-badge";
import { cn } from "@/lib/utils/cn";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  streak?: number;
  showHeader?: boolean;
}

export function AppShell({
  children,
  userName,
  streak = 0,
  showHeader = true,
}: AppShellProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { isPro } = useSubscription();

  const pageTitles: Record<string, string> = {
    "/dashboard": t("nav.home"),
    "/trilha": t("nav.trail"),
    "/lessons": t("nav.home"),
    "/quiz": "Quiz",
    "/vocabulary": t("nav.vocab"),
    "/chat": t("nav.ai"),
    "/profile": t("nav.profile"),
  };

  const pageTitle =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    "Norte";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-norte-bg shadow-xl lg:my-4 lg:min-h-[calc(100dvh-2rem)] lg:rounded-[2rem] lg:border lg:border-slate-200 lg:overflow-hidden">
      {showHeader && (
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100/80 bg-norte-bg/95 px-4 py-3 backdrop-blur-xl">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Image
              src="/icons/norte-icon-192.png"
              alt="Norte"
              width={32}
              height={32}
              className="rounded-lg shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-norte-ink">
                {pageTitle}
              </p>
              {userName && pathname === "/dashboard" && (
                <p className="truncate text-[11px] text-slate-500">
                  {userName.split(" ")[0]}
                </p>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {streak > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                <Flame className="h-3.5 w-3.5" />
                {streak}
              </div>
            )}
            <Link
              href="/profile"
              className="flex flex-col items-center gap-0.5 shrink-0"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors active:scale-95",
                  pathname === "/profile"
                    ? isPro
                      ? "bg-norte-ink text-white ring-2 ring-norte-ink/20"
                      : "bg-norte-blue text-white"
                    : isPro
                      ? "bg-norte-ink text-white"
                      : "bg-norte-blue-light text-norte-blue hover:bg-norte-blue/10"
                )}
              >
                {userName ? userName[0]?.toUpperCase() : "?"}
              </span>
              {isPro && <ProBadge size="xs" />}
            </Link>
          </div>
        </header>
      )}

      <main
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{
          paddingBottom: `calc(${TAB_BAR_HEIGHT} + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {children}
      </main>

      <TabBar />
    </div>
  );
}
