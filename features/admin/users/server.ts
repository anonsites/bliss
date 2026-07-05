import "server-only";

import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";
import { querySupabaseRest } from "@/lib/supabase";

type ProfileRow = {
  user_id: string;
  username: string | null;
  gender: string;
  avatar_url: string | null;
  created_at: string;
};

type UserRow = {
  id: string;
  phone_number: string | null;
};

type LocationRow = {
  user_id: string;
  ip_city: string | null;
};

export type AdminUser = {
  id: string;
  username: string;
  gender: string;
  city: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
};

function normalizeSearch(search: string | null | undefined) {
  return search?.trim() ?? "";
}

function normalizeGender(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "male" || normalized === "female") {
    return normalized;
  }

  return undefined;
}

function buildProfileMap(profiles: ProfileRow[]) {
  const profilesMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    if (!profilesMap.has(profile.user_id)) {
      profilesMap.set(profile.user_id, profile);
    }
  }

  return profilesMap;
}

export async function listAdminUsers(options?: {
  gender?: string | null;
  search?: string | null;
  limit?: number;
}): Promise<AdminUser[]> {
  const gender = normalizeGender(options?.gender);
  const search = normalizeSearch(options?.search);
  const limit = Number.isFinite(options?.limit ?? 0) && options?.limit! > 0 ? options?.limit! : 200;

  if (!search) {
    const params = new URLSearchParams({
      select: "user_id,username,gender,avatar_url,created_at",
      order: "created_at.desc",
      limit: String(limit),
    });

    if (gender) {
      params.set("gender", `eq.${gender}`);
    }

    const profiles = await querySupabaseRest<ProfileRow[]>("profiles", params);
    return await mapAdminUsers(profiles);
  }

  const usernameParams = new URLSearchParams({
    select: "user_id,username,gender,avatar_url,created_at",
    order: "created_at.desc",
    limit: String(limit),
    username: `ilike.*${search}*`,
  });

  if (gender) {
    usernameParams.set("gender", `eq.${gender}`);
  }

  const [usernameProfiles, locationRows] = await Promise.all([
    querySupabaseRest<ProfileRow[]>("profiles", usernameParams),
    querySupabaseRest<LocationRow[]>("user_locations", new URLSearchParams({
      select: "user_id,ip_city",
      ip_city: `ilike.*${search}*`,
    })),
  ]);

  const locationUserIds = Array.from(new Set(locationRows.map((row) => row.user_id))).filter(Boolean);
  const locationProfiles: ProfileRow[] = locationUserIds.length > 0
    ? await querySupabaseRest<ProfileRow[]>("profiles", new URLSearchParams({
        select: "user_id,username,gender,avatar_url,created_at",
        order: "created_at.desc",
        limit: String(limit),
        user_id: `in.(${locationUserIds.join(",")})`,
        ...(gender ? { gender: `eq.${gender}` } : {}),
      }))
    : [];

  const combined = [...usernameProfiles, ...locationProfiles];
  const uniqueProfiles = Array.from(buildProfileMap(combined).values()).slice(0, limit);

  return await mapAdminUsers(uniqueProfiles);
}

async function mapAdminUsers(profiles: ProfileRow[]): Promise<AdminUser[]> {
  if (profiles.length === 0) {
    return [];
  }

  const userIds = profiles.map((profile) => profile.user_id);
  const users = await querySupabaseRest<UserRow[]>("users", new URLSearchParams({
    select: "id,phone_number",
    id: `in.(${userIds.join(",")})`,
  }));
  const locations = await querySupabaseRest<LocationRow[]>("user_locations", new URLSearchParams({
    select: "user_id,ip_city",
    user_id: `in.(${userIds.join(",")})`,
  }));

  const userMap = new Map(users.map((user) => [user.id, user.phone_number]));
  const locationMap = new Map(locations.map((location) => [location.user_id, location.ip_city]));

  return profiles.map((profile) => ({
    id: profile.user_id,
    username: profile.username?.trim() || "Bliss member",
    gender: profile.gender,
    city: locationMap.get(profile.user_id) ?? null,
    phone_number: userMap.get(profile.user_id) ?? null,
    avatar_url: resolveCloudinaryMediaUrl(profile.avatar_url, "image") ?? profile.avatar_url,
    created_at: profile.created_at,
  }));
}
