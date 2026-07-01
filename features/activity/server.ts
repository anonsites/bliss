import "server-only";

import { querySupabaseRest } from "@/lib/supabase";

type SessionActivityRow = {
  last_seen_at: string | null;
  user_id: string;
};

function buildInFilter(ids: string[]) {
  return `in.(${ids.join(",")})`;
}

export async function getLatestSessionActivity(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await querySupabaseRest<SessionActivityRow[]>(
    "auth_sessions",
    new URLSearchParams({
      expires_at: `gt.${new Date().toISOString()}`,
      order: "last_seen_at.desc.nullslast",
      revoked_at: "is.null",
      select: "user_id,last_seen_at",
      user_id: buildInFilter(userIds),
    }),
  );

  const activityMap = new Map<string, string>();

  for (const row of rows) {
    if (row.last_seen_at && !activityMap.has(row.user_id)) {
      activityMap.set(row.user_id, row.last_seen_at);
    }
  }

  return activityMap;
}

export function resolveActivityReference(
  userId: string,
  sessionActivity: Map<string, string> | null | undefined,
  ...fallbacks: Array<string | null | undefined>
) {
  const sessionTimestamp = sessionActivity?.get(userId);

  if (sessionTimestamp) {
    return sessionTimestamp;
  }

  return fallbacks.find((value) => Boolean(value)) ?? null;
}
