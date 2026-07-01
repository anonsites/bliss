import "server-only";

import { getLatestSessionActivity, resolveActivityReference } from "@/features/activity/server";
import {
  formatElapsedCompact,
  formatRelativeActivity,
} from "@/lib/geo";
import {
  type HomeFeedProfile,
  deriveImages,
} from "@/features/discovery";
import { isSupabaseConfigured, querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";
import { notifyUserNearby } from "@/features/notifications/triggers";
import {
  type DropRow,
  calculateAge,
  isActiveDrop,
  isProfileMediaItem,
  normalizeMediaItem,
  parseDateValue,
} from "./utils";
import { resolveVisiblePhoneNumber } from "@/lib/contact-visibility";

type RadarContextProfile = {
  gender: string | null;
  user_id: string;
};

type RadarLocationRow = {
  latitude: number;
  longitude: number;
  updated_at: string | null;
  user_id: string;
};

type RadarProfileRow = {
  avatar_url: string | null;
  birthdate: string | null;
  distance_km: number;
  is_profile_verified: boolean | null;
  location_updated_at: string | null;
  profile_id: string;
  profile_updated_at: string | null;
  user_id: string;
  username: string;
  is_wishlisted?: boolean;
};

type RadarUserRow = {
  id: string;
  phone_number: string | null;
  role: string | null;
};

type RadarUserSettingsRow = {
  user_id: string;
  hide_from_contacts: boolean | null;
};

type HiddenContactRow = {
  user_id: string;
  target_phone_number: string;
};

type UserMediaRow = {
  created_at: string | null;
  id: string;
  media_type: string | null;
  media_url: string | null;
  sort_order: number | null;
  user_id: string;
};

type SessionActivityMap = Map<string, string>;

type UpsertRadarLocationInput = {
  accuracyMeters?: number | null;
  latitude: number;
  longitude: number;
  userId: string;
};

export interface RadarFeedResult {
  error?: string;
  profiles: HomeFeedProfile[];
}

const RADAR_RADIUS_KM = 10;

function formatRadarDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return "<1km away";
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  }

  return `${Math.round(distanceKm)}km away`;
}

function isPrivilegedRole(role: string | null | undefined) {
  return role === "admin" || role === "moderator";
}

function mapRadarProfile(
  candidate: RadarProfileRow,
  mediaRows: UserMediaRow[],
  dropRows: DropRow[],
  sessionActivity: SessionActivityMap,
  phoneNumber?: string | null,
  hideFromContacts = false,
  hiddenContacts: string[] = [],
  currentUserPhone?: string | null,
): HomeFeedProfile | null {
  const sortedMediaRows = [...mediaRows].sort((left, right) => {
    const leftOrder = left.sort_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.sort_order ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return parseDateValue(left.created_at) - parseDateValue(right.created_at);
  });
  const media = sortedMediaRows
    .map((item) => normalizeMediaItem(item.id, item.media_url, item.created_at, item.media_type))
    .filter(isProfileMediaItem);
  const avatarMedia = normalizeMediaItem(
    `${candidate.profile_id}-avatar`,
    candidate.avatar_url,
    candidate.profile_updated_at,
    "image",
  );
  const profileMedia = media.length > 0 ? media : avatarMedia ? [avatarMedia] : [];
  const images = deriveImages(profileMedia);

  if (images.length === 0) {
    return null;
  }

  const activeDrops = dropRows
    .filter(isActiveDrop)
    .sort((left, right) => parseDateValue(left.created_at) - parseDateValue(right.created_at))
    .map((drop) =>
      normalizeMediaItem(drop.id, drop.media_url, drop.created_at, drop.media_type, drop.caption),
    )
    .filter(isProfileMediaItem);
  const latestDrop = [...activeDrops].sort(
    (left, right) => parseDateValue(right.createdAt) - parseDateValue(left.createdAt),
  )[0];
  const distanceLabel = formatRadarDistance(candidate.distance_km);
  const activityReference = resolveActivityReference(
    candidate.user_id,
    sessionActivity,
    candidate.location_updated_at,
    candidate.profile_updated_at,
  );

  return {
    activityStatus: formatRelativeActivity(activityReference),
    age: calculateAge(candidate.birthdate),
    distance: distanceLabel,
    dropImages: activeDrops.length > 0 ? deriveImages(activeDrops) : images.slice(0, 1),
    dropMedia: activeDrops,
    dropTime: latestDrop?.createdAt ? formatElapsedCompact(latestDrop.createdAt) : undefined,
    hasDrop: activeDrops.length > 0,
    id: candidate.profile_id,
    images,
    isVerified: Boolean(candidate.is_profile_verified),
    locationLabel: distanceLabel,
    media: profileMedia,
    username: candidate.username,
    userId: candidate.user_id,
    isWishlisted: Boolean(candidate.is_wishlisted),
    phoneNumber: resolveVisiblePhoneNumber({
      currentUserPhone,
      hiddenContacts,
      hideFromContacts,
      phoneNumber,
    }),
  } satisfies HomeFeedProfile;
}

