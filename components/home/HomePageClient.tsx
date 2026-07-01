"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getPrimaryMediaItem,
  getPrimaryMediaThumbnail,
  type HomeFeedPayload,
} from "@/features/discovery";
import { NearbyUsers } from "@/components/home/NearbyUsers";
import { DropsPreview } from "@/components/home/DropsPreview";
import { FALLBACK_NEARBY_USERS, FALLBACK_DROPS } from "@/lib/marketing-data";
import { Skeleton } from "@/components/ui/LoadingShimmers";
import { LoginModal } from "@/components/home/LoginModal";
import { RegisterModal } from "@/components/home/RegisterModal";
import { MobileTopNav } from "@/components/layout/MobileTopNav";
import { DesktopJoinQrCode } from "@/components/ui/DesktopJoinQrCode";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
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
import styles from "./home.module.css";
import uiStyles from "../ui/ui.module.css";

type AuthModal = "login" | "register" | null;

function parseCoordinates(position: GeolocationPosition) {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

function buildNearbyUsers(feed: HomeFeedPayload) {
  if (feed.profiles.length === 0) {
    return [];
  }

  return Array.from({ length: Math.min(8, feed.profiles.length) }, (_, index) => {
    const profile = feed.profiles[index % feed.profiles.length];
    const primaryMedia = getPrimaryMediaItem(profile);

    return {
      avatarUrl: profile.images?.[0] ?? getPrimaryMediaThumbnail(profile),
      distance: profile.locationLabel,
      id: `${profile.id}-${index}`,
      isVerified: profile.isVerified,
      mediaSrc: primaryMedia?.src ?? getPrimaryMediaThumbnail(profile),
      mediaType: primaryMedia?.type ?? "image",
      posterSrc: getPrimaryMediaThumbnail(profile),
      username: profile.username,
    };
  });
}

function buildDropsUsers(feed: HomeFeedPayload) {
  if (feed.promoDrops.length > 0) {
    return feed.promoDrops;
  }

  if (feed.profiles.length === 0) {
    return [];
  }

  const dropsProfiles = feed.profiles.filter((p) => p.dropMedia && p.dropMedia.length > 0);
  
  return Array.from({ length: Math.min(8, dropsProfiles.length) }, (_, index) => {
    const profile = dropsProfiles[index % dropsProfiles.length];
    const dropMedia = profile.dropMedia?.[0];

    return {
      avatarUrl: profile.images?.[0] ?? getPrimaryMediaThumbnail(profile),
      id: `${profile.id}-drop-${index}`,
      isVerified: profile.isVerified,
      mediaSrc: dropMedia?.src ?? getPrimaryMediaThumbnail(profile),
      mediaType: (dropMedia?.type as "video" | "image") ?? "image",
      posterSrc: getPrimaryMediaThumbnail(profile),
      username: profile.username,
    };
  });
}

function blendWithFallback<T extends { id: string }>(
  liveItems: T[],
  fallbackItems: T[],
  targetCount = 8,
) {
  if (liveItems.length >= targetCount) {
    return liveItems.slice(0, targetCount);
  }

  if (liveItems.length === 0) {
    return fallbackItems.slice(0, targetCount);
  }

  const items: T[] = [];
  const seenIds = new Set<string>();
  let liveIndex = 0;
  let fallbackIndex = 0;

  while (
    items.length < targetCount &&
    (liveIndex < liveItems.length || fallbackIndex < fallbackItems.length)
  ) {
    if (liveIndex < liveItems.length) {
      const item = liveItems[liveIndex++];

      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        items.push(item);
      }
    }

    if (items.length >= targetCount) {
      break;
    }

    if (fallbackIndex < fallbackItems.length) {
      const item = fallbackItems[fallbackIndex++];

      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        items.push(item);
      }
    }
  }

  return items;
}

