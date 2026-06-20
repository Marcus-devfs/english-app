"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/notifications", label: "Notificações", icon: Bell },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-norte-bg flex">
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-100 shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-norte-blue">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-norte-ink">Norte Admin</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Painel de administração</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-norte-blue-light text-norte-blue"
                    : "text-slate-600 hover:bg-slate-50 hover:text-norte-ink"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-norte-blue transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-norte-blue">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-norte-ink">Admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-500">
            App
          </Link>
        </header>

        <nav className="md:hidden flex gap-1 p-2 bg-white border-b border-slate-100 overflow-x-auto">
          {NAV.map(({ href, label, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap",
                  active
                    ? "bg-norte-blue-light text-norte-blue"
                    : "text-slate-600"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
