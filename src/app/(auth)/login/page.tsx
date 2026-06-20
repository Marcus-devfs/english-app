"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden bg-norte-bg">
      <div className="flex flex-1 flex-col justify-center px-6 py-4 min-h-0">
        <div className="text-center mb-6 shrink-0">
          <Image
            src="/icons/norte-icon-192.png"
            alt="Norte"
            width={56}
            height={56}
            className="rounded-xl mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-norte-ink">Bem-vindo de volta!</h1>
          <p className="text-slate-600 mt-1 text-sm">Entre para continuar sua trilha</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 shrink-0">
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
            <Link href="/register" className="text-norte-blue font-medium hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
