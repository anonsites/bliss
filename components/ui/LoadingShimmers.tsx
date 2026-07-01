import React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Basic building block for loading states.
 * Applies the shimmer animation and background styles.
 */
export function Skeleton({ className = "", style, ...props }: SkeletonProps) {
  return (
    <div
      className={`shimmer ${className}`}
      style={style}
      {...props}
    />
  );
}

/**
 * Skeleton for grid tiles (Radar/Drops grid view).
 */
export function GridTileSkeleton() {
  return (
    <article
      className="profile-grid-card__tile shimmer"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <div className="profile-grid-card__meta">
        <Skeleton
          style={{
            width: "60%",
            height: "18px",
            marginBottom: "6px",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.1)",
          }}
        />
        <Skeleton
          style={{
            width: "40%",
            height: "14px",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.1)",
          }}
        />
      </div>
    </article>
  );
}

/**
 * Full Grid Page Skeleton (renders multiple tiles).
 * Use this when loading the entire Radar or Drops grid.
 */
export function GridSkeletonPage() {
  return (
    <div className="profile-grid-card__page">
      {Array.from({ length: 8 }).map((_, i) => (
        <GridTileSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for list items (Messages, Notifications).
 */
export function ListItemSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px",
        gap: "16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Skeleton
        style={{ width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0 }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <Skeleton style={{ width: "30%", height: "16px", borderRadius: "4px" }} />
        <Skeleton style={{ width: "50%", height: "14px", borderRadius: "4px" }} />
      </div>
    </div>
  );
}
