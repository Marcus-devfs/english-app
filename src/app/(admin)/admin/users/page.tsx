"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  diagnosedLevel?: string;
  onboardingCompleted: boolean;
  progress: {
    streakDays: number;
    xp: number;
    lessonsCompleted: number;
    lastStudyDate?: string;
  };
  preferences: {
    notificationsEnabled?: boolean;
    timezone?: string;
  };
  pushDevices: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (query) params.set("search", query);

    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (data.success) {
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    }
    setLoading(false);
  }, [page, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-norte-ink">Usuários</h1>
        <p className="text-slate-500 mt-1">
          {pagination ? `${pagination.total} usuários cadastrados` : "Carregando..."}
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>
      </form>

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
                  <th className="px-6 py-3 font-medium">Usuário</th>
                  <th className="px-6 py-3 font-medium">Nível</th>
                  <th className="px-6 py-3 font-medium">Progresso</th>
                  <th className="px-6 py-3 font-medium">Push</th>
                  <th className="px-6 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="block hover:text-norte-blue"
                      >
                        <p className="font-medium text-norte-ink">{u.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{u.email}</p>
                        <div className="flex gap-1.5 mt-1.5">
                          <Badge
                            variant={u.onboardingCompleted ? "success" : "warning"}
                          >
                            {u.onboardingCompleted ? "Ativo" : "Onboarding"}
                          </Badge>
                          {u.role === "admin" && (
                            <Badge variant="info">Admin</Badge>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.diagnosedLevel ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p>{u.progress.xp} XP</p>
                      <p className="text-xs text-slate-400">
                        {u.progress.streakDays}d streak · {u.progress.lessonsCompleted}{" "}
                        lições
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {u.preferences.notificationsEnabled ? (
                        <Badge variant="success">
                          {u.pushDevices} device{u.pushDevices !== 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <Badge variant="default">Off</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Nenhum usuário encontrado
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
            Página {pagination.page} de {pagination.totalPages}
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
