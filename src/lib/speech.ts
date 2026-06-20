export interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

export type SpeechRecognitionFactory = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionFactory;
    webkitSpeechRecognition?: SpeechRecognitionFactory;
  }
}

export function getSpeechRecognition(): ISpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const Factory = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  return Factory ? new Factory() : null;
}
