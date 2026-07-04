"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DetailPanePlaceholder,
  DropPlaceholderIcon,
} from "@/components/ui/PlaceholderIcons";
import { DropCard } from "@/components/ui/DropPlayer";
import { DropGridCard } from "@/components/ui/DropGridCard";
import type { InsiderDrop } from "@/features/discovery";
import styles from "./drops.module.css";

type DropFilter = "new" | "seen" | "live";

const DROPS_PROGRESS_STORAGE_KEY = "bliss:drops-progress";

function getStoredDropsProgress() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(DROPS_PROGRESS_STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as {
      activeFilter?: DropFilter;
      seenDropIds?: string[];
    };

    return {
      activeFilter: parsed.activeFilter === "seen" || parsed.activeFilter === "live" ? parsed.activeFilter : "new",
      seenDropIds: Array.isArray(parsed.seenDropIds) ? parsed.seenDropIds : [],
    };
  } catch {
    return null;
  }
}

function saveDropsProgress(activeFilter: DropFilter, seenDropIds: Iterable<string>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      DROPS_PROGRESS_STORAGE_KEY,
      JSON.stringify({
        activeFilter,
        seenDropIds: Array.from(seenDropIds),
      }),
    );
  } catch {
    // Ignore storage failures so the UI still works.
  }
}

// New component for the "Free live cams" card
function LiveCamsCard() {
  const externalLink = "https://beeglivesex.com"; // Placeholder external link
  return (
    <a
      href={externalLink}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.liveCamsCard} // Assuming a new CSS class for styling
    >
      <div className={styles.liveCamsCardContent}>
        <h2 className={styles.liveCamsCardTitle}>Free live cams</h2>
        <p className={styles.liveCamsCardDescription}>Explore live streams now!</p>
        {/* Optional: Add an icon or image */}
        <svg
          aria-hidden="true"
          fill="none"
          height="32"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="32"
          className={styles.liveCamsCardIcon}
        >
          <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14V10z" />
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
    </a>
  );
}

// New component for the "Become a model" card
{/*
  function BecomeAModelCard() {
  const externalLink = "https://example.com/apply-to-model"; // Placeholder external link
  return (
    <a
      href={externalLink}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.liveCamsCard}
    >
      <div className={styles.liveCamsCardContent}>
        <h2 className={styles.liveCamsCardTitle}>Become a model</h2>
        <p className={styles.liveCamsCardDescription}>Share your content and start earning!</p>
        <svg
          aria-hidden="true"
          fill="none"
          height="32"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="32"
          className={styles.liveCamsCardIcon}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    </a>
  );
}*/}

interface DropsPageClientProps {
  initialDrops: InsiderDrop[];
}

