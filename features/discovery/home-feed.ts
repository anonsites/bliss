import "server-only";

import {
  formatApproximateDistance,
  formatElapsedCompact,
  formatRelativeActivity, 
  haversineDistanceKm,
  isValidCoordinate,
  type Coordinates,
  type ResolvedGeoContext,
} from "@/lib/geo";
import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";
import { isSupabaseConfigured, querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";
import {
  type HomeFeedLocation,
  type HomeFeedPayload,
  type HomeFeedPromoDrop,
  type HomeFeedProfile,
  deriveImages,
} from "@/features/discovery";
import { getGeoFromIP } from "@/services/geo";
import {
  type DropRow,
  calculateAge,
  isActiveDrop,
  isProfileMediaItem,
  normalizeMediaItem,
  parseDateValue,
} from "./utils";

type FeedRequest = {
  coordinates?: Coordinates | null;
  ip?: string | null;
  limit?: number;
};

type ProfileRow = {
  avatar_url: string | null;
  birthdate: string | null;
  created_at: string | null;
  id: string;
  is_profile_verified: boolean | null;
  updated_at: string | null;
  user_id: string;
  username: string | null;
};

type UserRow = {
  id: string;
  phone_number: string | null;
};

type UserMediaRow = {
  created_at: string | null;
  id: string;
  media_type: string | null;
  media_url: string | null;
  user_id: string;
};

type UserLocationRow = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;
  user_id: string;
};

type PromoDropRow = {
  created_at: string | null;
  id: string;
  media_type: string | null;
  media_url: string | null;
  owner_avatar_url: string | null;
  owner_name: string | null;
};

type DiscoveryCandidate = {
  drops: DropRow[];
  location: UserLocationRow | null;
  media: UserMediaRow[];
  profile: ProfileRow;
  user: UserRow | null;
};

const DEFAULT_FEED_LIMIT = 18;
const DISCOVERY_CANDIDATE_LIMIT = 48;

function emptyLocation(): HomeFeedLocation {
  return {
    city: null,
    country: null,
    region: null,
    source: "none",
  };
}

function clampLimit(limit: number | undefined) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_FEED_LIMIT;
  }

  return Math.min(Math.max(limit, 1), 32);
}

function buildInFilter(ids: string[]) {
  return `in.(${ids.join(",")})`;
}

function stableTiebreaker(id: string) {
  return Array.from(id).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % 1000;
  }, 7);
}

function buildViewerLocation(
  ipLocation: ResolvedGeoContext | null,
  coordinates?: Coordinates | null,
) {
  if (
    coordinates &&
    isValidCoordinate(coordinates.latitude) &&
    isValidCoordinate(coordinates.longitude)
  ) {
    return {
      city: null,
      country: null,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      region: null,
      source: "gps" as const,
    };
  }

  return ipLocation;
}

function toLocationMetadata(location: ResolvedGeoContext | null): HomeFeedLocation {
  if (!location) {
    return emptyLocation();
  }

  return {
    city: location.city,
    country: location.country,
    region: location.region,
    source: location.source,
  };
}

function locationLabelForCandidate(
  viewerLocation: ResolvedGeoContext | null,
  candidateLocation: UserLocationRow | null,
) {
  if (
    viewerLocation &&
    candidateLocation &&
    isValidCoordinate(candidateLocation.latitude) &&
    isValidCoordinate(candidateLocation.longitude)
  ) {
    const distanceKm = haversineDistanceKm(viewerLocation, {
      latitude: candidateLocation.latitude,
      longitude: candidateLocation.longitude,
    });

    return formatApproximateDistance(distanceKm, viewerLocation.source === "gps" ? "fine" : "coarse");
  }

  if (viewerLocation?.city) {
    return viewerLocation.source === "gps" ? "Nearby" : `Around ${viewerLocation.city}`;
  }

  if (viewerLocation?.region) {
    return viewerLocation.source === "gps" ? "Nearby" : viewerLocation.region;
  }

  return "Nearby";
}

function profileScore(candidate: DiscoveryCandidate, viewerLocation: ResolvedGeoContext | null) {
  const activeDropCount = candidate.drops.filter(isActiveDrop).length;
  const lastActiveAt = candidate.location?.updated_at ?? candidate.profile.updated_at ?? candidate.profile.created_at;
  const lastActiveTimestamp = parseDateValue(lastActiveAt);
  const hoursSinceActive = lastActiveTimestamp
    ? Math.max(0, (Date.now() - lastActiveTimestamp) / 3_600_000)
    : 999;
  const profileCompleteness =
    candidate.media.length * 8 +
    (candidate.profile.avatar_url ? 4 : 0) +
    (candidate.profile.is_profile_verified ? 3 : 0);

  let score = Math.max(0, 96 - hoursSinceActive) + profileCompleteness + activeDropCount * 10;

  if (
    viewerLocation &&
    candidate.location &&
    isValidCoordinate(candidate.location.latitude) &&
    isValidCoordinate(candidate.location.longitude)
  ) {
    const distanceKm = haversineDistanceKm(viewerLocation, {
      latitude: candidate.location.latitude,
      longitude: candidate.location.longitude,
    });

    score += Math.max(0, 250 - Math.min(distanceKm, 250));
  }

  return score + stableTiebreaker(candidate.profile.id) / 1000;
}

