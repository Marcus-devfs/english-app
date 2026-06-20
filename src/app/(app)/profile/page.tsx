"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { RangeSlider } from "@/components/ui/range-slider";
import { Badge } from "@/components/ui/badge";
import { GoalPickerSheet } from "@/components/profile/goal-picker-sheet";
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

interface NotificationLogItem {
  _id: string;
  title: string;
  body: string;
  status: "sent" | "failed";
  localDate: string;
  slotHour?: number;
  sentCountAfter: number;
  createdAt: string;
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
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogItem[]>([]);
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

    fetch("/api/notifications?limit=8")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setNotificationLogs(data.data.notifications);
        }
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

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      language === "pt"
        ? "Excluir sua conta permanentemente? Todos os dados serão removidos."
        : "Permanently delete your account? All data will be removed."
    );
    if (!confirmed) return;

    const res = await fetch("/api/account", { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      router.push("/welcome");
    } else {
      alert(data.error ?? "Erro ao excluir conta");
    }
  }

  if (loading) {
    return (
      <AppShell showHeader={false}>
        <Loading />
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
              <label className="block text-sm font-medium text-norte-ink mb-1.5">
                {t("profile.goal")}
              </label>
              <button
                type="button"
                onClick={() => setShowGoalPicker(true)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
              >
                <span className="text-sm text-norte-ink">{GOAL_LABELS[goal]}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
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
              <RangeSlider
                min={1}
                max={7}
                value={practiceDays}
                onChange={setPracticeDays}
                minLabel="1"
                maxLabel="7"
              />
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
              <RangeSlider
                min={5}
                max={60}
                step={5}
                value={practiceMinutes}
                onChange={setPracticeMinutes}
                minLabel="5 min"
                maxLabel="60 min"
              />
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
                    "relative flex h-7 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors mt-1",
                    notifications ? "bg-norte-blue" : "bg-slate-200",
                    !pushSupported && "opacity-50 cursor-not-allowed"
                  )}
                  aria-pressed={notifications}
                >
                  <span
                    className={cn(
                      "block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
                      notifications ? "translate-x-4" : "translate-x-0"
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

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-norte-ink mb-2">
                  {t("profile.notificationHistory")}
                </p>
                {notificationLogs.length === 0 ? (
                  <p className="text-xs text-slate-500">{t("profile.notificationHistory.empty")}</p>
                ) : (
                  <ul className="space-y-2">
                    {notificationLogs.map((log) => (
                      <li
                        key={log._id}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-norte-ink line-clamp-1">
                            {log.title}
                          </p>
                          {log.status === "failed" && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase text-red-500">
                              {t("profile.notificationHistory.failed")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{log.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(log.createdAt).toLocaleString(
                            language === "pt" ? "pt-BR" : "en-US",
                            { dateStyle: "short", timeStyle: "short" }
                          )}
                          {log.slotHour !== undefined && ` · ${String(log.slotHour).padStart(2, "0")}h`}
                          {` · #${log.sentCountAfter}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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

        <section className="border-t border-slate-100 pt-4 space-y-2">
          <p className="text-xs text-slate-500 text-center">
            <Link href="/privacidade" className="text-norte-blue hover:underline">
              Privacidade
            </Link>
            {" · "}
            <Link href="/termos" className="text-norte-blue hover:underline">
              Termos
            </Link>
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full py-2 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            {language === "pt" ? "Excluir minha conta" : "Delete my account"}
          </button>
        </section>
      </div>

      <NotificationPermissionHelp
        open={showPermissionHelp}
        onClose={() => setShowPermissionHelp(false)}
        onRetry={handleRetryPushFromHelp}
        retryLoading={pushLoading}
        language={language}
      />

      <GoalPickerSheet
        open={showGoalPicker}
        value={goal}
        onChange={setGoal}
        onClose={() => setShowGoalPicker(false)}
        title={t("profile.goal")}
      />
    </AppShell>
  );
}
