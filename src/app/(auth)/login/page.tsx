"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Erro ao entrar");
        return;
      }

      if (!data.data.user.onboardingCompleted) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">EnglishPath</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta!</h1>
          <p className="text-slate-600 mt-2">Entre para continuar sua trilha</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>

          <p className="text-center text-sm text-slate-600">
            Não tem conta?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