async function getRadarContext(userId: string) {
  const [profiles, locations] = await Promise.all([
    querySupabaseRest<RadarContextProfile[]>(
      "profiles",
      new URLSearchParams({
        limit: "1",
        select: "user_id,gender",
        user_id: `eq.${userId}`,
      }),
    ),
    querySupabaseRest<RadarLocationRow[]>(
      "user_locations",
      new URLSearchParams({
        limit: "1",
        select: "user_id,latitude,longitude,updated_at",
        user_id: `eq.${userId}`,
      }),
    ),
  ]);

  return {
    location: locations[0] ?? null,
    profile: profiles[0] ?? null,
  };
}

async function fetchNearbyRadarRows(userId: string) {
  return requestSupabaseRest<RadarProfileRow[]>("rpc/get_radar_profiles", {
    body: {
      p_radius_km: RADAR_RADIUS_KM,
      p_user_id: userId,
    },
    method: "POST",
  });
}

async function fetchExploreRadarRows(userId: string) {
  return requestSupabaseRest<RadarProfileRow[]>("rpc/get_explore_profiles", {
    body: {
      p_user_id: userId,
    },
    method: "POST",
  });
}

async function fetchCitySearchRadarRows(userId: string, city: string) {
  return requestSupabaseRest<RadarProfileRow[]>("rpc/search_profiles_by_city", {
    body: {
      p_city: city,
      p_user_id: userId,
    },
    method: "POST",
  });
}

