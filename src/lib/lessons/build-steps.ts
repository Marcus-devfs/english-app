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

export interface StepCheckResult {
  passed: boolean;
  score: number;
  missing: string[];
  incorrect: string[];
  message: string;
}

const TRANSLATION_PASS_SCORE = 55;
const SPEECH_PASS_SCORE = 50;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function tokenize(text: string, minLen = 2): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length >= minLen);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function wordsMatch(spoken: string, target: string): boolean {
  if (spoken === target) return true;
  if (spoken.includes(target) || target.includes(spoken)) return true;
  const maxDist = Math.max(1, Math.floor(Math.min(spoken.length, target.length) * 0.35));
  return spoken.length > 2 && target.length > 2 && levenshtein(spoken, target) <= maxDist;
}

function findMatchingToken(tokens: string[], target: string): boolean {
  return tokens.some((t) => wordsMatch(t, target));
}

export function evaluateTranslation(userInput: string, expected: string): StepCheckResult {
  const expectedWords = tokenize(expected, 3);
  const userWords = tokenize(userInput, 2);

  if (!userInput.trim()) {
    return {
      passed: false,
      score: 0,
      missing: expectedWords.slice(0, 5),
      incorrect: [],
      message: "Escreva sua tradução antes de verificar.",
    };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const word of expectedWords) {
    if (findMatchingToken(userWords, word)) matched.push(word);
    else missing.push(word);
  }

  const score =
    expectedWords.length > 0
      ? Math.round((matched.length / expectedWords.length) * 100)
      : userInput.trim()
        ? 100
        : 0;
  const passed = score >= TRANSLATION_PASS_SCORE;

  const missingLabels = missing.slice(0, 5).map((w) => `Inclua a ideia de «${w}»`);

  if (passed) {
    return {
      passed: true,
      score,
      missing:
        score < 85
          ? missingLabels
          : [],
      incorrect: [],
      message:
        score >= 90
          ? "Ótima tradução! Você captou o sentido da frase."
          : "Bom trabalho! O sentido está correto — pode seguir.",
    };
  }

  return {
    passed: false,
    score,
    missing: missingLabels,
    incorrect: [],
    message: `Você está no caminho (${score}%). Não precisa ser idêntico, mas tente cobrir mais ideias da frase.`,
  };
}

export function evaluateSpeech(transcript: string, phrase: string): StepCheckResult {
  const targetWords = phrase
    .split(/\s+/)
    .map((w) => normalize(w.replace(/[^\w'-]/g, "")))
    .filter((w) => w.length > 1);
  const spoken = tokenize(transcript, 2);

  if (spoken.length < 2) {
    return {
      passed: false,
      score: 0,
      missing: targetWords.slice(0, 6),
      incorrect: [],
      message: "Grave uma frase mais completa em inglês e tente novamente.",
    };
  }

  const missed: string[] = [];
  for (const word of targetWords) {
    if (!findMatchingToken(spoken, word)) missed.push(word);
  }

  const score =
    targetWords.length > 0
      ? Math.round(((targetWords.length - missed.length) / targetWords.length) * 100)
      : 0;
  const passed = score >= SPEECH_PASS_SCORE;

  const missedLabels = missed.slice(0, 6).map((w) => `Fale «${w}» com mais clareza`);

  if (passed) {
    return {
      passed: true,
      score,
      missing: score < 80 ? missedLabels : [],
      incorrect: [],
      message:
        score >= 85
          ? "Muito bem! Sua pronúncia cobriu a frase."
          : "Boa tentativa! O essencial foi captado — seguindo.",
    };
  }

  return {
    passed: false,
    score,
    missing: missedLabels,
    incorrect: [],
    message: `${score}% das palavras foram reconhecidas. Não precisa ser perfeito — repita focando nas palavras abaixo.`,
  };
}

export function evaluateWordPick(
  picks: Record<number, string>,
  blanks: WordPickBlank[]
): StepCheckResult {
  const incorrect: string[] = [];

  for (const blank of blanks) {
    const picked = picks[blank.index]?.toLowerCase();
    const correct = blank.correct.toLowerCase();
    if (picked !== correct) {
      incorrect.push(
        picked
          ? `Lacuna «${blank.correct}»: você escolheu «${picks[blank.index]}»`
          : `Lacuna «${blank.correct}»: ainda não preenchida`
      );
    }
  }

  const score =
    blanks.length > 0
      ? Math.round(((blanks.length - incorrect.length) / blanks.length) * 100)
      : 100;
  const passed = incorrect.length === 0;

  return {
    passed,
    score,
    missing: [],
    incorrect,
    message: passed
      ? "Todas as palavras corretas!"
      : "Algumas lacunas precisam de ajuste — veja abaixo.",
  };
}

/** @deprecated Use evaluateTranslation */
export function checkTranslation(userInput: string, expected: string): boolean {
  return evaluateTranslation(userInput, expected).passed;
}

/** @deprecated Use evaluateSpeech */
export function checkSpeechAttempt(transcript: string, phrase: string): boolean {
  return evaluateSpeech(transcript, phrase).passed;
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

export interface StepHint {
  title: string;
  body: string;
  extra?: string;
}

export function getStepHint(
  lesson: DailyLesson,
  stepType: LessonStepType,
  step?: LessonStep
): StepHint {
  switch (stepType) {
    case "listen":
      return {
        title: "Como abordar esta etapa",
        body: lesson.context,
        extra: `Palavras-chave: ${lesson.vocabulary.map((v) => `${v.word} (${v.meaning})`).join(" · ")}. Ouça em velocidade reduzida e repita em voz baixa.`,
      };
    case "translate":
      return {
        title: "Dica para traduzir",
        body: `Pense no significado geral antes das palavras exatas. ${lesson.grammarTip}`,
        extra: `Comece por: "${lesson.translation.split(" ").slice(0, 4).join(" ")}..." — a tradução não precisa ser idêntica, mas deve transmitir o mesmo sentido.`,
      };
    case "word_pick": {
      const blanks = step?.blanks ?? [];
      const clues =
        blanks.length > 0
          ? blanks
              .map((b) => {
                const vocab = lesson.vocabulary.find((v) =>
                  b.correct.toLowerCase().includes(v.word.toLowerCase().split(" ")[0])
                );
                return vocab
                  ? `A lacuna "${b.correct}" significa ${vocab.meaning}`
                  : `A palavra correta tem ${b.correct.length} letras e aparece no vocabulário da lição`;
              })
              .join(". ")
          : "Use palavras que aparecem no vocabulário acima.";
      return {
        title: "Dica para completar",
        body: clues + ".",
        extra: `Frase completa para referência: "${lesson.phrase}"`,
      };
    }
    case "speak": {
      const words = lesson.phrase.split(/\s+/);
      const mid = Math.ceil(words.length / 2);
      const part1 = words.slice(0, mid).join(" ");
      const part2 = words.slice(mid).join(" ");
      return {
        title: "Dica de pronúncia",
        body: `Divida a frase em blocos e fale devagar: "${part1}" · "${part2}"`,
        extra: "Toque no alto-falante da frase principal para ouvir o ritmo nativo antes de gravar.",
      };
    }
  }
}
