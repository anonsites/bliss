"use client";

import { useEffect } from "react";
import Image from "next/image";
import uiStyles from "./ui.module.css";
import type { InsiderDrop } from "@/features/discovery";

const IMAGE_AUTOPLAY_MS = 30000;

interface DropCardProps {
  drop: InsiderDrop;
  onAutoAdvance: () => void;
  onClose: () => void;
}

export function DropCard({ drop, onAutoAdvance, onClose }: DropCardProps) {
  const isVideo = drop.media.type === "video";

  useEffect(() => {
    if (isVideo) {
      return;
    }

    const timerId = window.setTimeout(onAutoAdvance, IMAGE_AUTOPLAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [drop.id, isVideo, onAutoAdvance]);

  return (
    <article className={uiStyles["media-card"]}>
      <div className={uiStyles["media-card__media"]} style={{ position: "relative", width: "100%", height: "100%" }}>
        {isVideo ? (
          <video
            key={drop.id}
            src={drop.media.src}
            poster={drop.media.thumbnailSrc}
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            onEnded={onAutoAdvance}
          />
        ) : (
          <Image
            src={drop.media.src}
            alt={drop.caption ?? "Insider drop"}
            fill
            className="object-cover"
            sizes="(max-width: 960px) 100vw, 420px"
          />
        )}
      </div>
      {/* Removed scrim for DropCard as per design changes to media-card__top */}
      {/* <div className={uiStyles["media-card__scrim"]} /> */}

      <div className={uiStyles["media-card__top"]}>
        <div className={uiStyles["media-card__profile"]}>
          <div className={uiStyles["media-card__identity-row"]}>
            <h2>New drop</h2>
          </div>

          <div className={uiStyles["media-card__details"]}>
            <span>{drop.timeLabel}</span>
          </div>
        </div>
      </div>

      {drop.caption ? (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-5 text-white">
          <p className="max-w-md text-sm font-medium leading-5 text-white drop-shadow">
            {drop.caption}
          </p>
        </div>
      ) : null}

      <div className="absolute bottom-5 right-5 z-30">
        <button
          onClick={onClose}
          className={uiStyles["action-button"]}
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </article>
  );
}
