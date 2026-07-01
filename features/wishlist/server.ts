import "server-only";

import { formatElapsedCompact, formatRelativeActivity } from "@/lib/geo";
import { deriveImages, type HomeFeedProfile } from "@/features/discovery";
import { isSupabaseConfigured, querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";
import { notifyAddedToWishlist } from "@/features/notifications";
import {
  type DropRow,
  calculateAge,
  isActiveDrop,
  isProfileMediaItem,
  normalizeMediaItem,
  parseDateValue,
} from "@/features/discovery/utils";

type WishlistRow = {
  created_at: string | null;
  target_user_id: string;
};

type WishlistProfileRow = {
  avatar_url: string | null;
  birthdate: string | null;
  id: string;
  is_active: boolean | null;
  is_profile_verified: boolean | null;
  updated_at: string | null;
  user_id: string;
  username: string | null;
};

type WishlistLocationRow = {
  ip_city: string | null;
  updated_at: string | null;
  user_id: string;
};

type UserMediaRow = {
  created_at: string | null;
  id: string;
  media_type: string | null;
  media_url: string | null;
  sort_order: number | null;
  user_id: string;
};

type UserRow = {
  id: string;
  phone_number: string | null;
};

type UserSettingsRow = {
  user_id: string;
  hide_from_contacts: boolean | null;
};

type HiddenContactRow = {
  user_id: string;
  target_phone_number: string;
};

export interface WishlistProfile extends HomeFeedProfile {
  isActive: boolean;
}

export interface WishlistFeedResult {
  error?: string;
  profiles: WishlistProfile[];
}

function resolveWishlistLocationLabel(location: WishlistLocationRow | null | undefined) {
  const city = location?.ip_city?.trim();
  return city ? city : "Saved profile";
}

function buildUserFilter(userIds: string[]) {
  return `in.(${userIds.join(",")})`;
}

function mapWishlistProfile(
  profile: WishlistProfileRow,
  location: WishlistLocationRow | null | undefined,
  mediaRows: UserMediaRow[],
  dropRows: DropRow[],
  phoneNumber?: string | null,
): WishlistProfile | null {
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
    `${profile.id}-avatar`,
    profile.avatar_url,
    profile.updated_at,
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
  const locationLabel = resolveWishlistLocationLabel(location);
  const activityReference = location?.updated_at ?? profile.updated_at;

  return {
    activityStatus: formatRelativeActivity(activityReference),
    age: calculateAge(profile.birthdate),
    distance: locationLabel,
    dropImages: activeDrops.length > 0 ? deriveImages(activeDrops) : images.slice(0, 1),
    dropMedia: activeDrops,
    dropTime: latestDrop?.createdAt ? formatElapsedCompact(latestDrop.createdAt) : undefined,
    hasDrop: activeDrops.length > 0,
    id: profile.id,
    images,
    isActive: Boolean(profile.is_active),
    isVerified: Boolean(profile.is_profile_verified),
    locationLabel,
    media: profileMedia,
    username: profile.username?.trim() || "Bliss member",
    userId: profile.user_id,
    phoneNumber: phoneNumber ?? undefined,
  } satisfies WishlistProfile;
}

export async function toggleWishlistProfile(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    return { added: false, error: "Cannot add yourself to wishlist." };
  }

  const existing = await querySupabaseRest<WishlistRow[]>(
    "wishlist",
    new URLSearchParams({
      select: "id",
      target_user_id: `eq.${targetUserId}`,
      user_id: `eq.${userId}`,
    }),
  );

  if (existing.length > 0) {
    await requestSupabaseRest("wishlist", {
      method: "DELETE",
      searchParams: new URLSearchParams({
        target_user_id: `eq.${targetUserId}`,
        user_id: `eq.${userId}`,
      }),
    });
    return { added: false };
  }

  await requestSupabaseRest("wishlist", {
    body: {
      target_user_id: targetUserId,
      user_id: userId,
    },
    method: "POST",
  });

  // Notify the target user that they've been added to a wishlist
  try {
    const adderProfiles = await querySupabaseRest<WishlistProfileRow[]>(
      "profiles",
      new URLSearchParams({
        limit: "1",
        select: "username,avatar_url",
        user_id: `eq.${userId}`,
      }),
    );
    const adderProfile = adderProfiles[0];
    if (adderProfile) {
      void notifyAddedToWishlist(
        targetUserId,
        adderProfile.username || "Someone",
        userId,
        adderProfile.avatar_url || undefined,
      );
    }
  } catch (error) {
    console.error("Failed to send wishlist notification:", error);
  }

  return { added: true };
}

