import { useState, useCallback } from "react";
import type { HomeFeedProfile } from "@/features/discovery";

type RadarMode = "nearby" | "explore";

type RadarFeedResponse = {
  error?: string;
  profiles?: HomeFeedProfile[];
};

function getFeedEndpoint(mode: RadarMode) {
  return mode === "nearby" ? "/api/radar/nearby" : "/api/radar/explore";
}

function getLikedProfileIds(profiles: HomeFeedProfile[]) {
  return new Set(
    profiles.filter((profile) => profile.isWishlisted).map((profile) => profile.id)
  );
}

function toggleProfileId(previous: Set<string>, profileId: string) {
  const next = new Set(previous);
  if (next.has(profileId)) {
    next.delete(profileId);
    return next;
  }
  next.add(profileId);
  return next;
}

export function useRadarFeed(initialProfiles: HomeFeedProfile[], initialError: string | null) {
  const [mode, setMode] = useState<RadarMode>("nearby");
  const [feedProfiles, setFeedProfiles] = useState<HomeFeedProfile[]>(initialProfiles);
  const [feedError, setFeedError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [likedProfileIds, setLikedProfileIds] = useState<Set<string>>(() =>
    getLikedProfileIds(initialProfiles)
  );
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  const syncFeed = useCallback((payload: RadarFeedResponse, append = false) => {
    const nextProfiles = payload.profiles ?? [];

    setFeedProfiles((current) => {
      if (!append) {
        return nextProfiles;
      }

      const existingIds = new Set(current.map((p) => p.id));
      const newProfiles = nextProfiles.filter((p) => !existingIds.has(p.id));
      return [...current, ...newProfiles];
    });

    setFeedError(payload.error ?? null);
    setLikedProfileIds(getLikedProfileIds(nextProfiles));
    setHasMore(nextProfiles.length > 0);

    setSelectedProfileId((current) =>
      current && nextProfiles.some((profile) => profile.id === current) ? current : null
    );
  }, []);

  const loadFeed = useCallback(
    async (endpoint: string, append = false) => {
      if (append) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);
      }

      setFeedError(null);

      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
        });
        const payload = (await response.json()) as RadarFeedResponse;

        if (!response.ok) {
          if (!append) setFeedProfiles([]);
          setFeedError(payload.error ?? "Unable to load Radar right now.");
          if (!append) setSelectedProfileId(null);
          setHasMore(false);
          return;
        }

        syncFeed(payload, append);
        setLastFetchTime(Date.now());
      } catch {
        if (!append) setFeedProfiles([]);
        setFeedError("Unable to load Radar right now.");
        if (!append) setSelectedProfileId(null);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [syncFeed]
  );

  const handleLoadMore = useCallback(async () => {
    if (isLoading || isFetchingMore || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);

    let endpoint = getFeedEndpoint(mode);
    if (mode === "explore" && searchCity.trim()) {
      endpoint = `/api/radar/search?city=${encodeURIComponent(searchCity.trim())}`;
    }

    const connector = endpoint.includes("?") ? "&" : "?";
    await loadFeed(`${endpoint}${connector}page=${nextPage}`, true);
  }, [isLoading, isFetchingMore, hasMore, page, mode, searchCity, loadFeed]);

  const handleModeChange = useCallback(
    async (nextMode: RadarMode) => {
      if (nextMode === mode) {
        return;
      }

      setMode(nextMode);
      setSearchCity("");
      setSelectedProfileId(null);
      await loadFeed(getFeedEndpoint(nextMode));
    },
    [mode, loadFeed]
  );

  const handleCitySearch = useCallback(
    async (city: string) => {
      const normalizedCity = city.trim();

      if (!normalizedCity) {
        return;
      }

      setSelectedProfileId(null);
      await loadFeed(`/api/radar/search?city=${encodeURIComponent(normalizedCity)}`);
    },
    [loadFeed]
  );

  const handleLikeToggle = useCallback(async (profile: HomeFeedProfile) => {
    if (profile.isPromoProfile) {
      return;
    }

    const { id, userId } = profile;

    setLikedProfileIds((current) => toggleProfileId(current, id));

    try {
      const response = await fetch("/api/wishlist", {
        body: JSON.stringify({ targetUserId: userId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Wishlist update failed.");
      }
    } catch {
      setLikedProfileIds((current) => toggleProfileId(current, id));
    }
  }, []);

  return {
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
  };
}
