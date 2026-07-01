"use client";

import { useRef } from "react";
import Image from "next/image";
import { DropPlaceholderIcon } from "@/components/ui/PlaceholderIcons";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
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
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const getLocationName = () => {
    if (!location) return "Around You";
    return location.city || location.region || location.country || "Around You";
  };

  const locationName = getLocationName();

  const handleCardMouseEnter = (dropId: string) => {
    const video = videoRefs.current.get(dropId);
    if (video) {
      video.play().catch(() => {
        // Silently fail if play is blocked
      });
    }
  };

  const handleCardMouseLeave = (dropId: string) => {
    const video = videoRefs.current.get(dropId);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

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
        {drops.map((drop) => (
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
            onMouseEnter={() => handleCardMouseEnter(drop.id)}
            onMouseLeave={() => handleCardMouseLeave(drop.id)}
            role="button"
            tabIndex={0}
          >
            {drop.mediaType === "video" ? (
              <video
                className={styles['drops-card__image']}
                loop
                muted
                playsInline
                poster={drop.posterSrc}
                preload="metadata"
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(drop.id, el);
                  }
                }}
              >
                <source src={drop.mediaSrc} type="video/mp4" />
              </video>
            ) : (
              <Image
                alt={drop.username}
                className={styles['drops-card__image']}
                fill
                sizes="(min-width: 1280px) 11vw, (min-width: 1024px) 14vw, 44vw"
                src={drop.mediaSrc}
              />
            )}
            <div className={styles['drops-card__info']}>
              <div className={`${styles['drops-card__name']} flex items-center min-w-0 gap-1.5`}>
                <div className={styles['drops-card__avatar']}>
                  <Image
                    alt=""
                    fill
                    sizes="24px"
                    src={drop.avatarUrl}
                  />
                </div>
                <span className="truncate flex-1">
                  {drop.username.charAt(0).toUpperCase() + drop.username.slice(1)}
                </span>
                {drop.isVerified && <VerifiedBadge className="flex-shrink-0 h-3.5 w-3.5" />}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
