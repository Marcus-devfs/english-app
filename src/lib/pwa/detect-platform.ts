export type InstallPlatform = "ios" | "android" | "desktop" | "unknown";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "unknown";

  const ua = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Mobi|Android/i.test(ua)) return "android";
  return "desktop";
}

export function getPlatformLabel(platform: InstallPlatform): string {
  switch (platform) {
    case "ios":
      return "iPhone / iPad";
    case "android":
      return "Android";
    case "desktop":
      return "Computador";
    default:
      return "Seu dispositivo";
  }
}
