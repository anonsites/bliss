import "server-only";

import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";
import { countSupabaseRest, querySupabaseRest } from "@/lib/supabase";

type DropRow = {
  caption: string | null;
  created_at: string;
  id: string;
  media_url: string | null;
  user_id: string;
};

type ProfileRow = {
  avatar_url: string | null;
  created_at: string;
  user_id: string;
  username: string | null;
};

export type AdminOverview = {
  activeUsers: number;
  monthlyVisitors: Array<{ label: string; value: number }>;
  recentDrops: Array<{
    caption: string | null;
    created_at: string;
    id: string;
    media_url: string | null;
    profiles: Array<{ username: string | null }>;
  }>;
  recentUsers: Array<{
    created_at: string;
    id: string;
    profiles: Array<{ avatar_url: string | null; username: string | null }>;
  }>;
  totalDrops: number;
  totalUsers: number;
};

function buildInFilter(ids: string[]) {
  return `in.(${ids.join(",")})`;
}

function getSixMonthWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  return {
    end: now,
    start,
  };
}

function buildMonthlyVisitors(rows: Array<{ created_at: string }>) {
  const result: AdminOverview["monthlyVisitors"] = [];
  const now = new Date();

  for (let monthIndex = 5; monthIndex >= 0; monthIndex -= 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthIndex, 1));
    const start = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
    const end = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1));
    const label = monthDate.toLocaleString("en", { month: "short", timeZone: "UTC" });

    const value = rows.filter((user) => {
      const createdAt = new Date(user.created_at);
      return createdAt >= start && createdAt < end;
    }).length;

    result.push({ label, value });
  }

  return result;
}

async function getProfiles(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);

  if (uniqueUserIds.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const profiles = await querySupabaseRest<ProfileRow[]>(
    "profiles",
    new URLSearchParams({
      select: "user_id,username,avatar_url,created_at",
      user_id: buildInFilter(uniqueUserIds),
    }),
  );

  return new Map(profiles.map((profile) => [profile.user_id, profile]));
}

function mapProfileForOverview(profile: ProfileRow) {
  return {
    avatar_url: resolveCloudinaryMediaUrl(profile.avatar_url, "image"),
    username: profile.username?.trim() || "Bliss member",
  };
}

function recentActivityThreshold(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const { start } = getSixMonthWindow();

  const [
    totalUsers,
    totalDrops,
    activeUsers,
    recentProfiles,
    recentDrops,
    monthlyUserRows,
  ] = await Promise.all([
    countSupabaseRest("users"),
    countSupabaseRest("drops"),
    countSupabaseRest(
      "auth_sessions",
      new URLSearchParams({
        expires_at: `gt.${new Date().toISOString()}`,
        last_seen_at: `gte.${recentActivityThreshold(5)}`,
        revoked_at: "is.null",
      }),
    ),
    querySupabaseRest<ProfileRow[]>(
      "profiles",
      new URLSearchParams({
        limit: "6",
        order: "created_at.desc",
        select: "user_id,username,avatar_url,created_at",
      }),
    ),
    querySupabaseRest<DropRow[]>(
      "drops",
      new URLSearchParams({
        limit: "6",
        order: "created_at.desc",
        select: "id,user_id,created_at,caption,media_url",
      }),
    ),
    querySupabaseRest<Array<{ created_at: string }>>(
      "users",
      new URLSearchParams({
        created_at: `gte.${start.toISOString()}`,
        order: "created_at.desc",
        select: "created_at",
      }),
    ),
  ]);

  const profileMap = await getProfiles([
    ...recentDrops.map((drop) => drop.user_id),
  ]);

  return {
    activeUsers,
    monthlyVisitors: buildMonthlyVisitors(monthlyUserRows),
    recentDrops: recentDrops.map((drop) => {
      const profile = profileMap.get(drop.user_id) ?? null;

      return {
        caption: drop.caption,
        created_at: drop.created_at,
        id: drop.id,
        media_url: resolveCloudinaryMediaUrl(drop.media_url, "image"),
        profiles: profile ? [{ username: profile.username }] : [],
      };
    }),
    recentUsers: recentProfiles.map((profile) => ({
      created_at: profile.created_at,
      id: profile.user_id,
      profiles: [mapProfileForOverview(profile)],
    })),
    totalDrops,
    totalUsers,
  };
}
