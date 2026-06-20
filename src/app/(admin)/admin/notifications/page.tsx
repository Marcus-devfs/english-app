"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface NotificationItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  title: string;
  body: string;
  status: "sent" | "failed";
  localDate: string;
  timezone: string;
  slotHour?: number;
  devicesTargeted: number;
  devicesDelivered: number;
  scheduleReason: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  daily_invite: "Convite diário",
  gentle_nudge: "Lembrete suave",
  streak_risk: "Risco de streak",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "sent" | "failed">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (query) params.set("search", query);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/admin/notifications?${params}`);
    const data = await res.json();
    if (data.success) {
      setNotifications(data.data.notifications);
      setPagination(data.data.pagination);
    }
    setLoading(false);
  }, [page, query, statusFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-norte-ink">Logs de notificações</h1>
        <p className="text-slate-500 mt-1">
          Histórico de push notifications enviadas a todos os usuários
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuário ou título..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <div className="flex gap-2">
          {(["", "sent", "failed"] as const).map((s) => (
            <Button
              key={s || "all"}
              variant={statusFilter === s ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
            >
              {s === "" ? "Todos" : s === "sent" ? "Enviados" : "Falhas"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loading />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Notificação</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Entrega</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr
                    key={n.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${n.userId}`}
                        className="hover:text-norte-blue"
                      >
                        <p className="font-medium text-norte-ink">{n.userName}</p>
                        <p className="text-xs text-slate-400">{n.userEmail}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-norte-ink truncate">{n.title}</p>
                      <p className="text-xs text-slate-400 truncate">{n.body}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={n.status === "sent" ? "success" : "warning"}>
                        {n.status === "sent" ? "Enviado" : "Falhou"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {n.devicesDelivered}/{n.devicesTargeted}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(n.createdAt)}
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      Nenhuma notificação encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {pagination.total} registros · Página {pagination.page} de{" "}
            {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
