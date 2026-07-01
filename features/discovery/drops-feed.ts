import "server-only";

import type { InsiderDrop } from "@/features/discovery";
import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";
import { formatElapsedCompact } from "@/lib/geo";
import { querySupabaseRest } from "@/lib/supabase";
import {
  type DropRow,
  isActiveDrop,
  isProfileMediaItem,
  normalizeMediaItem,
  parseDateValue,
} from "./utils";

type PromoDropRow = {
  caption: string | null;
  created_at: string | null;
  id: string;
  media_type: string | null;
  media_url: string | null;
  owner_avatar_url: string | null;
  owner_name: string | null;
};

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
    source: "user",
    timeLabel,
  };
}

function mapPromoRowToInsiderDrop(row: PromoDropRow): InsiderDrop | null {
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

  return {
    caption: row.caption?.trim() || undefined,
    createdAt: row.created_at ?? undefined,
    id: row.id,
    media,
    ownerAvatarUrl: resolveCloudinaryMediaUrl(row.owner_avatar_url, "image") ?? undefined,
    ownerName: row.owner_name?.trim() || "Bliss creator",
    source: "promo",
    timeLabel: row.created_at ? formatElapsedCompact(row.created_at) ?? "Now" : "Now",
  };
}

export async function getInsiderDropsFeed(
  limit = 50,
): Promise<{ drops: InsiderDrop[]; error: string | null }> {
  try {
    const [rows, promoRows] = await Promise.all([
      querySupabaseRest<DropRow[]>(
        "drops",
        new URLSearchParams({
          limit: String(limit),
          order: "created_at.desc",
          select: "id,user_id,media_url,media_type,created_at,expires_at,caption",
        }),
      ),
      querySupabaseRest<PromoDropRow[]>(
        "promo_drops",
        new URLSearchParams({
          is_published: "eq.true",
          limit: String(limit),
          order: "created_at.desc",
          select: "id,owner_name,owner_avatar_url,media_url,media_type,caption,created_at",
        }),
      ),
    ]);

    const userDrops = rows
      .filter(isActiveDrop)
      .sort((left, right) => parseDateValue(right.created_at) - parseDateValue(left.created_at))
      .map(mapRowToInsiderDrop)
      .filter((drop): drop is InsiderDrop => Boolean(drop));
    const promoDrops = promoRows
      .map(mapPromoRowToInsiderDrop)
      .filter((drop): drop is InsiderDrop => Boolean(drop));
    const drops = [...promoDrops, ...userDrops]
      .sort((left, right) => parseDateValue(right.createdAt) - parseDateValue(left.createdAt))
      .slice(0, limit);

    return { drops, error: null };
  } catch (error) {
    console.error("Error fetching insider drops:", error);
    return {
      drops: [],
      error: error instanceof Error ? error.message : "Failed to load drops.",
    };
  }
}
