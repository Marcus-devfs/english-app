"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Library, Volume2 } from "lucide-react";

interface GrammarLesson {
  id: string;
  title: string;
  level: string;
  content: string;
  examples: string[];
  exercises: { prompt: string; answer: string }[];
}

interface VocabLesson {
  id: string;
  title: string;
  level: string;
  words: { word: string; meaning: string; example: string }[];
}

export default function VocabularyPage() {
  const [grammar, setGrammar] = useState<GrammarLesson[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabLesson[]>([]);
  const [activeTab, setActiveTab] = useState<"vocabulary" | "grammar">("vocabulary");
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setGrammar(data.data.grammarLessons);
          setVocabulary(data.data.vocabularyLessons);
        }
      });
  }, []);

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      speechSynthesis.speak(u);
    }
  }

  function toggleAnswer(id: string) {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estudo de idioma</h1>
          <p className="text-slate-600 mt-1">Vocabulário e gramática para o seu objetivo</p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {(["vocabulary", "grammar"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-norte-blue shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "vocabulary" ? (
                <Library className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
              {tab === "vocabulary" ? "Vocabulário" : "Gramática"}
            </button>
          ))}
        </div>

        {activeTab === "vocabulary" &&
          vocabulary.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{lesson.title}</CardTitle>
                  <Badge variant="level">{lesson.level}</Badge>
                </div>
                <div className="space-y-3">
                  {lesson.words.map(({ word, meaning, example }) => (
                    <div key={word} className="p-4 rounded-xl bg-slate-50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{word}</span>
                        <button
                          onClick={() => speak(word)}
                          className="text-norte-blue hover:text-norte-blue/80"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-slate-500 ml-auto">{meaning}</span>
                      </div>
                      <p className="text-sm text-slate-600 italic">&ldquo;{example}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

        {activeTab === "grammar" &&
          grammar.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{lesson.title}</CardTitle>
                  <Badge variant="level">{lesson.level}</Badge>
                </div>
                <p className="text-slate-700">{lesson.content}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Exemplos:</p>
                  {lesson.examples.map((ex) => (
                    <p key={ex} className="text-sm text-norte-blue bg-norte-blue-light px-3 py-2 rounded-lg">
                      {ex}
                    </p>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Exercícios:</p>
                  {lesson.exercises.map((ex, i) => {
                    const id = `${lesson.id}-${i}`;
                    return (
                      <div key={id} className="p-3 rounded-xl border border-slate-200">
                        <p className="text-sm text-slate-800">{ex.prompt}</p>
                        <button
                          onClick={() => toggleAnswer(id)}
                          className="text-xs text-norte-blue mt-2 hover:underline"
                        >
                          {revealedAnswers.has(id) ? ex.answer : "Ver resposta"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </AppShell>
  );
}
