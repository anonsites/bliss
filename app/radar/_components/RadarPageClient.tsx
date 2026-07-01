"use client";
import { RadarHeader } from "./RadarHeader";
import { RadarFeed } from "./RadarFeed";
import { RadarDetailPane } from "./RadarDetailPane";
import { useRadarFeed } from "./useRadarFeed";
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
    <>
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
    </>
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
    <div className="flex min-h-[calc(100dvh-92px-env(safe-area-inset-bottom))] w-full lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[1fr_360px] gap-0">
      {/* Secondary Pane: Profile Grid - Full width on mobile, left side on desktop */}
      <section className="flex flex-col min-h-0 min-w-0 flex-1 lg:flex-none lg:border-r lg:border-white/8 lg:bg-[linear-gradient(180deg,rgba(14,17,24,0.94),rgba(8,10,14,0.98))] overflow-hidden">
        {secondaryPane}
      </section>

      {/* Detail Pane: Profile View - Hidden on mobile, side column on desktop */}
      <section className="hidden lg:flex h-full flex-col min-h-0 min-w-0 bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(5,7,10,1))] overflow-hidden">
        {detailPane}
      </section>

      {/* Mobile Detail Pane: Full-screen overlay on mobile when profile selected */}
      {selectedProfile && (
        <div className="fixed lg:hidden inset-0 z-50 flex flex-col min-h-0 min-w-0 bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(5,7,10,1))] overflow-hidden">
          {detailPane}
        </div>
      )}
    </div>
  );
}
