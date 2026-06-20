import type { DailyLesson } from "@/types";

export type LessonStepType = "listen" | "translate" | "word_pick" | "speak";

export interface WordPickBlank {
  index: number;
  correct: string;
  options: string[];
}

export interface LessonStep {
  id: string;
  type: LessonStepType;
  title: string;
  description: string;
  blanks?: WordPickBlank[];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function checkTranslation(userInput: string, expected: string): boolean {
  const a = normalize(userInput);
  const b = normalize(expected);
  if (!a) return false;
  if (a === b) return true;
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const wordsB = b.split(/\s+/).filter((w) => w.length > 2);
  const matched = wordsB.filter((w) => wordsA.has(w)).length;
  return matched / wordsB.length >= 0.6;
}

export function checkSpeechAttempt(transcript: string, phrase: string): boolean {
  const spoken = normalize(transcript).split(/\s+/).filter(Boolean);
  const target = normalize(phrase).split(/\s+/).filter((w) => w.length > 2);
  if (spoken.length < 2 || target.length === 0) return false;
  const matched = target.filter((w) => spoken.some((s) => s.includes(w) || w.includes(s))).length;
  return matched / target.length >= 0.45;
}

function buildWordPickBlanks(lesson: DailyLesson): WordPickBlank[] {
  const words = lesson.phrase.split(/\s+/);
  const vocabWords = lesson.vocabulary.map((v) => v.word.toLowerCase());
  const blanks: WordPickBlank[] = [];

  words.forEach((word, index) => {
    const clean = word.replace(/[^\w'-]/g, "");
    const isKey =
      vocabWords.some((v) => clean.toLowerCase().includes(v.split(" ")[0])) ||
      clean.length > 5;

    if (isKey && blanks.length < 3) {
      const distractors = lesson.vocabulary
        .map((v) => v.word.split(" ")[0])
        .filter((w) => w.toLowerCase() !== clean.toLowerCase())
        .slice(0, 2);
      const options = [clean, ...distractors].sort(() => Math.random() - 0.5);
      blanks.push({ index, correct: clean, options });
    }
  });

  if (blanks.length === 0 && words.length > 3) {
    const index = Math.floor(words.length / 2);
    const clean = words[index].replace(/[^\w'-]/g, "");
    blanks.push({
      index,
      correct: clean,
      options: [clean, words[0].replace(/[^\w'-]/g, ""), words.at(-1)!.replace(/[^\w'-]/g, "")],
    });
  }

  return blanks;
}

export function buildLessonSteps(lesson: DailyLesson): LessonStep[] {
  return [
    {
      id: "listen",
      type: "listen",
      title: "Ouça e leia",
      description: "Toque para ouvir a frase e leia o contexto com atenção.",
    },
    {
      id: "translate",
      type: "translate",
      title: "Traduza",
      description: "Escreva em português o que a frase significa.",
    },
    {
      id: "word_pick",
      type: "word_pick",
      title: "Complete a frase",
      description: "Selecione as palavras corretas para completar a frase em inglês.",
      blanks: buildWordPickBlanks(lesson),
    },
    {
      id: "speak",
      type: "speak",
      title: "Pratique a pronúncia",
      description: "Grave-se falando a frase em voz alta em inglês.",
    },
  ];
}

export const STEP_ORDER: LessonStepType[] = ["listen", "translate", "word_pick", "speak"];