function mapCandidateToProfile(
  candidate: DiscoveryCandidate,
  viewerLocation: ResolvedGeoContext | null,
): HomeFeedProfile | null {
  const sortedMediaRows = [...candidate.media].sort(
    (left, right) => parseDateValue(left.created_at) - parseDateValue(right.created_at),
  );
  const media = sortedMediaRows
    .map((item) => normalizeMediaItem(item.id, item.media_url, item.created_at, item.media_type))
    .filter(isProfileMediaItem);

  const avatarMedia = normalizeMediaItem(
    `${candidate.profile.id}-avatar`,
    candidate.profile.avatar_url,
    candidate.profile.updated_at ?? candidate.profile.created_at,
    "image",
  );

  const profileMedia = media.length > 0 ? media : avatarMedia ? [avatarMedia] : [];
  const images = deriveImages(profileMedia);

  if (images.length === 0) {
    return null;
  }

  const activeDrops = candidate.drops
    .filter(isActiveDrop)
    .sort((left, right) => parseDateValue(left.created_at) - parseDateValue(right.created_at))
    .map((drop) =>
      normalizeMediaItem(drop.id, drop.media_url, drop.created_at, drop.media_type, drop.caption),
    )
    .filter(isProfileMediaItem);
  const dropImages = deriveImages(activeDrops);
  const latestDrop = [...activeDrops].sort(
    (left, right) => parseDateValue(right.createdAt) - parseDateValue(left.createdAt),
  )[0];
  const locationLabel = locationLabelForCandidate(viewerLocation, candidate.location);

  return {
    activityStatus: formatRelativeActivity(
      candidate.location?.updated_at ?? candidate.profile.updated_at ?? candidate.profile.created_at,
    ),
    age: calculateAge(candidate.profile.birthdate),
    distance: locationLabel,
    dropImages: dropImages.length > 0 ? dropImages : images.slice(0, 1),
    dropMedia: activeDrops,
    dropTime: latestDrop?.createdAt ? formatElapsedCompact(latestDrop.createdAt) : undefined,
    hasDrop: activeDrops.length > 0,
    id: candidate.profile.id,
    images,
    isVerified: Boolean(candidate.profile.is_profile_verified),
    locationLabel,
    media: profileMedia,
    username: candidate.profile.username?.trim() || "Bliss member",
    userId: candidate.profile.user_id,
    phoneNumber: candidate.user?.phone_number ?? undefined,
  };
}

function mapPromoDropForHome(row: PromoDropRow): HomeFeedPromoDrop | null {
  const media = normalizeMediaItem(row.id, row.media_url, row.created_at, row.media_type);
  const avatarUrl = resolveCloudinaryMediaUrl(row.owner_avatar_url, "image");

  if (!media || !avatarUrl) {
    return null;
  }

  return {
    avatarUrl,
    id: row.id,
    isVerified: true,
    mediaSrc: media.src,
    mediaType: media.type,
    posterSrc: media.thumbnailSrc ?? media.src,
    username: row.owner_name?.trim() || "Bliss creator",
  };
}

async function getPromoDropsPreview(limit = 8) {
  const rows = await querySupabaseRest<PromoDropRow[]>(
    "promo_drops",
    new URLSearchParams({
      is_published: "eq.true",
      limit: String(limit),
      order: "created_at.desc",
      select: "id,owner_name,owner_avatar_url,media_url,media_type,created_at",
    }),
  );

  return rows
    .map(mapPromoDropForHome)
    .filter((drop): drop is HomeFeedPromoDrop => Boolean(drop));
}

type PromoProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  media_url: string | null;
  media_type: string | null;
  gender: string;
  phone_number: string | null;
  is_verified: boolean | null;
};

function mapPromoProfileForHome(row: PromoProfileRow) {
  const mediaSrc = row.media_url ?? row.avatar_url ?? null;

  return {
    avatarUrl: row.avatar_url ? resolveCloudinaryMediaUrl(row.avatar_url, "image") ?? row.avatar_url : "",
    gender: row.gender,
    id: row.id,
    isVerified: Boolean(row.is_verified),
    mediaSrc: mediaSrc ? resolveCloudinaryMediaUrl(mediaSrc, (row.media_type as "image" | "video") ?? "image") ?? mediaSrc : null,
    mediaType: (row.media_type as "image" | "video") ?? "image",
    posterSrc: mediaSrc ?? row.avatar_url ?? null,
    username: row.username?.trim() || "Bliss creator",
    phoneNumber: row.phone_number ?? undefined,
  };
}

async function getPromoProfilesPreview(limit = 8) {
  const rows = await querySupabaseRest<PromoProfileRow[]>(
    "promo_profiles",
    new URLSearchParams({
      is_published: "eq.true",
      limit: String(limit),
      order: "created_at.desc",
      select: "id,username,avatar_url,media_url,media_type,gender,phone_number,is_verified",
    }),
  );

  return rows.map(mapPromoProfileForHome).filter(Boolean);
}

