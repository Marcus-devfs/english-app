"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Flame } from "lucide-react";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/layout/tab-bar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Início",
  "/trilha": "Sua trilha",
  "/lessons": "Lição do dia",
  "/quiz": "Quiz",
  "/vocabulary": "Vocabulário",
  "/chat": "Conversar com IA",
};

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
  const router = useRouter();

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    "Norte";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

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
                  Olá, {userName.split(" ")[0]}
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
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 active:scale-95"
              aria-label="Sair"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
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
