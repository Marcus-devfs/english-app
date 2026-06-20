import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Brain,
  MessageCircle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Avaliação inteligente",
    description: "Diagnóstico real do seu nível com quiz adaptativo e questão de fala por áudio.",
  },
  {
    icon: TrendingUp,
    title: "Trilha personalizada",
    description: "Lições, vocabulário e gramática direcionados ao seu objetivo — carreira, viagens, tech e mais.",
  },
  {
    icon: MessageCircle,
    title: "Professor IA 24/7",
    description: "Converse em inglês por texto ou voz. Correções em tempo real e feedback personalizado.",
  },
  {
    icon: Sparkles,
    title: "Gamificação",
    description: "XP, streaks, conquistas e progresso visual para manter você motivado todos os dias.",
  },
];

const steps = [
  "Cadastre-se gratuitamente",
  "Defina seu objetivo e faça a avaliação",
  "Receba seu diagnóstico de nível",
  "Comece sua trilha personalizada",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">EnglishPath</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Começar grátis</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Seu professor de inglês com IA
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight max-w-4xl mx-auto">
            Aprenda inglês com uma{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              trilha feita para você
            </span>
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Substitua escolas caras por um curso estruturado com IA. Avaliação de nível,
            lições diárias, quiz e conversação — tudo personalizado ao seu objetivo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Criar conta gratuita
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-10 md:p-16 text-white">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Como funciona?</h2>
                <p className="text-indigo-100 mb-8 leading-relaxed">
                  Em menos de 10 minutos você já sabe seu nível real e começa a aprender
                  com conteúdo direcionado ao seu objetivo.
                </p>
                <Link href="/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white text-indigo-700 hover:bg-indigo-50"
                  >
                    Começar agora
                  </Button>
                </Link>
              </div>
              <ul className="space-y-4">
                {steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-sm">
                      {i + 1}
                    </div>
                    <span className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <p>© 2026 EnglishPath — Aprenda inglês no seu ritmo, com IA.</p>
      </footer>
    </div>
  );
}
