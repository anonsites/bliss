import "server-only";

import type { InsiderDrop } from "@/features/discovery";
import { formatElapsedCompact } from "@/lib/geo";
import { querySupabaseRest } from "@/lib/supabase";
import {
  type DropRow,
  isActiveDrop,
  isProfileMediaItem,
  normalizeMediaItem,
  parseDateValue,
} from "./utils";

function mapRowToInsiderDrop(row: DropRow): InsiderDrop | null {
  const media = normalizeMediaItem(
    row.id,
    row.media_url,
    row.created_at,
    row.media_type,
    row.caption,
  );

  if (!isProfileMediaItem(media)) {
    return null;
  }

  const timeLabel = row.created_at
    ? formatElapsedCompact(row.created_at) ?? "Now"
    : "Now";

  return {
    caption: row.caption?.trim() || undefined,
    createdAt: row.created_at ?? undefined,
    id: row.id,
    media,
    timeLabel,
  };
}

export async function getInsiderDropsFeed(
  limit = 50,
): Promise<{ drops: InsiderDrop[]; error: string | null }> {
  try {
    const rows = await querySupabaseRest<DropRow[]>(
      "drops",
      new URLSearchParams({
        limit: String(limit),
        order: "created_at.desc",
        select: "id,user_id,media_url,media_type,created_at,expires_at,caption",
      }),
    );

    const drops = rows
      .filter(isActiveDrop)
      .sort((left, right) => parseDateValue(right.created_at) - parseDateValue(left.created_at))
      .map(mapRowToInsiderDrop)
      .filter((drop): drop is InsiderDrop => Boolean(drop));

    return { drops, error: null };
  } catch (error) {
    console.error("Error fetching insider drops:", error);
    return {
      drops: [],
      error: error instanceof Error ? error.message : "Failed to load drops.",
    };
  }
}
