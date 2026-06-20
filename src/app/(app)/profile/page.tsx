"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import { GOAL_LABELS, type LearningGoal } from "@/types";
import { unsubscribeFromPush } from "@/lib/push/client";
import { enablePushNotifications } from "@/lib/pwa/enable-push";
import {
  NotificationPermissionHelp,
  useNotificationPermissionWatch,
} from "@/components/pwa/notification-permission-help";
import { Bell, BellOff, LogOut, ChevronRight } from "lucide-react";
import { REMINDER_ANY_HOUR } from "@/lib/constants/push";
import { cn } from "@/lib/utils/cn";

interface ProfileUser {
  name: string;
  email: string;
  goal?: LearningGoal;
  diagnosedLevel?: string;
  levelLabel?: string;
  progress: { streakDays: number; xp: number; lessonsCompleted: number };
  preferences: {
    language: "pt" | "en";
    practiceDaysPerWeek: number;
    practiceMinutesPerDay: number;
    notificationsEnabled: boolean;
    reminderHour: number;
    reminderMinute: number;
  };
  hasPushSubscription: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, setLanguage, setPreferences, preferences, refreshFromServer } = useLocale();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<LearningGoal>("tech_career");
  const [practiceDays, setPracticeDays] = useState(5);
  const [practiceMinutes, setPracticeMinutes] = useState(15);
  const [notifications, setNotifications] = useState(false);
  const [reminderHour, setReminderHour] = useState(REMINDER_ANY_HOUR);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [language, setLanguageLocal] = useState<"pt" | "en">("pt");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const { isDenied, refresh: refreshPermission } = useNotificationPermissionWatch();

  useEffect(() => {
    setPushSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const u = data.data.user as ProfileUser;
          setUser(u);
          setName(u.name);
          setGoal(u.goal ?? "tech_career");
          setPracticeDays(u.preferences.practiceDaysPerWeek);
          setPracticeMinutes(u.preferences.practiceMinutesPerDay);
          setNotifications(u.preferences.notificationsEnabled);
          setReminderHour(u.preferences.reminderHour);
          setReminderMinute(u.preferences.reminderMinute);
          setLanguageLocal(u.preferences.language);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const timezone =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "America/Sao_Paulo";

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        goal,
        preferences: {
          language,
          practiceDaysPerWeek: practiceDays,
          practiceMinutesPerDay: practiceMinutes,
          notificationsEnabled: notifications,
          reminderHour,
          reminderMinute,
          timezone,
        },
      }),
    });

    const data = await res.json();
    if (data.success) {
      setLanguage(language);
      setPreferences({
        language,
        practiceDaysPerWeek: practiceDays,
        practiceMinutesPerDay: practiceMinutes,
        notificationsEnabled: notifications,
        reminderHour,
        reminderMinute,
      });
      await refreshFromServer();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handleTogglePush() {
    setPushLoading(true);
    try {
      if (notifications) {
        await unsubscribeFromPush();
        setNotifications(false);
      } else {
        if (isDenied) {
          setShowPermissionHelp(true);
          return;
        }

        const result = await enablePushNotifications();
        setNotifications(result.success);
        refreshPermission();

        if (result.success) return;

        if (result.reason === "denied" || result.reason === "dismissed") {
          setShowPermissionHelp(true);
          return;
        }

        alert(
          language === "pt"
            ? "Não foi possível ativar. Instale o app na tela inicial ou tente mais tarde."
            : "Could not enable notifications. Install the app or try again later."
        );
      }
    } finally {
      setPushLoading(false);
    }
  }

  async function handleRetryPushFromHelp() {
    setPushLoading(true);
    try {
      const result = await enablePushNotifications();
      refreshPermission();
      if (result.success) {
        setNotifications(true);
        setShowPermissionHelp(false);
      }
    } finally {
      setPushLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <AppShell showHeader={false}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-norte-blue border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <AppShell showHeader={false}>
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6 space-y-6">
        {/* Header perfil */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-norte-blue flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {firstName[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-norte-ink">{t("profile.title")}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.levelLabel && (
              <Badge variant="level" className="mt-1">{user.levelLabel}</Badge>
            )}
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Streak", value: `${user?.progress.streakDays ?? 0}d` },
            { label: "XP", value: user?.progress.xp ?? 0 },
            { label: "Lições", value: user?.progress.lessonsCompleted ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-white border border-slate-100 p-3 text-center">
              <p className="text-lg font-bold text-norte-ink">{value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Conta */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {t("profile.account")}
          </h2>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-4">
            <Input
              id="name"
              label={t("profile.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-norte-ink mb-1.5">
                {t("profile.email")}
              </label>
              <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
                {user?.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-norte-ink mb-2">
                {t("profile.goal")}
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(Object.keys(GOAL_LABELS) as LearningGoal[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all",
                      goal === g
                        ? "bg-norte-blue-light text-norte-blue font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {GOAL_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Personalização */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {t("profile.preferences")}
          </h2>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-5">
            {/* Idioma */}
            <div>
              <label className="block text-sm font-medium text-norte-ink mb-2">
                {t("profile.language")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["pt", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguageLocal(lang)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium border transition-all",
                      language === lang
                        ? "border-norte-blue bg-norte-blue-light text-norte-blue"
                        : "border-slate-200 text-slate-600"
                    )}
                  >
                    {t(lang === "pt" ? "profile.language.pt" : "profile.language.en")}
                  </button>
                ))}
              </div>
            </div>

            {/* Dias por semana */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-norte-ink">
                  {t("profile.practiceDays")}
                </label>
                <span className="text-sm font-bold text-norte-blue">
                  {practiceDays} {t("profile.daysPerWeek")}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                value={practiceDays}
                onChange={(e) => setPracticeDays(Number(e.target.value))}
                className="w-full accent-norte-blue"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1</span><span>7</span>
              </div>
            </div>

            {/* Minutos por dia */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-norte-ink">
                  {t("profile.practiceMinutes")}
                </label>
                <span className="text-sm font-bold text-norte-blue">
                  {practiceMinutes} {t("profile.minutesPerDay")}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={practiceMinutes}
                onChange={(e) => setPracticeMinutes(Number(e.target.value))}
                className="w-full accent-norte-blue"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5 min</span><span>60 min</span>
              </div>
            </div>

            {/* Notificações push */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    notifications ? "bg-norte-blue-light text-norte-blue" : "bg-slate-100 text-slate-400"
                  )}>
                    {notifications ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-norte-ink">{t("profile.notifications")}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t("profile.notifications.desc")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!pushSupported || pushLoading}
                  onClick={handleTogglePush}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition-colors shrink-0 mt-1",
                    notifications ? "bg-norte-blue" : "bg-slate-200",
                    !pushSupported && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                      notifications ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {notifications && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-norte-ink mb-2">
                    {t("profile.reminderTime")}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={reminderHour}
                      onChange={(e) => setReminderHour(Number(e.target.value))}
                      className="flex-1 h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white"
                    >
                      <option value={REMINDER_ANY_HOUR}>{t("profile.reminderAny")}</option>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  {reminderHour === REMINDER_ANY_HOUR && (
                    <p className="text-xs text-slate-500 mt-2">{t("profile.reminderAny.desc")}</p>
                  )}
                </div>
              )}

              {!pushSupported && (
                <p className="text-xs text-amber-600 mt-2">
                  {language === "pt"
                    ? "Notificações push disponíveis apenas no app instalado (PWA) ou Chrome."
                    : "Push notifications only available in installed PWA or Chrome."}
                </p>
              )}

              {pushSupported && isDenied && !notifications && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {language === "pt"
                      ? "Você bloqueou notificações. O navegador não pergunta de novo — libere manualmente nas configurações."
                      : "Notifications are blocked. Enable them manually in your device settings."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPermissionHelp(true)}
                    className="text-xs font-semibold text-amber-800 underline underline-offset-2"
                  >
                    {language === "pt" ? "Ver passo a passo" : "See how to enable"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Atalhos */}
        <div className="space-y-2">
          <Link href="/install">
            <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 p-4 active:scale-[0.99] transition-transform">
              <span className="text-sm font-medium text-norte-ink">Instalar app na tela inicial</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
          <Link href="/trilha">
            <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 p-4 active:scale-[0.99] transition-transform">
              <span className="text-sm font-medium text-norte-ink">Ver minha trilha</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        </div>

        {saved && (
          <div className="rounded-xl bg-emerald-50 border border-norte-green/20 p-3 text-center text-sm text-norte-green font-medium">
            ✓ {t("profile.saved")}
          </div>
        )}

        <Button className="w-full" loading={saving} onClick={handleSave}>
          {t("profile.save")}
        </Button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("profile.logout")}
        </button>
      </div>

      <NotificationPermissionHelp
        open={showPermissionHelp}
        onClose={() => setShowPermissionHelp(false)}
        onRetry={handleRetryPushFromHelp}
        retryLoading={pushLoading}
        language={language}
      />
    </AppShell>
  );
}
