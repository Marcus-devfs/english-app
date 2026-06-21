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
import {
  parseAppLanguage,
  persistAppLanguage,
  readStoredAppLanguage,
} from "@/lib/i18n/language-persistence";

interface LocaleContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  refreshFromServer: () => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLanguage = "pt",
}: {
  children: React.ReactNode;
  initialLanguage?: AppLanguage;
}) {
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);
  const [preferences, setPreferencesState] = useState<UserPreferences>({
    ...DEFAULT_PREFERENCES,
    language: initialLanguage,
  });

  const applyLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    persistAppLanguage(lang);
    setPreferencesState((prev) => ({ ...prev, language: lang }));
  }, []);

  const refreshFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        const prefs = data.data.user.preferences as UserPreferences;
        setPreferencesState(prefs);
        applyLanguage(parseAppLanguage(prefs.language));
      }
    } catch {
      // ignore — user may not be logged in
    }
  }, [applyLanguage]);

  useEffect(() => {
    const stored = readStoredAppLanguage();
    if (stored && stored !== initialLanguage) {
      applyLanguage(stored);
    } else if (!stored) {
      persistAppLanguage(initialLanguage);
    }
    refreshFromServer();
  }, [applyLanguage, initialLanguage, refreshFromServer]);

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      applyLanguage(lang);
    },
    [applyLanguage]
  );

  const setPreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      setPreferencesState((prev) => ({ ...prev, ...partial }));
      if (partial.language) {
        applyLanguage(parseAppLanguage(partial.language));
      }
    },
    [applyLanguage]
  );

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
