"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WELCOME_KEY, type AuthTab } from "@/lib/constants/auth";
import { cn } from "@/lib/utils/cn";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") === "register" ? "register" : "login") as AuthTab;

  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function init() {
      const seen = localStorage.getItem(WELCOME_KEY);
      if (!seen) {
        router.replace("/welcome");
        return;
      }

      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          router.replace(
            data.data.user.onboardingCompleted ? "/dashboard" : "/onboarding"
          );
          return;
        }
      } catch {
        // continua para auth
      }

      setChecking(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        tab === "login"
          ? { email, password }
          : { name, email, password, acceptedTerms: acceptedTerms as true };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Erro ao processar");
        return;
      }

      localStorage.setItem(WELCOME_KEY, "1");

      if (tab === "register" || !data.data.user.onboardingCompleted) {
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

  if (checking) {
    return (
      <div className="flex h-dvh items-center justify-center bg-norte-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-norte-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden bg-norte-bg">
      <div className="flex flex-1 flex-col justify-center px-6 py-4 min-h-0 overflow-y-auto">
        <div className="text-center mb-6 shrink-0">
          <Image
            src="/icons/norte-icon-192.png"
            alt="Norte"
            width={56}
            height={56}
            className="rounded-xl mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-norte-ink">
            {tab === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            {tab === "login"
              ? "Entre para continuar sua trilha"
              : "Comece sua trilha gratuitamente"}
          </p>
        </div>

        {/* Tabs login / cadastro */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-4">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={cn(
                "py-2.5 rounded-lg text-sm font-medium transition-all",
                tab === t
                  ? "bg-white text-norte-blue shadow-sm"
                  : "text-slate-500"
              )}
            >
              {t === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 shrink-0"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          {tab === "register" && (
            <Input
              id="name"
              label="Nome completo"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
            placeholder={
              tab === "register"
                ? "Mín. 8 caracteres, 1 maiúscula e 1 número"
                : "••••••••"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {tab === "register" && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-norte-blue accent-norte-blue"
                required
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                Li e aceito os{" "}
                <Link href="/termos" target="_blank" className="text-norte-blue underline">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" target="_blank" className="text-norte-blue underline">
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {tab === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          <Link href="/welcome" className="text-norte-blue hover:underline">
            Ver introdução do app
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-norte-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-norte-blue border-t-transparent" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