export async function upsertRadarLocationForUser({
  accuracyMeters = null,
  latitude,
  longitude,
  userId,
}: UpsertRadarLocationInput) {
  await requestSupabaseRest<unknown>("user_locations", {
    body: {
      accuracy_meters: accuracyMeters,
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    method: "POST",
    searchParams: new URLSearchParams({
      on_conflict: "user_id",
    }),
  });
}

async function enrichAndMapProfiles(candidateRows: RadarProfileRow[], userId: string) {
  if (candidateRows.length === 0) {
    return [];
  }

  const candidateUserIds = Array.from(new Set(candidateRows.map((profile) => profile.user_id)));
  const userFilter = `in.(${candidateUserIds.join(",")})`;

  const [mediaRows, dropRows, wishlistRows, sessionActivity, userRows, settingsRows, hiddenContactRows] = await Promise.all([
    querySupabaseRest<UserMediaRow[]>(
      "user_media",
      new URLSearchParams({
        order: "sort_order.asc,created_at.asc",
        select: "id,user_id,media_url,media_type,sort_order,created_at",
        user_id: userFilter,
      }),
    ),
    querySupabaseRest<DropRow[]>(
      "drops",
      new URLSearchParams({
        order: "created_at.desc",
        select: "id,user_id,media_url,media_type,created_at,expires_at,caption",
        user_id: userFilter,
      }),
    ),
    querySupabaseRest<{ target_user_id: string }[]>(
      "wishlist",
      new URLSearchParams({
        select: "target_user_id",
        user_id: `eq.${userId}`,
        target_user_id: `in.(${candidateUserIds.join(",")})`,
      }),
    ),
    getLatestSessionActivity(candidateUserIds),
    querySupabaseRest<RadarUserRow[]>(
      "users",
      new URLSearchParams({
        select: "id,phone_number,role",
        id: userFilter,
      }),
    ),
    querySupabaseRest<RadarUserSettingsRow[]>(
      "user_settings",
      new URLSearchParams({
        select: "user_id,hide_from_contacts",
        user_id: userFilter,
      }),
    ),
    querySupabaseRest<HiddenContactRow[]>(
      "hidden_contacts",
      new URLSearchParams({
        select: "user_id,target_phone_number",
        user_id: userFilter,
      }),
    ),
  ]);

  const mediaMap = new Map<string, UserMediaRow[]>();
  const dropMap = new Map<string, DropRow[]>();

  for (const item of mediaRows) {
    const items = mediaMap.get(item.user_id) ?? [];
    items.push(item);
    mediaMap.set(item.user_id, items);
  }

  for (const item of dropRows) {
    const items = dropMap.get(item.user_id) ?? [];
    items.push(item);
    dropMap.set(item.user_id, items);
  }

  const wishlistSet = new Set(wishlistRows.map((w) => w.target_user_id));
  const userMap = new Map(userRows.map((row) => [row.id, row.phone_number]));
  const settingsMap = new Map(settingsRows.map((row) => [row.user_id, Boolean(row.hide_from_contacts)]));
  const hiddenContactMap = new Map<string, string[]>();

  for (const row of hiddenContactRows) {
    const contacts = hiddenContactMap.get(row.user_id) ?? [];
    contacts.push(row.target_phone_number);
    hiddenContactMap.set(row.user_id, contacts);
  }

  const currentUser = await querySupabaseRest<RadarUserRow[]>(
    "users",
    new URLSearchParams({
      select: "id,phone_number,role",
      id: `eq.${userId}`,
      limit: "1",
    }),
  );
  const currentUserPhone = currentUser[0]?.phone_number ?? null;
  const visibleCandidateRows = candidateRows.filter((profile) => {
    const candidateRole = userRows.find((row) => row.id === profile.user_id)?.role ?? null;
    return !isPrivilegedRole(candidateRole);
  });

  return visibleCandidateRows
    .map((profile) =>
      mapRadarProfile(
        { ...profile, is_wishlisted: wishlistSet.has(profile.user_id) },
        mediaMap.get(profile.user_id) ?? [],
        dropMap.get(profile.user_id) ?? [],
        sessionActivity,
        userMap.get(profile.user_id) ?? undefined,
        settingsMap.get(profile.user_id) ?? false,
        hiddenContactMap.get(profile.user_id) ?? [],
        currentUserPhone,
      ),
    )
    .filter((profile): profile is HomeFeedProfile => Boolean(profile));
}

export async function getRadarFeedForUser(
  userId: string,
): Promise<RadarFeedResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured for Radar yet.",
      profiles: [],
    };
  }

  try {
    const context = await getRadarContext(userId);

    if (!context.profile) {
      return {
        error: "Complete your profile before opening Radar.",
        profiles: [],
      };
    }

    if (!context.location) {
      return {
        error: "Enable location to see people within 10km.",
        profiles: [],
      };
    }

    const candidateRows = await fetchNearbyRadarRows(userId);

    if (candidateRows.length === 0) {
      return {
        profiles: [],
      };
    }

    const profiles = await enrichAndMapProfiles(candidateRows, userId);

    // Notify about the closest 2 users found (if any)
    if (profiles.length > 0) {
      const topMatches = profiles.slice(0, 2);
      for (const p of topMatches) {
        void notifyUserNearby(userId, p.username, p.userId, p.images[0]);
      }
    }

    return {
      profiles,
    };
  } catch (error) {
    console.error("Error loading nearby radar profiles:", error);
    return {
      error: "Radar could not load nearby profiles right now.",
      profiles: [],
    };
  }
}

export async function searchProfilesByCity(
  userId: string,
  city: string,
): Promise<RadarFeedResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured for search.",
      profiles: [],
    };
  }

  try {
    const context = await getRadarContext(userId);

    if (!context.profile) {
      return { error: "Complete your profile to use search.", profiles: [] };
    }

    const candidateRows = await fetchCitySearchRadarRows(userId, city);
    const profiles = await enrichAndMapProfiles(candidateRows, userId);

    return { profiles };
  } catch {
    return {
      error: "Search failed.",
      profiles: [],
    };
  }
}

export async function getExploreFeedForUser(
  userId: string,
): Promise<RadarFeedResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured for Explore yet.",
      profiles: [],
    };
  }

  try {
    const context = await getRadarContext(userId);
    // Explore doesn't strictly require precise lat/long for querying (uses ip_city),
    // but we need a profile to know gender.
    if (!context.profile) {
      return { error: "Complete your profile to use Explore.", profiles: [] };
    }

    const candidateRows = await fetchExploreRadarRows(userId);
    const profiles = await enrichAndMapProfiles(candidateRows, userId);

    return { profiles };
  } catch {
    return {
      error: "Explore could not load profiles right now.",
      profiles: [],
    };
  }
}
