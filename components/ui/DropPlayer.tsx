"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import uiStyles from "./ui.module.css";
import type { InsiderDrop } from "@/features/discovery";

const IMAGE_AUTOPLAY_MS = 30000;

interface DropCardProps {
  drop: InsiderDrop;
  onAutoAdvance: () => void;
  onClose: () => void;
}

function getDropOwnerName(drop: InsiderDrop) {
  const candidate = drop.ownerName?.trim();

  if (candidate) {
    return candidate;
  }

  return drop.source === "promo" ? "Bliss creator" : "New drop";
}

export function DropCard({ drop, onAutoAdvance, onClose }: DropCardProps) {
  const isVideo = drop.media.type === "video";
  const ownerName = getDropOwnerName(drop);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }

      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  useEffect(() => {
    if (isVideo) {
      return;
    }

    const timerId = window.setTimeout(onAutoAdvance, IMAGE_AUTOPLAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [drop.id, isVideo, onAutoAdvance]);

  useEffect(() => {
    if (!isVideo) {
      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onAutoAdvance();
    };
    const handleMuted = () => setIsMuted(video.muted);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("volumechange", handleMuted);

    setIsPlaying(!video.paused);
    setIsMuted(video.muted);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("volumechange", handleMuted);
    };
  }, [drop.id, isVideo, onAutoAdvance]);

  return (
    <article className={uiStyles["media-card"]}>
      <div className={uiStyles["media-card__media"]} style={{ position: "relative", width: "100%", height: "100%" }}>
        {isVideo ? (
          <>
            <video
              key={drop.id}
              ref={videoRef}
              src={drop.media.src}
              poster={drop.media.thumbnailSrc}
              className="h-full w-full object-cover"
              playsInline
              preload="metadata"
              onClick={togglePlayback}
              onEnded={onAutoAdvance}
            />
            <div className={uiStyles["media-card__controls"]}>
              <button
                type="button"
                className={uiStyles["media-card__control-button"]}
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l10-6.5-10-6.5Z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className={uiStyles["media-card__control-button"]}
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path d="m16 9 6 6" strokeLinecap="round" />
                    <path d="m22 9-6 6" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" strokeLinecap="round" />
                    <path d="M18.5 5.5a8.5 8.5 0 0 1 0 13" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          </>
        ) : (
          <Image
            src={drop.media.src}
            alt={`${ownerName} drop`}
            fill
            className="object-cover"
            sizes="(max-width: 960px) 100vw, 420px"
          />
        )}
      </div>
      {/* Removed scrim for DropCard as per design changes to media-card__top */}
      {/* <div className={uiStyles["media-card__scrim"]} /> */}

      <div className={uiStyles["media-card__top"]}>
        {drop.ownerAvatarUrl ? (
          <span className="avatar-trigger__ring" style={{ height: 48, width: 48 }}>
            <Image
              src={drop.ownerAvatarUrl}
              alt=""
              fill
              sizes="48px"
              style={{ objectFit: "cover" }}
            />
          </span>
        ) : null}
        <div className={uiStyles["media-card__profile"]}>
          <div className={uiStyles["media-card__identity-row"]}>
            <h2>{ownerName}</h2>
          </div>

          <div className={uiStyles["media-card__details"]}>
            <span>{drop.timeLabel}</span>
          </div>
        </div>
      </div>

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
