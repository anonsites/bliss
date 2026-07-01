"use client";

import { useRef, useEffect } from "react";
import styles from "./radar.module.css";
import { LoadingCircle } from "@/components/ui/LoadingCircle";
import { LocationPlaceholderIcon } from "@/components/ui/PlaceholderIcons";
import { ProfileGridCard } from "@/components/ui/ProfileGridCard";
import { GridSkeletonPage } from "@/components/ui/LoadingShimmers";
import type { HomeFeedProfile } from "@/features/discovery";

type RadarMode = "nearby" | "explore";

interface RadarFeedProps {
  mode: RadarMode;
  searchCity?: string;
  profiles: HomeFeedProfile[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  lastFetchTime: number;
  onProfileClick: (profileId: string) => void;
  onLoadMore: () => void;
}

export function RadarFeed({
  mode,
  searchCity,
  profiles,
  isLoading,
  isFetchingMore,
  hasMore,
  lastFetchTime,
  onProfileClick,
  onLoadMore,
}: RadarFeedProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const timeSinceLastFetch = Date.now() - lastFetchTime;
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !isLoading &&
          !isFetchingMore &&
          timeSinceLastFetch > 500
        ) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isFetchingMore, lastFetchTime, onLoadMore]);

  if (isLoading) {
    return <GridSkeletonPage />;
  }

  if (profiles.length === 0) {
    const isInitialExplore = mode === "explore" && !searchCity?.trim();

    return (
      <div className={styles.radarEmptyState}>
        <div className={styles.radarEmptyStateIcon}>
          <LocationPlaceholderIcon />
        </div>
        <h2 className={styles.radarEmptyStateTitle}>
          {mode === "nearby" ? "No one nearby yet" : isInitialExplore ? "Search for a city" : "No profiles found"}
        </h2>
        <p className={styles.radarEmptyStateDescription}>
          {mode === "nearby"
            ? "Enable Explore to search a city or check back after more nearby members come online."
            : isInitialExplore ? "Enter a city name above to find members in that area." : "Try another city name to expand your search results."}
        </p>
      </div>
    );
  }

  return (
    <>
      <ProfileGridCard
        onProfileClick={(profile) => onProfileClick(profile.id)}
        profiles={profiles}
        variant="shell"
      />

      <div className="h-4 w-full" ref={observerTarget} />

      {isFetchingMore && (
        <div className={styles.radarLoadingIndicator}>
          <LoadingCircle className="h-6 w-6 text-cyan-500" />
        </div>
      )}
    </>
  );
}
