"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Home, Map, MessageCircle, BookOpen } from "lucide-react";

export const TAB_BAR_HEIGHT = "4.5rem";

const tabs = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/trilha", label: "Trilha", icon: Map },
  { href: "/chat", label: "IA", icon: MessageCircle },
  { href: "/vocabulary", label: "Vocab", icon: BookOpen },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-[4.5rem] max-w-lg items-stretch px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (href === "/dashboard" && pathname === "/lessons");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0",
                "transition-colors active:scale-95 duration-150",
                active ? "text-norte-blue" : "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl transition-all",
                  active && "bg-norte-blue-light"
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={cn("text-[10px] font-medium leading-none", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
