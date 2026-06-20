const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export function getCurrentHourInTimezone(timezone = DEFAULT_TIMEZONE, date = new Date()): number {
  try {
    const hour = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(date);
    return parseInt(hour, 10);
  } catch {
    return date.getHours();
  }
}

export function getTodayInTimezone(timezone = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export function resolveUserTimezone(timezone?: string): string {
  if (!timezone) return DEFAULT_TIMEZONE;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}
