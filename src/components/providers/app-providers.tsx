"use client";

import { LocaleProvider } from "@/lib/i18n/locale-provider";
import type { AppLanguage } from "@/lib/i18n/translations";

export function AppProviders({
  children,
  initialLanguage = "pt",
}: {
  children: React.ReactNode;
  initialLanguage?: AppLanguage;
}) {
  return <LocaleProvider initialLanguage={initialLanguage}>{children}</LocaleProvider>;
}