async function fetchDiscoveryCandidates(
  limit: number,
  viewerLocation: ResolvedGeoContext | null,
): Promise<DiscoveryCandidate[]> {
  let profiles: ProfileRow[];

  if (viewerLocation) {
    // If location is known, fetch candidates from nearby first. This is much more efficient.
    profiles = await requestSupabaseRest<ProfileRow[]>("rpc/get_home_feed_candidates", {
      body: {
        p_latitude: viewerLocation.latitude,
        p_longitude: viewerLocation.longitude,
        p_limit: limit,
      },
      method: "POST",
    });
  } else {
    // Fallback for when no IP/location is available: get most recently active users globally.
    const profileQuery = new URLSearchParams({
      is_active: "eq.true",
      limit: String(limit),
      order: "updated_at.desc.nullslast",
      select: "id,user_id,username,birthdate,avatar_url,is_profile_verified,created_at,updated_at",
    });
    profiles = await querySupabaseRest<ProfileRow[]>("profiles", profileQuery);
  }

  const userIds = Array.from(new Set(profiles.map((profile) => profile.user_id).filter(Boolean)));

  if (userIds.length === 0) {
    return [];
  }

  const sharedUserFilter = buildInFilter(userIds);

  const usersQuery = new URLSearchParams({
    id: sharedUserFilter,
    select: "id,phone_number",
  });

  const mediaQuery = new URLSearchParams({
    order: "created_at.asc",
    select: "id,user_id,media_url,media_type,created_at",
    user_id: sharedUserFilter,
  });

  const locationsQuery = new URLSearchParams({
    order: "updated_at.desc.nullslast",
    select: "id,user_id,latitude,longitude,updated_at",
    user_id: sharedUserFilter,
  });

  const dropsQuery = new URLSearchParams({
    order: "created_at.desc",
    select: "id,user_id,media_url,media_type,created_at,expires_at,caption",
    user_id: sharedUserFilter,
  });

  const [users, userMedia, userLocations, drops] = await Promise.all([
    querySupabaseRest<UserRow[]>("users", usersQuery),
    querySupabaseRest<UserMediaRow[]>("user_media", mediaQuery),
    querySupabaseRest<UserLocationRow[]>("user_locations", locationsQuery),
    querySupabaseRest<DropRow[]>("drops", dropsQuery),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const mediaMap = new Map<string, UserMediaRow[]>();
  const locationMap = new Map<string, UserLocationRow>();
  const dropMap = new Map<string, DropRow[]>();

  for (const item of userMedia) {
    const userEntries = mediaMap.get(item.user_id) ?? [];
    userEntries.push(item);
    mediaMap.set(item.user_id, userEntries);
  }

  for (const item of userLocations) {
    if (!locationMap.has(item.user_id)) {
      locationMap.set(item.user_id, item);
    }
  }

  for (const item of drops) {
    const userEntries = dropMap.get(item.user_id) ?? [];
    userEntries.push(item);
    dropMap.set(item.user_id, userEntries);
  }

  return profiles.map((profile) => ({
    drops: dropMap.get(profile.user_id) ?? [],
    location: locationMap.get(profile.user_id) ?? null,
    media: mediaMap.get(profile.user_id) ?? [],
    profile,
    user: userMap.get(profile.user_id) ?? null,
  }));
}

export async function getHomeFeedPreview({
  coordinates,
  ip,
  limit,
}: FeedRequest = {}): Promise<HomeFeedPayload> {
  const requestedLimit = clampLimit(limit);
  const fetchedAt = new Date().toISOString();
  const initialLocation =
    coordinates && isValidCoordinate(coordinates.latitude) && isValidCoordinate(coordinates.longitude)
      ? null
      : await getGeoFromIP(ip ?? null);
  const viewerLocation = buildViewerLocation(initialLocation, coordinates);

  if (!isSupabaseConfigured()) {
    return {
      meta: {
        error: "Supabase is not configured for the live home feed.",
        fetchedAt,
        location: toLocationMetadata(viewerLocation),
      },
      promoDrops: [],
      profiles: [],
    };
  }

  try {
    const [candidates, promoDropsRaw, promoProfiles] = await Promise.all([
      fetchDiscoveryCandidates(DISCOVERY_CANDIDATE_LIMIT, viewerLocation),
      getPromoDropsPreview(8),
      getPromoProfilesPreview(8),
    ]);
    const promoDrops = promoDropsRaw;
    const profiles = candidates
      .toSorted((left, right) => profileScore(right, viewerLocation) - profileScore(left, viewerLocation))
      .map((candidate) => mapCandidateToProfile(candidate, viewerLocation))
      .filter((profile): profile is HomeFeedProfile => Boolean(profile))
      .slice(0, requestedLimit);

    return {
      meta: {
        fetchedAt,
        location: toLocationMetadata(viewerLocation),
      },
      promoDrops,
      promoProfiles,
      profiles,
    };
  } catch {
    return {
      meta: {
        error: "The live home feed could not be loaded.",
        fetchedAt,
        location: toLocationMetadata(viewerLocation),
      },
      promoDrops: [],
      profiles: [],
    };
  }
}
