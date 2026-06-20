"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/layout/tab-bar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Início",
  "/lessons": "Lição do Dia",
  "/quiz": "Quiz",
  "/vocabulary": "Estudar",
  "/chat": "Chat com IA",
};

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
}

export function AppShell({ children, userName }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    "EnglishPath";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-slate-50 shadow-xl lg:my-4 lg:min-h-[calc(100dvh-2rem)] lg:rounded-[2rem] lg:border lg:border-slate-200 lg:overflow-hidden">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-900">
              {pageTitle}
            </p>
            {userName && (
              <p className="truncate text-[11px] text-slate-500">
                Olá, {userName.split(" ")[0]}
              </p>
            )}
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 active:scale-95"
          aria-label="Sair"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </header>

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
