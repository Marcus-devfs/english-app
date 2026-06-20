"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Brain, MessageCircle, Map, ChevronRight, Smartphone } from "lucide-react";
import { WELCOME_KEY } from "@/lib/constants/auth";

const slides = [
  {
    icon: Map,
    title: "Trilha personalizada",
    description:
      "Lições, vocabulário e gramática direcionados ao seu objetivo — carreira, tech, viagens e mais.",
    color: "bg-norte-blue-light text-norte-blue",
  },
  {
    icon: Brain,
    title: "Diagnóstico inteligente",
    description:
      "Descubra seu nível real com avaliação adaptativa, incluindo questões de fala por áudio.",
    color: "bg-emerald-50 text-norte-green",
  },
  {
    icon: MessageCircle,
    title: "Professor IA 24/7",
    description:
      "Converse em inglês por texto ou voz. Correções em tempo real e feedback personalizado.",
    color: "bg-amber-50 text-norte-yellow",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  function finishWelcome(tab: "login" | "register") {
    localStorage.setItem(WELCOME_KEY, "1");
    router.push(`/auth?tab=${tab}`);
  }

  if (step === 0) {
    return (
      <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden bg-norte-ink">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Image
            src="/icons/norte-icon-192.png"
            alt="Norte"
            width={80}
            height={80}
            className="rounded-2xl mb-6"
            priority
          />
          <h1 className="text-3xl font-bold text-white tracking-tight">Norte</h1>
          <p className="text-slate-400 mt-1 text-sm">inglês com IA</p>
        </div>

        <div className="px-6 pb-10 pt-4 space-y-4">
          <h2 className="text-2xl font-bold text-white text-center leading-snug">
            Seu inglês, com um norte claro.
          </h2>
          <Button
            className="w-full bg-norte-blue hover:bg-norte-blue/90 h-13 text-base"
            onClick={() => setStep(1)}
          >
            Começar agora
          </Button>
          <p className="text-center text-sm text-slate-400">
            Já tenho conta ·{" "}
            <button
              onClick={() => finishWelcome("login")}
              className="text-white font-medium hover:underline"
            >
              Entrar
            </button>
          </p>
          <Link
            href="/install"
            className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors pt-1"
          >
            <Smartphone className="h-4 w-4" />
            Como instalar na tela inicial
          </Link>
        </div>
      </div>
    );
  }

  const slide = slides[step - 1];
  const Icon = slide.icon;
  const isLast = step === slides.length;

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden bg-norte-bg">
      <div className="flex justify-end p-4">
        <button
          onClick={() => finishWelcome("register")}
          className="text-sm text-slate-500 hover:text-norte-ink"
        >
          Pular
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div
          className={cn(
            "h-20 w-20 rounded-3xl flex items-center justify-center mb-8",
            slide.color
          )}
        >
          <Icon className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-norte-ink mb-3">{slide.title}</h2>
        <p className="text-slate-600 leading-relaxed max-w-xs">{slide.description}</p>
      </div>

      <div className="px-6 pb-10 space-y-6">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                step - 1 === i ? "w-6 bg-norte-blue" : "w-2 bg-slate-300"
              )}
            />
          ))}
        </div>

        <Button
          className="w-full h-12"
          onClick={() => (isLast ? finishWelcome("register") : setStep((s) => s + 1))}
        >
          {isLast ? "Criar minha conta" : "Continuar"}
          {!isLast && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
