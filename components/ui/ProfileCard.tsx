"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import uiStyles from "./ui.module.css";
import { GreenRing } from "../layout";
import type { HomeFeedProfile } from "@/features/discovery";
import { VerifiedBadge } from "./VerifiedBadge";

const playfulTexts = ["Gotcha!", "Damn!", "You got this!"];

interface ProfileCardProps {
  /** 
   * Generic label for location. 
   * Can be a city name (e.g. "New York") or a distance (e.g. "5km away") 
   */
  phoneNumber?: string;
  locationLabel: string;
  onAvatarClick?: () => void;
  onSayHi?: () => void;
  profile: HomeFeedProfile;
  /**
   * Action buttons to render at the bottom of the card.
   */
  children?: React.ReactNode;
}

export function ProfileCard({
  locationLabel,
  onAvatarClick,
  onSayHi,
  profile,
  phoneNumber,
  children,
}: ProfileCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [playfulTextIndex, setPlayfulTextIndex] = useState(0);
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Hide bottom nav on mobile when viewing profile card
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      document.body.classList.add("profile-card-viewing");
      return () => {
        document.body.classList.remove("profile-card-viewing");
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUserAvatar = async () => {
      try {
        const response = await fetch("/api/profile", { method: "GET" });

        if (!response.ok) {
          if (isMounted) {
            setCurrentUserAvatarUrl(null);
          }
          return;
        }

        const payload = (await response.json()) as { profile?: { avatarUrl?: string | null } };

        if (isMounted) {
          setCurrentUserAvatarUrl(payload.profile?.avatarUrl ?? null);
        }
      } catch {
        if (isMounted) {
          setCurrentUserAvatarUrl(null);
        }
      }
    };

    void loadCurrentUserAvatar();

    return () => {
      isMounted = false;
    };
  }, []);

  const previousProfileId = useRef(profile.userId);

  useEffect(() => {
    if (previousProfileId.current !== profile.userId) {
      previousProfileId.current = profile.userId;
      queueMicrotask(() => {
        setPlayfulTextIndex((previous) => (previous + 1) % playfulTexts.length);
      });
    }
  }, [profile.userId]);

  const isOnline = profile.activityStatus.trim().toLowerCase() === "online";
  const images = (profile.images?.length ?? 0) > 0 ? profile.images! : (profile.dropImages ?? []);
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[imageIndex] ?? images[0] : null;
  const avatarImage = hasImages ? images[0] : null;

  const totalSlides = hasImages ? images.length + 1 : 1; // +1 for the profile info slide

  const handleNext = () => {
    setImageIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setImageIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum distance to be considered a swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0) handleNext(); // Swipe Left -> Next
      else handlePrev(); // Swipe Right -> Prev
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasImages) return;
    
    const { clientX, currentTarget } = e;
    const { width, left } = currentTarget.getBoundingClientRect();
    const x = clientX - left;

    // Tap left (30% area) -> Previous Image
    if (x < width * 0.3) {
      handlePrev();
    } else {
      // Tap right/center -> Next Image or Profile Info
      handleNext();
    }
  };
  const isProfileInfoSlide = hasImages && imageIndex === images.length;
  const isMediaSlide = !isProfileInfoSlide;
  const shouldShowCounter = hasImages && !isProfileInfoSlide;

  const cleanWhatsAppNumber = phoneNumber ? phoneNumber.replace(/[^0-9]/g, "") : "";
  const whatsappLink = cleanWhatsAppNumber ? `https://wa.me/${cleanWhatsAppNumber}` : "";

  const ProfileInfoSlide = (
    <div className={`${uiStyles.profileInfoSlide} bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_45%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]`}>
      <div className={uiStyles.profileInfoContent}>
        <div className="flex flex-col items-center text-center">
          <div className={uiStyles.profileInfoAvatars}>
            <div className={`${uiStyles.profileInfoAvatar} ${uiStyles.profileInfoAvatarUser}`}>
              <div className={uiStyles.profileInfoAvatarOverlay} />
              {currentUserAvatarUrl ? (
                <Image
                  src={currentUserAvatarUrl}
                  alt="You"
                  fill
                  sizes="100px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className={uiStyles.profileInfoAvatarLabel}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-9 w-9"
                  >
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 1.79-7 4v2h14v-2c0-2.21-3.134-4-7-4z" />
                  </svg>
                </div>
              )}
            </div>

            {avatarImage ? (
              <div className={`${uiStyles.profileInfoAvatar} ${uiStyles.profileInfoAvatarProfile}`}>
                <div className={uiStyles.profileInfoAvatarOverlay} />
                <Image
                  src={avatarImage}
                  alt={profile.username}
                  fill
                  sizes="100px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <div className={`${uiStyles.profileInfoAvatar} ${uiStyles.profileInfoAvatarProfile}`}>
                <div className={uiStyles.profileInfoAvatarOverlay} />
                <div className={uiStyles.profileInfoAvatarLabel}>PROFILE</div>
              </div>
            )}
          </div>

          <p
            className="font-extrabold tracking-tight leading-none bg-linear-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm mb-8"
            style={{ fontSize: "4.75rem", lineHeight: 1, letterSpacing: "-0.045em" }}
          >
            {playfulTexts[playfulTextIndex]}
          </p>

          <div className="mt-10 flex w-full flex-col gap-3">
            {onSayHi ? (
              <button
                type="button"
                className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full bg-linear-to-r from-sky-500 to-indigo-500 px-5 py-5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all duration-300 hover:from-sky-400 hover:to-indigo-400 hover:scale-[1.02] active:scale-[0.98]"
                style={{ padding: "20px" }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSayHi();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 9h8M8 13h5" />
                </svg>
                <span>Say Hi</span>
              </button>
            ) : null}

            {phoneNumber ? (
              <div className="flex items-center justify-center gap-3 w-full">
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 px-5 py-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ padding: "20px" }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M17.472 14.382c-.297-.148-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.149-.198.297-.768.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.198-.298.298-.497.099-.198.05-.372-.025-.52-.074-.149-.672-1.612-.92-2.213-.242-.58-.487-.5-.672-.51-.173-.01-.372-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.015-1.04 2.479 0 1.463 1.064 2.875 1.213 3.074.148.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.007-1.413.248-.697.248-1.296.173-1.413-.074-.118-.273-.198-.57-.347z"/>
                      <path d="M20.52 3.48A10.374 10.374 0 0 0 12.033.5C6.22.5 1.57 5.147 1.57 10.958c0 1.93.504 3.807 1.462 5.459L.5 23.5l7.54-1.977a10.443 10.443 0 0 0 4.993 1.24h.007c5.813 0 10.462-4.647 10.462-10.46 0-2.796-1.092-5.417-3.01-7.427zM12.033 21.19a9.44 9.44 0 0 1-4.84-1.315l-.346-.206-4.484 1.176 1.2-4.383-.225-.357A9.344 9.344 0 0 1 2.69 10.958c0-5.123 4.171-9.294 9.343-9.294 2.497 0 4.84.973 6.614 2.742 1.776 1.77 2.749 4.112 2.749 6.606 0 5.122-4.171 9.293-9.343 9.293z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                ) : null}

                {cleanWhatsAppNumber ? (
                  <a
                    href={`tel:${cleanWhatsAppNumber}`}
                    className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-5 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ padding: "20px" }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.23a2 2 0 0 1 2.11-.45c.91.31 1.85.53 2.81.66A2 2 0 0 1 22 16.92Z" />
                    </svg>
                    <span>Call</span>
                  </a>
                ) : null}
              </div>
            ) : null}
            {/*
            <button
              type="button"
              className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/5 px-5 py-5 text-sm font-bold text-emerald-350 backdrop-blur-md transition-all duration-300 hover:bg-emerald-500/10 hover:border-emerald-400/30 hover:scale-[1.02] active:scale-[0.98]"
              style={{ padding: "20px" }}
              onClick={(event) => event.stopPropagation()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Add to wishlist</span>
            </button>
            */}
          </div>
        </div>
      </div>
    </div>
  );

  const avatar = (
    <button
      className="avatar-trigger"
      onClick={(e) => {
        e.stopPropagation();
        if (profile.hasDrop) onAvatarClick?.();
      }}
      type="button"
    >
      <span className="avatar-trigger__ring">
        {avatarImage ? (
          <Image
            src={avatarImage}
            alt={profile.username}
            fill
            sizes="56px"
          />
        ) : (
          <div className="bg-gray-700 h-full w-full" />
        )}
      </span>
    </button>
  );

  if (!hasImages) {
    return (
      <div className="flex flex-col h-full w-full gap-0">
        {/* Header outside frame */}
        <div className={`${uiStyles["media-card__top"]} shrink-0`} style={{ padding: '1rem', backgroundColor: '#111827' }}>
          {avatar}
          <div className={uiStyles["media-card__profile"]}>
            <div className={`${uiStyles["media-card__identity-row"]} flex items-center min-w-0`}>
              <h2 className="truncate flex-1">{profile.username}</h2>
              {profile.isVerified ? (
                <VerifiedBadge className="w-5 h-5" />
              ) : null}
            </div>
            <div className={uiStyles["media-card__details"]}>
              <span className={isOnline ? "activity-status activity-status--online" : "activity-status"}>
                {isOnline ? <span aria-hidden="true" className="activity-status__dot" /> : null}
                {profile.activityStatus}
              </span>
              <span aria-hidden="true" className={uiStyles["media-card__details-separator"]}>|</span>
              <span>{locationLabel}</span>
            </div>
          </div>
        </div>
        {/* Frame with media and profile info */}
        <div className={uiStyles["profile-card-frame"]}>
          <div className={uiStyles["profile-card-frame__border"]}>
            <div className={uiStyles["profile-card-frame__content"]}>
              <article 
                className={`${uiStyles["media-card"]} overflow-hidden shadow-2xl flex flex-col cursor-pointer`}
                onClick={handleTap}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}>
                <div className={`${uiStyles["media-card__media"]} overflow-hidden bg-gray-900 flex items-center justify-center`}>
                  <p className="text-gray-400">No media available</p>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-900">
                  {ProfileInfoSlide}
                </div>
              </article>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full gap-0">
      {/* Header outside frame */}
      <div className={`${uiStyles["media-card__top"]} shrink-0`} style={{ padding: '1rem', backgroundColor: '#111827' }}>
        {profile.hasDrop ? <GreenRing mode="fill">{avatar}</GreenRing> : avatar}
        <div className={uiStyles["media-card__profile"]}>
          <div className={`${uiStyles["media-card__identity-row"]} flex items-center min-w-0`}>
            <h2 className="truncate flex-1">{profile.username}</h2>
            {profile.isVerified ? (
              <VerifiedBadge className="w-5 h-5" />
            ) : null}
          </div>
          <div className={uiStyles["media-card__details"]}>
            <span className={isOnline ? "activity-status activity-status--online" : "activity-status"}>
              {isOnline ? <span aria-hidden="true" className="activity-status__dot" /> : null}
              {profile.activityStatus}
            </span>
            <span aria-hidden="true" className={uiStyles["media-card__details-separator"]}>|</span>
            <span>{locationLabel}</span>
          </div>
        </div>
      </div>
      {/* Frame with media only */}
      <div className={uiStyles["profile-card-frame"]}>
        <div className={uiStyles["profile-card-frame__border"]}>
          <div className={uiStyles["profile-card-frame__content"]}>
            <article 
              className={`${uiStyles["media-card"]} overflow-hidden shadow-2xl cursor-pointer`}
              onClick={handleTap}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}>
              {shouldShowCounter ? (
                <div className={uiStyles["media-card__counter"]}>
                  <span>{`${imageIndex + 1}/${totalSlides}`}</span>
                </div>
              ) : null}

              <div className={`${uiStyles["media-card__media"]} overflow-hidden bg-gray-900`}
                style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div key={imageIndex} className="h-full w-full animate-in fade-in duration-500">
                  {isMediaSlide && currentImage ? (
                    <Image
                      src={currentImage}
                      alt={profile.username}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 420px"
                      priority
                      style={{ objectFit: "contain", objectPosition: "center" }}
                    />
                  ) : (
                    isProfileInfoSlide ? ProfileInfoSlide : (
                      <div className="bg-gray-900 flex items-center justify-center w-full h-full">
                        <p className="text-gray-400">No media available</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
