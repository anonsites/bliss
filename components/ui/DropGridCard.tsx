"use client";

import Image from "next/image";
import type { InsiderDrop } from "@/features/discovery";

interface DropGridCardProps {
  activeFilter?: "new" | "seen" | "live";
  drops: InsiderDrop[];
  onDropClick: (drop: InsiderDrop) => void;
  variant?: "preview" | "shell";
}

function chunkDrops(drops: InsiderDrop[], size: number) {
  const pages: InsiderDrop[][] = [];

  for (let index = 0; index < drops.length; index += size) {
    pages.push(drops.slice(index, index + size));
  }

  return pages;
}

function VideoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="grid-media-highlight__icon"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 6.5v11l8.5-5.5L8 6.5z" />
    </svg>
  );
}

function DropGridTile({
  drop,
  onClick,
  tileKey,
}: {
  drop: InsiderDrop;
  onClick: () => void;
  tileKey: string;
}) {
  const thumbnailSrc = drop.media.thumbnailSrc ?? drop.media.src;
  const ownerName = drop.ownerName ?? "New drop";

  return (
    <button
      type="button"
      className="drop-grid-card__tile"
      key={tileKey}
      onClick={onClick}
      style={{
        aspectRatio: "3 / 4",
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "block",
        padding: 0,
        position: "relative",
        textAlign: "left",
        width: "100%",
      }}
    >
      <div className="drop-grid-card__media">
        <Image
          src={thumbnailSrc}
          alt={`${ownerName} drop`}
          fill
          sizes="(max-width: 1023px) 50vw, 22vw"
        />
      </div>

      <div className="drop-grid-card__scrim" />

      {drop.media.type === "video" ? (
        <span className="grid-media-preview-badge" aria-label="Video drop">
          <VideoIcon />
        </span>
      ) : null}

      <div className="drop-grid-card__meta">
        <div className="drop-grid-card__identity">
          {drop.ownerAvatarUrl ? (
            <span
              style={{
                borderRadius: "50%",
                flexShrink: 0,
                height: 28,
                overflow: "hidden",
                position: "relative",
                width: 28,
              }}
            >
              <Image
                alt=""
                fill
                sizes="28px"
                src={drop.ownerAvatarUrl}
                style={{ objectFit: "cover" }}
              />
            </span>
          ) : null}
          <h3>{ownerName}</h3>
        </div>

        <p>{drop.timeLabel}</p>
      </div>
    </button>
  );
}

export function DropGridCard({
  activeFilter = "new",
  drops,
  onDropClick,
  variant = "preview",
}: DropGridCardProps) {
  const desktopPages = chunkDrops(drops, 4);
  const rootClassName =
    variant === "shell" ? "drop-grid-card drop-grid-card--shell" : "drop-grid-card";

  return (
    <section className={rootClassName}>
      {drops.length === 0 ? (
        <div className="drop-grid-card__empty">
          <h3>No drops</h3>
          <p>{activeFilter === "new" ? "No drops available right now." : "No seen drops yet."}</p>
        </div>
      ) : (
        <>
          <div className="drop-grid-card__desktop">
            {desktopPages.map((page, pageIndex) => (
              <div className="drop-grid-card__page" key={`page-${activeFilter}-${pageIndex}`}>
                {page.map((drop) => (
                  <DropGridTile
                    key={`desktop-${drop.id}`}
                    onClick={() => onDropClick(drop)}
                    drop={drop}
                    tileKey={`desktop-${drop.id}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="drop-grid-card__mobile">
            {drops.map((drop) => (
              <DropGridTile
                key={`mobile-${drop.id}`}
                onClick={() => onDropClick(drop)}
                drop={drop}
                tileKey={`mobile-${drop.id}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
