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
  | "nav.conversation"
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
  | "profile.notificationHistory"
  | "profile.notificationHistory.empty"
  | "profile.notificationHistory.failed"
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
    "nav.ai": "Conversa",
    "nav.conversation": "Conversa",
    "nav.vocab": "Vocabulário",
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
    "profile.notificationHistory": "Histórico de notificações",
    "profile.notificationHistory.empty": "Nenhuma notificação enviada ainda.",
    "profile.notificationHistory.failed": "Falhou",
    "profile.reminderTime": "Horário do lembrete",
    "profile.reminderAny": "Qualquer horário (padrão)",
    "profile.reminderAny.desc": "Lembretes automáticos às 7h, 13h, 17h, 20h e 22h (seu fuso), no máximo 5 por dia.",
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
    "nav.ai": "Conversation",
    "nav.conversation": "Conversation",
    "nav.vocab": "Vocabulary",
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
    "profile.notificationHistory": "Notification history",
    "profile.notificationHistory.empty": "No notifications sent yet.",
    "profile.notificationHistory.failed": "Failed",
    "profile.reminderTime": "Reminder time",
    "profile.reminderAny": "Any time (default)",
    "profile.reminderAny.desc": "Automatic reminders at 7 AM, 1 PM, 5 PM, 8 PM and 10 PM (your timezone), max 5 per day.",
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
