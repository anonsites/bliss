"use client";
import { useEffect, useSyncExternalStore, useState } from "react";
import { RadarHeader } from "./RadarHeader";
import { RadarFeed } from "./RadarFeed";
import { RadarDetailPane } from "./RadarDetailPane";
import { useRadarFeed } from "./useRadarFeed";
import { AppPaneLayout } from "@/components/layout";
import { DownloadModal } from "@/components/ui/DownloadModal";
import {
  getOriginSnapshot,
  isIOSDevice,
  isMobileDevice,
  isStandaloneMode,
  PWA_INSTALL_DISABLED_KEY,
  PWA_INSTALL_DISMISSED_AT_KEY,
  PWA_INSTALLED_KEY,
  PWA_INSTALL_REMINDER_INTERVAL_MS,
  subscribeToBrowserSnapshot,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";
import styles from "./radar.module.css";
import type { HomeFeedProfile } from "@/features/discovery";

interface RadarPageClientProps {
  initialError: string | null;
  profiles: HomeFeedProfile[];
}

export function RadarPageClient({ initialError, profiles }: RadarPageClientProps) {
  const {
    mode,
    feedProfiles,
    feedError,
    isLoading,
    isFetchingMore,
    hasMore,
    searchCity,
    selectedProfileId,
    likedProfileIds,
    lastFetchTime,
    setSearchCity,
    setSelectedProfileId,
    loadFeed,
    handleLoadMore,
    handleModeChange,
    handleCitySearch,
    handleLikeToggle,
  } = useRadarFeed(profiles, initialError);

  const selectedProfile =
    feedProfiles.find((profile) => profile.id === selectedProfileId) ?? null;

  // PWA install prompt state (mirrors HomePageClient behavior)
  const origin = useSyncExternalStore(subscribeToBrowserSnapshot, getOriginSnapshot, () => "");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [neverShowInstallPrompt, setNeverShowInstallPrompt] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(PWA_INSTALL_DISABLED_KEY) === "1";
  });
  const [hasInstalledPwa, setHasInstalledPwa] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      isStandaloneMode() || window.localStorage.getItem(PWA_INSTALLED_KEY) === "1"
    );
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PWA_INSTALLED_KEY, "1");
        window.localStorage.removeItem(PWA_INSTALL_DISMISSED_AT_KEY);
      }

      setHasInstalledPwa(true);
      setDeferredInstallPrompt(null);
      setShowDownloadModal(false);
      setIsInstalling(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissInstallPrompt = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PWA_INSTALL_DISMISSED_AT_KEY, String(Date.now()));
    }

    setShowDownloadModal(false);
    setIsInstalling(false);
  };

  const handleInstallPromptPreferenceChange = (checked: boolean) => {
    setNeverShowInstallPrompt(checked);

    if (typeof window === "undefined") {
      return;
    }

    if (checked) {
      window.localStorage.setItem(PWA_INSTALL_DISABLED_KEY, "1");
    } else {
      window.localStorage.removeItem(PWA_INSTALL_DISABLED_KEY);
    }
  };

  const handlePwaInstall = async () => {
    if (!deferredInstallPrompt || isInstalling) {
      return;
    }

    try {
      setIsInstalling(true);
      await deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;

      setDeferredInstallPrompt(null);
      setShowDownloadModal(false);

      if (outcome !== "accepted" && typeof window !== "undefined") {
        window.localStorage.setItem(PWA_INSTALL_DISMISSED_AT_KEY, String(Date.now()));
      }
    } finally {
      setIsInstalling(false);
    }
  };

  useEffect(() => {
    if (
      showDownloadModal ||
      neverShowInstallPrompt ||
      hasInstalledPwa ||
      !isMobileDevice(typeof window !== "undefined" ? window.navigator.userAgent : "") ||
      isStandaloneMode()
    ) {
      return;
    }

    const isIOS = typeof window !== "undefined" && isIOSDevice(window.navigator.userAgent);
    const canShowInstallReminder = isIOS || deferredInstallPrompt !== null;

    if (!canShowInstallReminder) {
      return;
    }

    const lastDismissedAt = Number(
      (typeof window !== "undefined" && window.localStorage.getItem(PWA_INSTALL_DISMISSED_AT_KEY)) ?? 0,
    );
    const elapsed = lastDismissedAt === 0 ? PWA_INSTALL_REMINDER_INTERVAL_MS : Date.now() - lastDismissedAt;
    const delay = Math.max(PWA_INSTALL_REMINDER_INTERVAL_MS - elapsed, 0);

    const timeoutId = window.setTimeout(() => {
      setShowDownloadModal(true);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    deferredInstallPrompt,
    hasInstalledPwa,
    neverShowInstallPrompt,
    showDownloadModal,
  ]);

  const secondaryPane = (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <RadarHeader
        mode={mode}
        searchCity={searchCity}
        feedError={feedError}
        onModeChange={handleModeChange}
        onSearchChange={setSearchCity}
        onSearchSubmit={handleCitySearch}
      />

      <div className={styles.radarFeed}>
        <RadarFeed
          mode={mode}
          searchCity={searchCity}
          profiles={feedProfiles}
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          lastFetchTime={lastFetchTime}
          onProfileClick={setSelectedProfileId}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );

  const detailPane = (
    <RadarDetailPane
      mode={mode}
      profile={selectedProfile}
      isLiked={likedProfileIds.has(selectedProfile?.id ?? "")}
      onClose={() => setSelectedProfileId(null)}
      onLike={() => selectedProfile && handleLikeToggle(selectedProfile)}
    />
  );

  return (
    <>
      <AppPaneLayout
        secondary={secondaryPane}
        detail={detailPane}
        detailActive={Boolean(selectedProfile)}
        secondaryClassName="flex-1 min-h-0 min-w-0"
        detailClassName="flex-1 min-h-0 min-w-0"
      />

      {showDownloadModal ? (
        <DownloadModal
          isIOS={typeof window !== "undefined" && isIOSDevice(window.navigator.userAgent)}
          isInstalling={isInstalling}
          neverShowAgain={neverShowInstallPrompt}
          onClose={dismissInstallPrompt}
          onInstall={handlePwaInstall}
          onNeverShowAgainChange={handleInstallPromptPreferenceChange}
        />
      ) : null}
    </>
  );
}