export function DropsPageClient({ initialDrops }: DropsPageClientProps) {
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DropFilter>("new");
  const [seenDropIds, setSeenDropIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const storedProgress = getStoredDropsProgress();

    if (!storedProgress) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveFilter(
        storedProgress.activeFilter === "seen" || storedProgress.activeFilter === "live"
          ? storedProgress.activeFilter
          : "new",
      );
      setSeenDropIds(new Set(storedProgress.seenDropIds));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Fetch persisted seen drops for authenticated users and merge with session state.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/drops/views");

        if (!res.ok) return;

        const data = await res.json().catch(() => null) as { seenDropIds?: string[] } | null;

        if (cancelled) return;

        const seen = Array.isArray(data?.seenDropIds) ? data!.seenDropIds : [];

        if (seen.length === 0) return;

        setSeenDropIds((current) => {
          const next = new Set(current);
          for (const id of seen) next.add(id);
          return next;
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveDropsProgress(activeFilter, seenDropIds);
  }, [activeFilter, seenDropIds]);

  const filteredDrops = useMemo(() => {
    if (activeFilter === "live") {
      return []; // No drops to filter for 'live' tab
    }
    return initialDrops.filter((drop) => // Only filter for 'new' and 'seen'
      activeFilter === "seen" ? seenDropIds.has(drop.id) : !seenDropIds.has(drop.id),
    );
  }, [activeFilter, initialDrops, seenDropIds]);

  const selectedDrop = initialDrops.find((drop) => drop.id === selectedDropId) ?? null;

  const handleDropClick = (drop: InsiderDrop) => {
    setSelectedDropId(drop.id);
    setSeenDropIds((current) => {
      const next = new Set(current);
      next.add(drop.id);
      return next;
    });

    // Persist seen state server-side for authenticated users (best-effort).
    fetch("/api/drops/views", {
      body: JSON.stringify({ dropId: drop.id, source: drop.source }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => {
      // View tracking should not block playback.
    });
  };

  const handleAutoAdvance = () => {
    if (initialDrops.length === 0) {
      return;
    }

    const currentIndex = selectedDrop
      ? initialDrops.findIndex((drop) => drop.id === selectedDrop.id)
      : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % initialDrops.length;
    const nextDrop = initialDrops[nextIndex];

    if (nextDrop) {
      handleDropClick(nextDrop);
    }
  };

  const detailPane = selectedDrop ? (
    <DropCard 
      drop={selectedDrop} 
      onAutoAdvance={handleAutoAdvance} 
      onClose={() => setSelectedDropId(null)}
    />
  ) : (
    <DetailPanePlaceholder
      description="Tap a drop to play it."
      icon={<DropPlaceholderIcon />}
      title="Select a drop to view"
      tone="emerald"
    />
  );

  const dropGridPane = (
    <>
      <header className={`${styles.dropsHeader} flex items-center justify-between`}>
        <h1 className={styles.dropsTitle}>Drops</h1>

        <div className={styles.headerFilters}>
          <button
            className={`${styles.headerFilter} ${activeFilter === "new" ? styles.headerFilterActive : ""}`}
            onClick={() => setActiveFilter("new")}
            type="button"
          >
            New
          </button>
          <button
            className={`${styles.headerFilter} ${activeFilter === "seen" ? styles.headerFilterActive : ""}`}
            onClick={() => setActiveFilter("seen")}
            type="button"
          >
            Seen
          </button>
          {/* Add 'live' button */}
          <button
            className={`${styles.headerFilter} ${activeFilter === "live" ? styles.headerFilterActive : ""}`}
            onClick={() => setActiveFilter("live")}
            type="button"
          >
            <span className={styles.liveDot} />
            Live
          </button>
        </div>
      </header>

      <div className={styles.dropsListViewport}>
        {filteredDrops.length > 0 ? (
          <DropGridCard
            activeFilter={activeFilter}
            drops={filteredDrops}
            onDropClick={handleDropClick}
            variant="shell"
          />
        ) : activeFilter === "live" ? (
          <div className={styles.liveCamsGrid}> {/* Assuming a new CSS class for grid layout */}
            <LiveCamsCard />
            {/* <BecomeAModelCard /> */}
          </div>
        ) : (
          <div className={styles.dropEmptyState}>
            <svg
              aria-hidden="true"
              fill="none"
              height="52"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              width="52"
            >
              <rect height="20" rx="3" width="14" x="5" y="2" />
              <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
            </svg>
            <h2 className="text-lg font-semibold text-white">Gotcha!</h2>
            <p className="mt-2 max-w-xs text-sm text-gray-400">
              No drops available at the moment.
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full min-w-0 gap-0 overflow-hidden lg:grid lg:grid-cols-[1fr_360px]">
      <section className="hidden min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/8 bg-[linear-gradient(180deg,rgba(14,17,24,0.94),rgba(8,10,14,0.98))] lg:flex">
        {dropGridPane}
      </section>

      <section className="flex h-[calc(100dvh_-_92px_-_env(safe-area-inset-bottom))] min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:hidden">
        {selectedDrop && activeFilter !== "live" ? detailPane : dropGridPane}
      </section>

      <section className="hidden min-h-0 min-w-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(5,7,10,1))] lg:flex">
        {selectedDrop && activeFilter !== "live" ? detailPane : null}
      </section>
    </div>
  );
}
