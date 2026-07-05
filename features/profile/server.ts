import "server-only";

import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";
import { resolveVisiblePhoneNumber } from "@/lib/contact-visibility";
import { querySupabaseRest } from "@/lib/supabase";
import { isActiveDrop, parseDateValue, type DropRow } from "@/features/discovery/utils";
import type { ProfilePageData } from "./models";

type ProfileRow = {
  avatar_url: string | null;
  bio: string | null;
  birthdate: string | null;
  gender: string | null;
  is_profile_verified: boolean | null;
  user_id: string;
  username: string | null;
};

type UserSettingsRow = {
  hide_from_contacts: boolean | null;
  push_notifications: boolean | null;
  ghost_mode: boolean | null;
};

type UserRow = {
  phone_number: string | null;
};

type NotificationRow = {
  id: string;
  content: string | null;
  created_at: string | null;
  is_read: boolean | null;
};

type BlockedProfileRow = {
  blocked_user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

type UserLocationRow = {
  ip_city: string | null;
  latitude: number | null;
  longitude: number | null;
};

type HiddenContactRow = {
  target_phone_number: string;
};

export interface PublicProfileViewData {
  avatar_url: string;
  bio: string | null;
  id: string;
  is_profile_verified: boolean;
  location_label: string;
  phone_number?: string;
  user_media: Array<{ id: string; media_url: string }>;
  username: string;
}

type UserMediaRow = {
  created_at: string | null;
  id: string;
  media_url: string | null;
  sort_order: number | null;
};

const FALLBACK_PROFILE_IMAGE = "/images/bliss_icon.png";

export async function getPublicProfileViewData(
  userId: string,
  currentViewerId?: string | null,
): Promise<PublicProfileViewData | null> {
  const [profileRows, locationRows, mediaRows, settingsRows, userRows, hiddenContactRows, currentViewerRows] = await Promise.all([
    querySupabaseRest<ProfileRow[]>(
      "profiles",
      new URLSearchParams({
        limit: "1",
        select: "user_id,username,bio,birthdate,gender,avatar_url,is_profile_verified",
        user_id: `eq.${userId}`,
      }),
    ),
    querySupabaseRest<UserLocationRow[]>(
      "user_locations",
      new URLSearchParams({
        limit: "1",
        select: "ip_city,latitude,longitude",
        user_id: `eq.${userId}`,
      }),
    ),
    querySupabaseRest<UserMediaRow[]>(
      "user_media",
      new URLSearchParams({
        order: "sort_order.asc,created_at.asc",
        select: "id,media_url,sort_order,created_at",
        user_id: `eq.${userId}`,
      }),
    ),
    querySupabaseRest<UserSettingsRow[]>(
      "user_settings",
      new URLSearchParams({
        limit: "1",
        select: "hide_from_contacts",
        user_id: `eq.${userId}`,
      }),
    ),
    querySupabaseRest<UserRow[]>(
      "users",
      new URLSearchParams({
        limit: "1",
        select: "phone_number",
        id: `eq.${userId}`,
      }),
    ),
    currentViewerId
      ? querySupabaseRest<HiddenContactRow[]>(
          "hidden_contacts",
          new URLSearchParams({
            select: "target_phone_number",
            user_id: `eq.${currentViewerId}`,
          }),
        )
      : Promise.resolve<HiddenContactRow[]>([]),
    currentViewerId
      ? querySupabaseRest<UserRow[]>(
          "users",
          new URLSearchParams({
            limit: "1",
            select: "phone_number",
            id: `eq.${currentViewerId}`,
          }),
        )
      : Promise.resolve<UserRow[]>([]),
  ]);

  const profile = profileRows[0];

  if (!profile) {
    return null;
  }

  const sortedMedia = [...mediaRows].sort((left, right) => {
    const leftOrder = left.sort_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.sort_order ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return parseDateValue(left.created_at) - parseDateValue(right.created_at);
  });

  const avatarUrl = resolveImageUrl(profile.avatar_url, resolveImageUrl(sortedMedia[0]?.media_url));
  const settings = settingsRows[0];
  const phoneNumber = resolveVisiblePhoneNumber({
    currentUserPhone: currentViewerRows[0]?.phone_number ?? null,
    hiddenContacts: hiddenContactRows.map((row) => row.target_phone_number),
    hideFromContacts: Boolean(settings?.hide_from_contacts),
    phoneNumber: userRows[0]?.phone_number ?? null,
  });

  return {
    avatar_url: avatarUrl,
    bio: profile.bio?.trim() ?? null,
    id: profile.user_id,
    is_profile_verified: Boolean(profile.is_profile_verified),
    location_label: resolveLocationLabel(locationRows[0] ?? null),
    phone_number: phoneNumber,
    user_media: sortedMedia.map((item) => ({
      id: item.id,
      media_url: resolveImageUrl(item.media_url, avatarUrl),
    })),
    username: profile.username?.trim() || "Bliss member",
  } satisfies PublicProfileViewData;
}

function resolveLocationLabel(location: UserLocationRow | null | undefined) {
  const city = location?.ip_city?.trim();

  if (city) {
    return city;
  }

  if (
    location &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    return "Location enabled";
  }

  return "Location unavailable";
}

function resolveImageUrl(rawUrl: string | null | undefined, fallback = FALLBACK_PROFILE_IMAGE) {
  return resolveCloudinaryMediaUrl(rawUrl, "image") ?? fallback;
}

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export async function getProfilePageData(userId: string): Promise<ProfilePageData | null> {
  const [
    profiles,
    locations,
    mediaRows,
    dropRows,
    settingsRows,
    notificationRows,
    blockedRows,
    hiddenContactRows,
    userRows,
  ] = await Promise.all([
    querySupabaseRest<ProfileRow[]>(
      "profiles",
      new URLSearchParams({
        user_id: `eq.${userId}`,
        limit: "1",
        select: "user_id,username,bio,birthdate,gender,avatar_url,is_profile_verified",
      }),
    ),
    querySupabaseRest<UserLocationRow[]>(
      "user_locations",
      new URLSearchParams({
        user_id: `eq.${userId}`,
        limit: "1",
        select: "ip_city,latitude,longitude",
      }),
    ),
    querySupabaseRest<UserMediaRow[]>(
      "user_media",
      new URLSearchParams({
        order: "sort_order.asc,created_at.asc",
        select: "id,media_url,sort_order,created_at",
        user_id: `eq.${userId}`,
      }),
    ),
    querySupabaseRest<DropRow[]>(
      "drops",
      new URLSearchParams({
        order: "created_at.desc",
        select: "id,user_id,media_url,media_type,created_at,expires_at,caption",
        user_id: `eq.${userId}`,
      }),
    ),
    querySupabaseRest<UserSettingsRow[]>(
      "user_settings",
      new URLSearchParams({
        user_id: `eq.${userId}`,
        limit: "1",
      }),
    ),
    querySupabaseRest<NotificationRow[]>(
      "notifications",
      new URLSearchParams({
        user_id: `eq.${userId}`,
        order: "created_at.desc",
        limit: "20",
      }),
    ),
    querySupabaseRest<BlockedProfileRow[]>(
      "blocks",
      new URLSearchParams({
        user_id: `eq.${userId}`,
        select: "blocked_user_id",
      }),
    ),
    querySupabaseRest<HiddenContactRow[]>(
      "hidden_contacts",
      new URLSearchParams({
        user_id: `eq.${userId}`,
        select: "target_phone_number",
      }),
    ),
    querySupabaseRest<UserRow[]>(
      "users",
      new URLSearchParams({
        id: `eq.${userId}`,
        limit: "1",
        select: "phone_number",
      }),
    ),
  ]);

  // Fetch profiles for blocked users
  const blockedUserIds = blockedRows.map(row => row.blocked_user_id);
  const blockedUserProfiles = blockedUserIds.length > 0 ? await querySupabaseRest<ProfileRow[]>(
    "profiles",
    new URLSearchParams({
      user_id: `in.(${blockedUserIds.join(',')})`,
      select: "user_id,username,avatar_url",
    }),
  ) : [];

  const profile = profiles[0];

  if (!profile) {
    return null;
  }

  const settings = settingsRows[0];
  const location = locations[0] ?? null;
  const user = userRows[0] ?? null;
  const sortedMedia = [...mediaRows].sort((left, right) => {
    const leftOrder = left.sort_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.sort_order ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return parseDateValue(left.created_at) - parseDateValue(right.created_at);
  });
  const avatarUrl = resolveImageUrl(profile.avatar_url, resolveImageUrl(sortedMedia[0]?.media_url));

  return ({
    avatar_url: avatarUrl,
    bio: profile.bio?.trim() ?? "",
    birthdate: profile.birthdate ?? "2000-01-01",
    drops: dropRows
      .filter(isActiveDrop)
      .map((drop) => {
        const mediaUrl = resolveCloudinaryMediaUrl(drop.media_url, "image");

        if (!mediaUrl || !drop.created_at) {
          return null;
        }

        return {
          created_at: drop.created_at,
          id: drop.id,
          media_url: mediaUrl,
        };
      })
      .filter((drop): drop is ProfilePageData["drops"][number] => Boolean(drop)),
    id: profile.user_id,
    is_profile_verified: Boolean(profile.is_profile_verified),
    location_label: resolveLocationLabel(location),
    phone_number: user?.phone_number ?? "",
    user_media: sortedMedia.map((item) => ({
      id: item.id,
      media_url: resolveImageUrl(item.media_url, avatarUrl),
    })),
    username: profile.username?.trim() || "Bliss member",
    gender: profile.gender || "not specified",
    notifications: notificationRows.map((n) => ({
      id: n.id,
      text: n.content ?? "",
      timeLabel: formatRelativeTime(n.created_at),
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    })),
    settings: {
      hideFromContacts: settings?.hide_from_contacts ?? true,
      pushNotifications: settings?.push_notifications ?? false,
      ghostMode: Boolean(settings?.ghost_mode),
    },
    blockedUsers: blockedUserIds.map((id) => {
      const blockedProfile = blockedUserProfiles.find((p) => p.user_id === id);
      return {
        id,
        username: blockedProfile?.username || "Unknown member",
        avatar_url: resolveImageUrl(blockedProfile?.avatar_url),
      };
    }),
    blockedUsersCount: blockedRows.length,
    hiddenContacts: hiddenContactRows.map((row) => row.target_phone_number),
  });
}
