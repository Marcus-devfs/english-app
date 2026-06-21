"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { PRO_FEATURES } from "@/types/subscription";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";

interface SubscriptionData {
  subscription: {
    isPro: boolean;
    isMock?: boolean;
    plan: string;
    source?: string;
    currentPeriodEnd?: string;
  };
  price: number;
  currency: string;
  paymentsMode: "mock" | "stripe";
  stripeConfigured: boolean;
}

export default function ProPage() {
  return (
    <Suspense
      fallback={
        <AppShell showHeader={false}>
          <Loading />
        </AppShell>
      }
    >
      <ProPageContent />
    </Suspense>
  );
}

function ProPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  async function handleSubscribe() {
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      const json = await res.json();
      if (json.success && json.data.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error ?? "Não foi possível iniciar o pagamento.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManage() {
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const json = await res.json();
      if (json.success && json.data.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error ?? "Não foi possível abrir o portal.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell showHeader={false}>
        <Loading />
      </AppShell>
    );
  }

  const isPro = data?.subscription.isPro;
  const isMockMode = data?.paymentsMode === "mock";

  return (
    <AppShell showHeader={false}>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-norte-blue mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {success && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            Assinatura ativada! Bem-vindo ao PRO.
          </div>
        )}
        {canceled && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Pagamento cancelado. Você pode tentar novamente quando quiser.
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-norte-ink to-slate-800 p-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-norte-blue/20" />
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-amber-400" />
            <Badge className="bg-amber-400/20 text-amber-300 border-0">
              PRO
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">Norte PRO</h1>
          <p className="text-slate-300 mt-2 text-sm">
            Desbloqueie a entrevista com IA e acelere sua fluência.
          </p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold">${data?.price ?? 2.99}</span>
            <span className="text-slate-400 text-sm">/ mês</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            O que você ganha
          </h2>
          <ul className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 rounded-xl bg-white border border-slate-100 p-4"
              >
                <Check className="h-5 w-5 text-norte-green shrink-0 mt-0.5" />
                <span className="text-sm text-norte-ink">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-3">
          {isPro ? (
            <>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Você é membro PRO
                {data?.subscription.isMock && (
                  <Badge className="bg-violet-100 text-violet-700 ml-1">Mock</Badge>
                )}
                {data?.subscription.currentPeriodEnd && (
                  <span className="text-emerald-600">
                    · até{" "}
                    {new Date(data.subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <Link href="/interview">
                <Button variant="accent" className="w-full">
                  Iniciar entrevista
                </Button>
              </Link>
              {data?.stripeConfigured && data.paymentsMode === "stripe" && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleManage}
                  disabled={checkoutLoading}
                >
                  Gerenciar assinatura
                </Button>
              )}
            </>
          ) : (
            <>
              {isMockMode ? (
                <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-4 text-sm text-violet-900 space-y-2">
                  <p className="font-medium">Pagamento em breve</p>
                  <p className="text-violet-700 text-xs leading-relaxed">
                    Por enquanto, o PRO é liberado manualmente pelo admin. Entre em contato ou peça
                    para ativarem sua assinatura no painel.
                  </p>
                </div>
              ) : (
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={checkoutLoading || !data?.stripeConfigured}
                >
                  {checkoutLoading ? "Redirecionando..." : "Assinar por $2.99/mês"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
