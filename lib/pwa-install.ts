export const PWA_INSTALL_REMINDER_INTERVAL_MS = 5 * 60_000;
export const PWA_INSTALL_DISMISSED_AT_KEY = "bliss_pwa_install_dismissed_at";
export const PWA_INSTALL_DISABLED_KEY = "bliss_pwa_install_disabled";
export const PWA_INSTALLED_KEY = "bliss_pwa_installed";

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function subscribeToBrowserSnapshot() {
  return () => {};
}

export function getOriginSnapshot() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function isIOSDevice(userAgent: string) {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function isMobileDevice(userAgent: string) {
  return /iphone|ipad|ipod|android/i.test(userAgent);
}

export function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigator = window.navigator as NavigatorWithStandalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true
  );
}