export async function getWishlistProfilesForUser(userId: string, currentUserPhone?: string): Promise<WishlistFeedResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured for wishlist yet.",
      profiles: [],
    };
  }

  try {
    const wishlistRows = await querySupabaseRest<WishlistRow[]>(
      "wishlist",
      new URLSearchParams({
        order: "created_at.desc",
        select: "target_user_id,created_at",
        user_id: `eq.${userId}`,
      }),
    );

    if (wishlistRows.length === 0) {
      return {
        profiles: [],
      };
    }

    const targetUserIds = Array.from(new Set(wishlistRows.map((row) => row.target_user_id)));
    const userFilter = buildUserFilter(targetUserIds);
    const [profileRows, locationRows, mediaRows, dropRows, userRows, settingsRows, hiddenContactRows] = await Promise.all([
      querySupabaseRest<WishlistProfileRow[]>(
        "profiles",
        new URLSearchParams({
          select: "id,user_id,username,birthdate,avatar_url,is_profile_verified,is_active,updated_at",
          user_id: userFilter,
        }),
      ),
      querySupabaseRest<WishlistLocationRow[]>(
        "user_locations",
        new URLSearchParams({
          select: "user_id,ip_city,updated_at",
          user_id: userFilter,
        }),
      ),
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
      querySupabaseRest<UserRow[]>(
        "users",
        new URLSearchParams({
          select: "id,phone_number",
          id: userFilter,
        }),
      ),
      querySupabaseRest<UserSettingsRow[]>(
        "user_settings",
        new URLSearchParams({
          select: "user_id,hide_from_contacts",
          user_id: userFilter,
        }),
      ),
      currentUserPhone
        ? querySupabaseRest<HiddenContactRow[]>(
            "hidden_contacts",
            new URLSearchParams({
              select: "user_id,target_phone_number",
              user_id: userFilter,
              target_phone_number: `eq.${currentUserPhone}`,
            }),
          )
        : Promise.resolve<HiddenContactRow[]>([]),
    ]);

    const profileMap = new Map(profileRows.map((row) => [row.user_id, row]));
    const locationMap = new Map(locationRows.map((row) => [row.user_id, row]));
    const mediaMap = new Map<string, UserMediaRow[]>();
    const dropMap = new Map<string, DropRow[]>();
    const userMap = new Map(userRows.map((row) => [row.id, row.phone_number]));
    const settingsMap = new Map(settingsRows.map((row) => [row.user_id, Boolean(row.hide_from_contacts)]));
    const hiddenContactMap = new Map<string, Set<string>>();

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

    for (const row of hiddenContactRows) {
      const contacts = hiddenContactMap.get(row.user_id) ?? new Set<string>();
      contacts.add(row.target_phone_number);
      hiddenContactMap.set(row.user_id, contacts);
    }

    return {
      profiles: wishlistRows
        .map((row) => {
          const profile = profileMap.get(row.target_user_id);

          if (!profile) {
            return null;
          }

          const phoneNumber = userMap.get(row.target_user_id) ?? undefined;
          const isPhoneVisible = Boolean(phoneNumber) && !settingsMap.get(row.target_user_id) &&
            !(currentUserPhone && hiddenContactMap.get(row.target_user_id)?.has(currentUserPhone));
          const visiblePhone = isPhoneVisible ? phoneNumber : undefined;

          return mapWishlistProfile(
            profile,
            locationMap.get(row.target_user_id),
            mediaMap.get(row.target_user_id) ?? [],
            dropMap.get(row.target_user_id) ?? [],
            visiblePhone,
          );
        })
        .filter((profile): profile is WishlistProfile => Boolean(profile)),
    };
  } catch {
    return {
      error: "Wishlist could not load right now.",
      profiles: [],
    };
  }
}
