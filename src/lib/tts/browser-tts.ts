const PREFERRED_VOICE_NAMES = [
  "Google US English",
  "Samantha",
  "Daniel",
  "Microsoft Zira",
  "Microsoft David",
  "Karen",
  "Moira",
  "Aaron",
  "Nicky",
];

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  for (const preferred of PREFERRED_VOICE_NAMES) {
    const match = voices.find(
      (v) => v.name.includes(preferred) && v.lang.toLowerCase().startsWith("en")
    );
    if (match) return match;
  }

  return (
    voices.find((v) => v.lang === "en-US" && !v.localService) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

export function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;

    const applyVoiceAndSpeak = () => {
      const voice = pickEnglishVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    };

    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      speechSynthesis.addEventListener("voiceschanged", applyVoiceAndSpeak, {
        once: true,
      });
    } else {
      applyVoiceAndSpeak();
    }
  });
}

export function stopBrowserTts() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}
