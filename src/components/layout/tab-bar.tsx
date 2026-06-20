"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LayoutDashboard, BookOpen, Brain, Library, MessageCircle } from "lucide-react";

export const TAB_BAR_HEIGHT = "4.5rem";

const tabs = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/lessons", label: "Lição", icon: BookOpen },
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/vocabulary", label: "Estudar", icon: Library },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-[4.5rem] max-w-lg items-stretch px-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0",
                "transition-colors active:scale-95 duration-150",
                active ? "text-indigo-600" : "text-slate-400"
              )}
            >
              {active && (
                <span className="absolute top-1.5 h-1 w-8 rounded-full bg-indigo-600" />
              )}
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl transition-all",
                  active && "bg-indigo-50"
                )}
              >
                <Icon
                  className={cn("h-[22px] w-[22px]", active && "stroke-[2.5]")}
                  strokeWidth={active ? 2.5 : 2}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none truncate max-w-full px-0.5",
                  active && "font-semibold"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
