"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Users,
  UserCheck,
  Flame,
  Bell,
  MessageSquare,
  ClipboardList,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  onboardedUsers: number;
  activeToday: number;
  pushSentWeek: number;
  pushFailedWeek: number;
  totalChatMessages: number;
  totalAssessments: number;
  avgStreakDays: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  onboardingCompleted: boolean;
  streakDays: number;
  xp: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-norte-ink mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className="p-2.5 rounded-xl bg-norte-blue-light text-norte-blue">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data.stats);
          setRecentUsers(data.data.recentUsers);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-slate-500 text-center py-20">
        Não foi possível carregar os dados.
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-norte-ink">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Visão geral dos usuários e atividade do app
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de usuários" value={stats.totalUsers} icon={Users} />
        <StatCard
          label="Onboarding completo"
          value={stats.onboardedUsers}
          icon={UserCheck}
          sub={`${stats.totalUsers ? Math.round((stats.onboardedUsers / stats.totalUsers) * 100) : 0}% do total`}
        />
        <StatCard label="Ativos hoje" value={stats.activeToday} icon={Flame} />
        <StatCard
          label="Streak médio"
          value={`${stats.avgStreakDays}d`}
          icon={Flame}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Push enviados (7d)"
          value={stats.pushSentWeek}
          icon={Bell}
          sub={`${stats.pushFailedWeek} falhas`}
        />
        <StatCard
          label="Mensagens no chat"
          value={stats.totalChatMessages}
          icon={MessageSquare}
        />
        <StatCard
          label="Avaliações feitas"
          value={stats.totalAssessments}
          icon={ClipboardList}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <CardTitle className="mb-4">Usuários recentes</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-medium">Nome</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">XP</th>
                  <th className="pb-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-medium text-norte-blue hover:underline"
                      >
                        {u.name}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">{u.email}</td>
                    <td className="py-3">
                      <Badge variant={u.onboardingCompleted ? "success" : "warning"}>
                        {u.onboardingCompleted ? "Ativo" : "Onboarding"}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600">{u.xp}</td>
                    <td className="py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Link
              href="/admin/users"
              className="text-sm text-norte-blue hover:underline"
            >
              Ver todos os usuários →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
