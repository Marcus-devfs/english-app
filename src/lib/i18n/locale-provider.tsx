"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type AppLanguage,
  type TranslationKey,
  t as translate,
  DEFAULT_PREFERENCES,
  type UserPreferences,
} from "@/lib/i18n/translations";

interface LocaleContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  refreshFromServer: () => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "norte_language";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("pt");
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  const refreshFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        const prefs = data.data.user.preferences as UserPreferences;
        setPreferencesState(prefs);
        setLanguageState(prefs.language);
        localStorage.setItem(STORAGE_KEY, prefs.language);
      }
    } catch {
      // ignore — user may not be logged in
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (stored === "pt" || stored === "en") {
      setLanguageState(stored);
    }
    refreshFromServer();
  }, [refreshFromServer]);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setPreferencesState((prev) => ({ ...prev, language: lang }));
  }, []);

  const setPreferences = useCallback((partial: Partial<UserPreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...partial }));
    if (partial.language) {
      setLanguageState(partial.language);
      localStorage.setItem(STORAGE_KEY, partial.language);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language]
  );

  return (
    <LocaleContext.Provider
      value={{ language, setLanguage, t, preferences, setPreferences, refreshFromServer }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