function HomeSectionSkeleton({
  ariaLabel,
  gridClassName,
}: {
  ariaLabel: string;
  gridClassName: string;
}) {
  return (
    <section aria-label={ariaLabel} className={styles['section-skeleton']}>
      <header className={styles['section-heading']}>
        <Skeleton className={styles['section-title-skeleton']} />
        <Skeleton className={styles['section-location-skeleton']} />
      </header>
      <div className={gridClassName}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton className={styles['preview-card-skeleton']} key={`${ariaLabel}-${index}`} />
        ))}
      </div>
    </section>
  );
}

interface HomePageClientProps {
  initialFeed: HomeFeedPayload;
}

export function HomePageClient({ initialFeed }: HomePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feed, setFeed] = useState(initialFeed);
  const origin = useSyncExternalStore(subscribeToBrowserSnapshot, getOriginSnapshot, () => "");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
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

  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [isFeedContentEntering, setIsFeedContentEntering] = useState(false);
  const wasRefreshingLocationRef = useRef(false);
  const deferredFeed = useDeferredValue(feed);
  const activeAuthModal = (() => {
    const authParam = searchParams.get("auth");
    return authParam === "login" || authParam === "register" ? authParam : null;
  })();

  const buildHomeUrl = (authModal: AuthModal) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (authModal) {
      nextSearchParams.set("auth", authModal);
    } else {
      nextSearchParams.delete("auth");
    }

    const nextQuery = nextSearchParams.toString();
    return nextQuery ? `/?${nextQuery}` : "/";
  };

  const openAuthModal = (authModal: Exclude<AuthModal, null>) => {
    router.replace(buildHomeUrl(authModal), { scroll: false });
  };

  const closeAuthModal = () => {
    router.replace(buildHomeUrl(null), { scroll: false });
  };

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

  const refreshFeedWithCoordinates = useEffectEvent(
    async (coordinates: { latitude: number; longitude: number }) => {
      const searchParams = new URLSearchParams({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
      });

      try {
        setIsRefreshingLocation(true);

        const response = await fetch(`/api/home-feed?${searchParams.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const nextFeed = (await response.json()) as HomeFeedPayload;

        startTransition(() => {
          setFeed(nextFeed);
        });
      } catch {
        // Ignore preview refresh failures and keep the IP-based feed in place.
      } finally {
        setIsRefreshingLocation(false);
      }
    },
  );

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

  useEffect(() => {
    let isCancelled = false;

    async function maybeUpgradeFeedWithGps() {
      if (!("geolocation" in navigator)) {
        return;
      }

      if (!("permissions" in navigator) || typeof navigator.permissions.query !== "function") {
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });

        if (isCancelled || permissionStatus.state !== "granted") {
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isCancelled) {
              return;
            }

            void refreshFeedWithCoordinates(parseCoordinates(position));
          },
          () => {
            // Keep the server-rendered preview when geolocation fails.
          },
          { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
        );
      } catch {
        // Ignore permission API failures. The IP-based feed is still valid.
      }
    }

    void maybeUpgradeFeedWithGps();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isRefreshingLocation) {
      wasRefreshingLocationRef.current = true;
      return;
    }

    if (!wasRefreshingLocationRef.current) {
      return;
    }

    setIsFeedContentEntering(true);
    wasRefreshingLocationRef.current = false;

    const timeoutId = window.setTimeout(() => {
      setIsFeedContentEntering(false);
    }, 360);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isRefreshingLocation]);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIOS = isIOSDevice(userAgent);
    const canShowInstallReminder = isIOS || deferredInstallPrompt !== null;

    if (
      showDownloadModal ||
      activeAuthModal !== null ||
      neverShowInstallPrompt ||
      hasInstalledPwa ||
      !isMobileDevice(userAgent) ||
      isStandaloneMode() ||
      !canShowInstallReminder
    ) {
      return;
    }

    const lastDismissedAt = Number(
      window.localStorage.getItem(PWA_INSTALL_DISMISSED_AT_KEY) ?? 0,
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
    activeAuthModal,
    deferredInstallPrompt,
    hasInstalledPwa,
    neverShowInstallPrompt,
    showDownloadModal,
  ]);

  const nearbyUsers = buildNearbyUsers(deferredFeed);
  const dropUsers = buildDropsUsers(deferredFeed);
  const displayNearby = blendWithFallback(nearbyUsers, FALLBACK_NEARBY_USERS);
  const displayDrops = blendWithFallback(dropUsers, FALLBACK_DROPS);

  const isIOS = typeof window !== "undefined" && isIOSDevice(window.navigator.userAgent);

  return (
    <main className={styles['home-page']}>
      <MobileTopNav />
      <div className={styles['home-layout']}>
        <section className={styles['hero-content']}>
          <div className={styles['hero-stack']}>
            <div className={`${styles['hero-copy']} ${styles['hero-copy--compact']}`}>
              <h1 className="font-rosemary">BLISS</h1>
            </div>

            <div className={styles['hero-actions']}>
              <button
                className={`${uiStyles['home-button']} ${uiStyles['home-button--primary']}`}
                onClick={() => openAuthModal("register")}
                type="button"
              >
                Create Account
              </button>
              <button
                className={`${uiStyles['home-button']} ${uiStyles['home-button--primary']}`}
                onClick={() => openAuthModal("login")}
                type="button"
              >
                Log in
              </button>
            </div>

            <div className={styles['hero-auth-support']}>
              <GoogleSignInButton
                onClick={() => openAuthModal("register")}
              />
              <nav aria-label="Legal" className={styles['hero-legal-links']}>
                <Link href="/terms">Terms</Link>
                <span className={styles['hero-legal-links__separator']}>|</span>
                <Link href="/policy">Privacy</Link>
                <span className={styles['hero-legal-links__separator']}>|</span>
                <Link href="/safety">Safety</Link>
              </nav>
            </div>

            <aside className="desktop-join-card">
              <span className="desktop-join-card__eyebrow">Scan To Download</span>
              <div className="desktop-join-card__panel">
                <DesktopJoinQrCode link={origin} />
              </div>
              <p className="desktop-join-card__note">Get bliss on your phone.</p>
            </aside>
          </div>
        </section>

        <section className={styles['right-column']}>
          {isRefreshingLocation ? (
            <div className={styles['feed-loading']}>
              <HomeSectionSkeleton
                ariaLabel="Loading nearby users"
                gridClassName={styles['nearby-grid']}
              />
              <HomeSectionSkeleton
                ariaLabel="Loading drops preview"
                gridClassName={styles['drops-grid']}
              />
            </div>
          ) : (
            <div
              className={[
                styles['feed-content'],
                isFeedContentEntering ? styles['feed-content--enter'] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <NearbyUsers
                location={deferredFeed.meta.location}
                onUserClick={() => openAuthModal("register")}
                users={displayNearby}
              />

              <DropsPreview
                drops={displayDrops}
                location={deferredFeed.meta.location}
                onDropClick={() => openAuthModal("register")}
              />
            </div>
          )}
        </section>
      </div>

      {activeAuthModal === "register" ? (
        <RegisterModal
          onClose={closeAuthModal}
          onSwitchToLogin={() => openAuthModal("login")}
        />
      ) : null}

      {activeAuthModal === "login" ? (
        <LoginModal
          onClose={closeAuthModal}
          onSwitchToRegister={() => openAuthModal("register")}
        />
      ) : null}

      {showDownloadModal ? (
        <DownloadModal
          isIOS={isIOS}
          isInstalling={isInstalling}
          neverShowAgain={neverShowInstallPrompt}
          onClose={dismissInstallPrompt}
          onInstall={handlePwaInstall}
          onNeverShowAgainChange={handleInstallPromptPreferenceChange}
        />
      ) : null}
    </main>
  );
}
