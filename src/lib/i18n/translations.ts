import { REMINDER_ANY_HOUR } from "@/lib/constants/push";

export type AppLanguage = "pt" | "en";

export interface UserPreferences {
  language: AppLanguage;
  practiceDaysPerWeek: number;
  practiceMinutesPerDay: number;
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  timezone: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: "pt",
  practiceDaysPerWeek: 5,
  practiceMinutesPerDay: 15,
  notificationsEnabled: false,
  reminderHour: REMINDER_ANY_HOUR,
  reminderMinute: 0,
  timezone: "America/Sao_Paulo",
};

export type TranslationKey =
  | "nav.home"
  | "nav.trail"
  | "nav.ai"
  | "nav.vocab"
  | "nav.profile"
  | "profile.title"
  | "profile.account"
  | "profile.name"
  | "profile.email"
  | "profile.goal"
  | "profile.level"
  | "profile.preferences"
  | "profile.language"
  | "profile.language.pt"
  | "profile.language.en"
  | "profile.practiceDays"
  | "profile.practiceMinutes"
  | "profile.notifications"
  | "profile.notifications.desc"
  | "profile.reminderTime"
  | "profile.reminderAny"
  | "profile.reminderAny.desc"
  | "profile.save"
  | "profile.saved"
  | "profile.logout"
  | "profile.daysPerWeek"
  | "profile.minutesPerDay"
  | "common.loading"
  | "common.save"
  | "common.cancel";

export const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  pt: {
    "nav.home": "Início",
    "nav.trail": "Trilha",
    "nav.ai": "IA",
    "nav.vocab": "Vocab",
    "nav.profile": "Perfil",
    "profile.title": "Meu perfil",
    "profile.account": "Conta",
    "profile.name": "Nome",
    "profile.email": "Email",
    "profile.goal": "Objetivo",
    "profile.level": "Nível diagnosticado",
    "profile.preferences": "Personalização",
    "profile.language": "Idioma do app",
    "profile.language.pt": "Português",
    "profile.language.en": "English",
    "profile.practiceDays": "Dias de prática por semana",
    "profile.practiceMinutes": "Minutos por dia",
    "profile.notifications": "Notificações push",
    "profile.notifications.desc": "Lembretes para manter sua streak e meta diária",
    "profile.reminderTime": "Horário do lembrete",
    "profile.reminderAny": "Qualquer horário (padrão)",
    "profile.reminderAny.desc": "Lembretes automáticos às 8h e entre 19h e 21h (seu fuso), no máximo 2 por dia.",
    "profile.save": "Salvar alterações",
    "profile.saved": "Perfil atualizado!",
    "profile.logout": "Sair da conta",
    "profile.daysPerWeek": "dias/semana",
    "profile.minutesPerDay": "min/dia",
    "common.loading": "Carregando...",
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
  },
  en: {
    "nav.home": "Home",
    "nav.trail": "Trail",
    "nav.ai": "AI",
    "nav.vocab": "Vocab",
    "nav.profile": "Profile",
    "profile.title": "My profile",
    "profile.account": "Account",
    "profile.name": "Name",
    "profile.email": "Email",
    "profile.goal": "Goal",
    "profile.level": "Diagnosed level",
    "profile.preferences": "Preferences",
    "profile.language": "App language",
    "profile.language.pt": "Português",
    "profile.language.en": "English",
    "profile.practiceDays": "Practice days per week",
    "profile.practiceMinutes": "Minutes per day",
    "profile.notifications": "Push notifications",
    "profile.notifications.desc": "Reminders to keep your streak and daily goal",
    "profile.reminderTime": "Reminder time",
    "profile.reminderAny": "Any time (default)",
    "profile.reminderAny.desc": "Automatic reminders at 8 AM and 7 PM (your timezone), max 2 per day.",
    "profile.save": "Save changes",
    "profile.saved": "Profile updated!",
    "profile.logout": "Sign out",
    "profile.daysPerWeek": "days/week",
    "profile.minutesPerDay": "min/day",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
  },
};

export function t(lang: AppLanguage, key: TranslationKey): string {
  return translations[lang][key] ?? key;
}
