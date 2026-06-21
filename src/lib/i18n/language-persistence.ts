import type { AppLanguage } from "@/lib/i18n/translations";

export const LANGUAGE_STORAGE_KEY = "norte_language";
export const LANGUAGE_COOKIE = "norte_language";

export function parseAppLanguage(value?: string | null): AppLanguage {
  return value === "en" ? "en" : "pt";
}

export function persistAppLanguage(lang: AppLanguage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function readStoredAppLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "pt" || stored === "en" ? stored : null;
}
