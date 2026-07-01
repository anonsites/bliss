"use client";

import Image from "next/image";
import { DropPlaceholderIcon } from "@/components/ui/PlaceholderIcons";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { resolveCloudinaryMediaUrl, resolveCloudinaryVideoPoster } from "@/lib/cloudinary";
import styles from "./home.module.css";

export type DropUser = {
  id: string;
  mediaType: "video" | "image";
  avatarUrl: string;
  posterSrc: string;
  mediaSrc: string;
  username: string;
  isVerified?: boolean;
};

export interface DropsLocation {
  city: string | null;
  region: string | null;
  country: string | null;
}

interface DropsPreviewProps {
  drops: DropUser[];
  location?: DropsLocation;
  onDropClick?: () => void;
}

export function DropsPreview({ drops, location, onDropClick }: DropsPreviewProps) {
  const getLocationName = () => {
    if (!location) return "Around You";
    return location.city || location.region || location.country || "Around You";
  };

  const locationName = getLocationName();

  return (
    <section className={styles['drops-preview']} aria-label="Drops Preview">
      <header className={styles['section-heading']}>
        <h2 className={styles['section-title']}>HOT DROPS</h2>
        <p className={styles['section-location']}>
          <span aria-hidden="true" className={styles['section-location__icon']}>
            <DropPlaceholderIcon />
          </span>
          <span>{locationName}</span>
        </p>
      </header>
      <div className={styles['drops-grid']}>
        {drops.map((drop) => {
          const resolvedMediaSrc = drop.mediaType === "video"
            ? resolveCloudinaryMediaUrl(drop.mediaSrc, "video") ?? drop.mediaSrc
            : resolveCloudinaryMediaUrl(drop.mediaSrc, "image") ?? drop.mediaSrc;
          const resolvedPosterSrc = resolveCloudinaryVideoPoster(drop.posterSrc)
            ?? resolveCloudinaryMediaUrl(drop.posterSrc, "image")
            ?? drop.posterSrc;
          const resolvedAvatarUrl = resolveCloudinaryMediaUrl(drop.avatarUrl, "image") ?? drop.avatarUrl;

          return (
            <article
              className={styles['drops-card']}
              key={drop.id}
              onClick={onDropClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDropClick?.();
                }
              }}
              role="button"
              tabIndex={0}
            >
              {drop.mediaType === "video" ? (
                <video
                  autoPlay
                  className={styles['drops-card__image']}
                  loop
                  muted
                  playsInline
                  poster={resolvedPosterSrc}
                  preload="metadata"
                >
                  <source src={resolvedMediaSrc} type="video/mp4" />
                </video>
              ) : (
                <Image
                  alt={drop.username}
                  className={styles['drops-card__image']}
                  fill
                  sizes="(min-width: 1280px) 11vw, (min-width: 1024px) 14vw, 44vw"
                  src={resolvedMediaSrc}
                />
              )}
              <div className={styles['drops-card__info']}>
                <div className={`${styles['drops-card__name']} flex items-center min-w-0 gap-1.5`}>
                  <div className={styles['drops-card__avatar']}>
                    <Image
                      alt=""
                      fill
                      sizes="24px"
                      src={resolvedAvatarUrl}
                    />
                  </div>
                  <span className="truncate flex-1">
                    {drop.username.charAt(0).toUpperCase() + drop.username.slice(1)}
                  </span>
                  {drop.isVerified && <VerifiedBadge className="flex-shrink-0 h-3.5 w-3.5" />}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
