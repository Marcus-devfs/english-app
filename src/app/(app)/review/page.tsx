"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, RotateCcw } from "lucide-react";

interface ReviewCard {
  id: string;
  word: string;
  meaning: string;
  example?: string;
}

export default function ReviewPage() {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCards, setTotalCards] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCards(data.data.cards);
          setTotalCards(data.data.totalCards);
          setDone(data.data.dueCount === 0);
        }
        setLoading(false);
      });
  }, []);

  async function submitReview(correct: boolean) {
    const card = cards[current];
    if (!card) return;

    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, correct, hard: !correct }),
    });

    if (current < cards.length - 1) {
      setCurrent((c) => c + 1);
      setShowAnswer(false);
    } else {
      setDone(true);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  }

  if (totalCards === 0) {
    return (
      <AppShell>
        <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6 text-center">
          <RotateCcw className="h-12 w-12 text-violet-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Revisão de vocabulário</h1>
          <p className="text-slate-600">
            Complete lições, quizzes e converse com a IA para criar cards de revisão.
          </p>
          <Link href="/lessons">
            <Button>Ir para lição</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (done) {
    return (
      <AppShell>
        <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">Revisão concluída! 🎉</h1>
          <p className="text-slate-600">Você revisou {cards.length} palavra(s) hoje.</p>
          <Link href="/dashboard">
            <Button className="w-full">Voltar ao dashboard</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const card = cards[current];

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6">
        <div>
          <p className="text-xs text-slate-500">
            Card {current + 1} de {cards.length} · {totalCards} no total
          </p>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Revisar vocabulário</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4 text-center min-h-[200px] flex flex-col justify-center">
            <p className="text-3xl font-bold text-norte-ink">{card.word}</p>
            {showAnswer ? (
              <>
                <p className="text-lg text-slate-600">{card.meaning}</p>
                {card.example && (
                  <p className="text-sm text-slate-400 italic">{card.example}</p>
                )}
              </>
            ) : (
              <Button variant="secondary" onClick={() => setShowAnswer(true)}>
                Mostrar resposta
              </Button>
            )}
          </CardContent>
        </Card>

        {showAnswer && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => submitReview(false)}
            >
              Preciso revisar
            </Button>
            <Button className="flex-1" onClick={() => submitReview(true)}>
              Lembrei!
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
