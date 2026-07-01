"use client";
import { RadarHeader } from "./RadarHeader";
import { RadarFeed } from "./RadarFeed";
import { RadarDetailPane } from "./RadarDetailPane";
import { useRadarFeed } from "./useRadarFeed";
import { AppPaneLayout } from "@/components/layout";
import styles from "./radar.module.css";
import type { HomeFeedProfile } from "@/features/discovery";

interface RadarPageClientProps {
  initialError: string | null;
  profiles: HomeFeedProfile[];
}

export function RadarPageClient({ initialError, profiles }: RadarPageClientProps) {
  const {
    mode,
    feedProfiles,
    feedError,
    isLoading,
    isFetchingMore,
    hasMore,
    searchCity,
    selectedProfileId,
    likedProfileIds,
    lastFetchTime,
    setSearchCity,
    setSelectedProfileId,
    loadFeed,
    handleLoadMore,
    handleModeChange,
    handleCitySearch,
    handleLikeToggle,
  } = useRadarFeed(profiles, initialError);

  const selectedProfile =
    feedProfiles.find((profile) => profile.id === selectedProfileId) ?? null;

  const secondaryPane = (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <RadarHeader
        mode={mode}
        searchCity={searchCity}
        feedError={feedError}
        onModeChange={handleModeChange}
        onSearchChange={setSearchCity}
        onSearchSubmit={handleCitySearch}
      />

      <div className={styles.radarFeed}>
        <RadarFeed
          mode={mode}
          searchCity={searchCity}
          profiles={feedProfiles}
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          lastFetchTime={lastFetchTime}
          onProfileClick={setSelectedProfileId}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );

  const detailPane = (
    <RadarDetailPane
      mode={mode}
      profile={selectedProfile}
      isLiked={likedProfileIds.has(selectedProfile?.id ?? "")}
      onClose={() => setSelectedProfileId(null)}
      onLike={() => selectedProfile && handleLikeToggle(selectedProfile)}
    />
  );

  return (
    <AppPaneLayout
      secondary={secondaryPane}
      detail={detailPane}
      detailActive={Boolean(selectedProfile)}
      secondaryClassName="flex-1 min-h-0 min-w-0"
      detailClassName="flex-1 min-h-0 min-w-0"
    />
  );
}
