"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, Crown } from "lucide-react";
import { GOAL_LABELS, type LearningGoal } from "@/types";
import { Button } from "@/components/ui/button";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  goal?: LearningGoal;
  selfAssessedLevel?: string;
  diagnosedLevel?: string;
  onboardingCompleted: boolean;
  progress: {
    currentLevel: string;
    targetLevel: string;
    lessonsCompleted: number;
    quizzesCompleted: number;
    totalStudyMinutes: number;
    streakDays: number;
    lastStudyDate?: string;
    grammarScore: number;
    vocabularyScore: number;
    speakingScore: number;
    readingScore: number;
    xp: number;
  };
  preferences: {
    language: string;
    practiceDaysPerWeek: number;
    practiceMinutesPerDay: number;
    notificationsEnabled: boolean;
    reminderHour: number;
    reminderMinute: number;
    timezone: string;
  };
  notificationState?: {
    date: string;
    sentCount: number;
    lastType?: string;
  };
  pushDevices: number;
  subscription?: {
    isPro: boolean;
    isMock?: boolean;
    plan: string;
    status: string;
    source?: string;
    currentPeriodEnd?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    mockGrantedAt?: string;
    mockMonths?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  chatMessageCount: number;
  recentMessages: { role: string; content: string; createdAt: string }[];
  assessments: {
    diagnosedLevel: string;
    score: number;
    totalQuestions: number;
    createdAt: string;
  }[];
  notificationLogs: {
    title: string;
    body: string;
    status: string;
    type: string;
    localDate: string;
    createdAt: string;
  }[];
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-sm font-medium text-norte-ink text-right">{value}</span>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [mockMonths, setMockMonths] = useState(1);
  const [subMessage, setSubMessage] = useState("");

  async function loadUser() {
    const res = await fetch(`/api/admin/users/${id}`);
    const data = await res.json();
    if (data.success) {
      setUser(data.data.user);
      setActivity(data.data.activity);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUser();
  }, [id]);

  async function grantMockPro() {
    setSubLoading(true);
    setSubMessage("");
    try {
      const res = await fetch(`/api/admin/users/${id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro", months: mockMonths }),
      });
      const data = await res.json();
      if (data.success) {
        setSubMessage(data.data.message ?? "PRO mock concedido.");
        await loadUser();
      } else {
        setSubMessage(data.error ?? "Erro ao conceder PRO.");
      }
    } finally {
      setSubLoading(false);
    }
  }

  async function revokeMockPro() {
    setSubLoading(true);
    setSubMessage("");
    try {
      const res = await fetch(`/api/admin/users/${id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "free" }),
      });
      const data = await res.json();
      if (data.success) {
        setSubMessage(data.data.message ?? "Assinatura revogada.");
        await loadUser();
      } else {
        setSubMessage(data.error ?? "Erro ao revogar.");
      }
    } finally {
      setSubLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-slate-500 text-center py-20">Usuário não encontrado.</p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-norte-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para usuários
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-norte-ink">{user.name}</h1>
          <p className="text-slate-500 mt-1">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant={user.onboardingCompleted ? "success" : "warning"}>
              {user.onboardingCompleted ? "Onboarding completo" : "Em onboarding"}
            </Badge>
            {user.role === "admin" && <Badge variant="info">Admin</Badge>}
            {user.subscription?.isPro && (
              <Badge className="bg-amber-100 text-amber-700">PRO</Badge>
            )}
            {user.diagnosedLevel && (
              <Badge variant="level">Nível {user.diagnosedLevel}</Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Cadastro: {formatDateTime(user.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <CardTitle className="mb-4">Progresso</CardTitle>
            <InfoRow label="XP" value={user.progress?.xp ?? 0} />
            <InfoRow label="Streak" value={`${user.progress?.streakDays ?? 0} dias`} />
            <InfoRow label="Lições" value={user.progress?.lessonsCompleted ?? 0} />
            <InfoRow label="Quizzes" value={user.progress?.quizzesCompleted ?? 0} />
            <InfoRow
              label="Tempo de estudo"
              value={`${user.progress?.totalStudyMinutes ?? 0} min`}
            />
            <InfoRow
              label="Último estudo"
              value={user.progress?.lastStudyDate ?? "—"}
            />
            <InfoRow
              label="Nível atual → meta"
              value={`${user.progress?.currentLevel ?? "—"} → ${user.progress?.targetLevel ?? "—"}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <CardTitle className="mb-1 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Assinatura mock
            </CardTitle>
            <p className="text-xs text-slate-500 mb-4">
              Pagamentos reais desativados. Conceda PRO com dados simulados.
            </p>
            <InfoRow
              label="Origem"
              value={
                user.subscription?.source === "stripe" ? (
                  <Badge variant="info">Stripe</Badge>
                ) : (
                  <Badge className="bg-violet-100 text-violet-700">Mock</Badge>
                )
              }
            />
            <InfoRow label="Plano" value={user.subscription?.plan ?? "free"} />
            <InfoRow label="Status" value={user.subscription?.status ?? "inactive"} />
            <InfoRow
              label="Válido até"
              value={
                user.subscription?.currentPeriodEnd
                  ? formatDateTime(user.subscription.currentPeriodEnd)
                  : "—"
              }
            />
            {user.subscription?.isPro && user.subscription.source !== "stripe" && (
              <>
                <InfoRow
                  label="Customer ID"
                  value={
                    <code className="text-xs">{user.subscription.stripeCustomerId ?? "—"}</code>
                  }
                />
                <InfoRow
                  label="Subscription ID"
                  value={
                    <code className="text-xs break-all">
                      {user.subscription.stripeSubscriptionId ?? "—"}
                    </code>
                  }
                />
                <InfoRow
                  label="Concedido em"
                  value={
                    user.subscription.mockGrantedAt
                      ? formatDateTime(user.subscription.mockGrantedAt)
                      : "—"
                  }
                />
                <InfoRow
                  label="Duração"
                  value={
                    user.subscription.mockMonths
                      ? `${user.subscription.mockMonths} mês(es)`
                      : "—"
                  }
                />
              </>
            )}
            {!user.subscription?.isPro && (
              <div className="mt-4 space-y-3">
                <label className="block text-sm text-slate-600">
                  Duração do PRO mock
                  <select
                    value={mockMonths}
                    onChange={(e) => setMockMonths(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value={1}>1 mês</option>
                    <option value={3}>3 meses</option>
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses</option>
                  </select>
                </label>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full"
                  disabled={subLoading}
                  onClick={grantMockPro}
                >
                  Conceder PRO mock
                </Button>
              </div>
            )}
            {user.subscription?.isPro && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full mt-4"
                disabled={subLoading}
                onClick={revokeMockPro}
              >
                Revogar PRO
              </Button>
            )}
            {subMessage && (
              <p className="text-xs text-slate-600 mt-3 rounded-lg bg-slate-50 px-3 py-2">
                {subMessage}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <CardTitle className="mb-4">Perfil & preferências</CardTitle>
            <InfoRow
              label="Objetivo"
              value={user.goal ? GOAL_LABELS[user.goal] : "—"}
            />
            <InfoRow
              label="Autoavaliação"
              value={user.selfAssessedLevel ?? "—"}
            />
            <InfoRow label="Idioma UI" value={(user.preferences?.language ?? "pt").toUpperCase()} />
            <InfoRow
              label="Prática"
              value={`${user.preferences?.practiceDaysPerWeek ?? "—"}x/semana · ${user.preferences?.practiceMinutesPerDay ?? "—"} min`}
            />
            <InfoRow label="Timezone" value={user.preferences?.timezone ?? "—"} />
            <InfoRow
              label="Notificações"
              value={
                user.preferences?.notificationsEnabled ? (
                  <Badge variant="success">Ativas</Badge>
                ) : (
                  <Badge variant="default">Desativadas</Badge>
                )
              }
            />
            <InfoRow label="Dispositivos push" value={user.pushDevices} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <CardTitle className="mb-4">
              Chat ({activity?.chatMessageCount ?? 0} mensagens)
            </CardTitle>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity?.recentMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm p-3 rounded-xl ${
                    msg.role === "user"
                      ? "bg-norte-blue-light text-norte-ink"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <p className="text-xs font-medium text-slate-400 mb-1 capitalize">
                    {msg.role}
                  </p>
                  <p className="line-clamp-3">{msg.content}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              ))}
              {!activity?.recentMessages.length && (
                <p className="text-slate-400 text-sm">Nenhuma mensagem</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <CardTitle className="mb-4">Notificações push</CardTitle>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity?.notificationLogs.map((log, i) => (
                <div key={i} className="text-sm border-b border-slate-50 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-norte-ink">{log.title}</p>
                    <Badge variant={log.status === "sent" ? "success" : "warning"}>
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{log.body}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {log.type} · {log.localDate} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))}
              {!activity?.notificationLogs.length && (
                <p className="text-slate-400 text-sm">Nenhuma notificação enviada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {activity && activity.assessments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <CardTitle className="mb-4">Avaliações diagnósticas</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {activity.assessments.map((a, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50">
                  <p className="font-medium text-norte-ink">Nível {a.diagnosedLevel}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {a.score}/{a.totalQuestions} acertos
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {formatDateTime(a.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
