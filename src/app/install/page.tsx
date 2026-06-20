"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  Monitor,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  detectInstallPlatform,
  getPlatformLabel,
  isStandalonePwa,
  type InstallPlatform,
} from "@/lib/pwa/detect-platform";

interface InstallStep {
  icon: React.ElementType;
  title: string;
  description: string;
}

const STEPS: Record<InstallPlatform, InstallStep[]> = {
  ios: [
    {
      icon: Share,
      title: "Abra no Safari",
      description:
        "Este site precisa ser aberto no Safari (não funciona dentro do Instagram ou WhatsApp). Toque nos ⋯ e escolha “Abrir no Safari”.",
    },
    {
      icon: Share,
      title: "Toque em Compartilhar",
      description:
        "Na barra inferior do Safari, toque no ícone de compartilhar (quadrado com seta para cima).",
    },
    {
      icon: PlusSquare,
      title: "Adicionar à Tela de Início",
      description:
        "Role o menu e selecione “Adicionar à Tela de Início”. Confirme o nome Norte e toque em Adicionar.",
    },
  ],
  android: [
    {
      icon: MoreVertical,
      title: "Abra no Chrome",
      description:
        "Use o Google Chrome para instalar. Se abriu pelo WhatsApp, toque nos ⋯ e “Abrir no navegador”.",
    },
    {
      icon: Download,
      title: "Instalar o app",
      description:
        "Toque no menu (⋮) no canto superior direito e selecione “Instalar app” ou “Adicionar à tela inicial”.",
    },
    {
      icon: Smartphone,
      title: "Abra pela tela inicial",
      description:
        "O ícone do Norte aparecerá na sua home. Abra por lá para ter a experiência completa e notificações.",
    },
  ],
  desktop: [
    {
      icon: Monitor,
      title: "Use o Chrome ou Edge",
      description: "Abra este link no Chrome ou Microsoft Edge para instalar como app.",
    },
    {
      icon: Download,
      title: "Clique em Instalar",
      description:
        "Procure o ícone de instalação (⊕ ou computador) na barra de endereço, à direita, e confirme.",
    },
    {
      icon: Smartphone,
      title: "Ou use no celular",
      description:
        "Para a melhor experiência, acesse este link no seu iPhone ou Android e siga as instruções do dispositivo.",
    },
  ],
  unknown: [
    {
      icon: Smartphone,
      title: "Acesse pelo celular",
      description: "Abra este link no Safari (iOS) ou Chrome (Android) para instalar o Norte.",
    },
  ],
};

function PlatformTabs({
  platform,
  onChange,
}: {
  platform: InstallPlatform;
  onChange: (p: InstallPlatform) => void;
}) {
  const tabs: InstallPlatform[] = ["ios", "android", "desktop"];

  return (
    <div className="flex gap-2 p-1 rounded-xl bg-white/10 backdrop-blur">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
            platform === tab ? "bg-white text-norte-ink" : "text-white/80 hover:text-white"
          )}
        >
          {tab === "ios" ? "iPhone" : tab === "android" ? "Android" : "Desktop"}
        </button>
      ))}
    </div>
  );
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<InstallPlatform>("unknown");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectInstallPlatform());
    setInstalled(isStandalonePwa());
  }, []);

  const steps = STEPS[platform] ?? STEPS.unknown;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-norte-ink text-white">
      <div className="relative overflow-hidden px-6 pt-10 pb-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-norte-blue/30 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-norte-yellow/20 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <Image
            src="/icons/norte-icon-192.png"
            alt="Norte"
            width={72}
            height={72}
            className="rounded-2xl mb-4 shadow-xl shadow-black/20"
            priority
          />
          <p className="text-xs font-bold uppercase tracking-widest text-norte-yellow mb-2">
            Instalar app
          </p>
          <h1 className="text-2xl font-bold leading-tight mb-2">
            Coloque o Norte na sua tela inicial
          </h1>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            App nativo, acesso rápido e lembretes de prática — sem baixar da App Store.
          </p>
        </div>
      </div>

      <div className="rounded-t-[2rem] bg-norte-bg text-norte-ink min-h-[60dvh] px-6 pt-8 pb-10">
        {installed ? (
          <div className="rounded-2xl bg-emerald-50 border border-norte-green/20 p-6 text-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-norte-green mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-1">App instalado!</h2>
            <p className="text-sm text-slate-600 mb-4">
              Abra o Norte pelo ícone na sua tela inicial para a melhor experiência.
            </p>
            <Link href="/">
              <Button className="w-full">Abrir Norte</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Detectado: {getPlatformLabel(platform)}
            </p>

            <PlatformTabs platform={platform} onChange={setPlatform} />

            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={`${platform}-${index}`}
                    className="flex gap-4 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-norte-blue-light text-norte-blue font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-norte-blue shrink-0" />
                        <h3 className="font-semibold text-sm text-norte-ink">{step.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 space-y-3">
              <Link href="/">
                <Button className="w-full" size="lg">
                  Já instalei — abrir app
                </Button>
              </Link>
              <Link href="/welcome">
                <Button variant="secondary" className="w-full">
                  Continuar no navegador
                </Button>
              </Link>
            </div>
          </>
        )}

        {appUrl && (
          <p className="mt-8 text-center text-[11px] text-slate-400 break-all">
            Link para compartilhar:{" "}
            <span className="font-medium text-slate-500">{appUrl}/install</span>
          </p>
        )}
      </div>
    </div>
  );
}
