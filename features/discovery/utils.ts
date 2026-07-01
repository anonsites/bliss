import { resolveCloudinaryMediaUrl, resolveCloudinaryVideoPoster } from "@/lib/cloudinary";
import { type ProfileMediaItem } from "./models";

export type DropRow = {
  created_at: string | null;
  expires_at: string | null;
  id: string;
  media_type: string | null;
  media_url: string | null;
  user_id: string;
  caption: string | null;
};

export function parseDateValue(dateValue: string | null | undefined) {
  if (!dateValue) {
    return 0;
  }
  const timestamp = new Date(dateValue).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function calculateAge(birthdate: string | null) {
  if (!birthdate) {
    return null;
  }
  const birthDate = new Date(birthdate);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

export function inferMediaType(
  rawUrl: string | null | undefined,
  explicitType?: string | null,
): "image" | "video" {
  if (explicitType === "image" || explicitType === "video") {
    return explicitType;
  }
  if (rawUrl && /\.(mp4|mov|webm|m4v)(\?|$)/i.test(rawUrl)) {
    return "video";
  }
  return "image";
}

export function normalizeMediaItem(
  id: string,
  rawUrl: string | null | undefined,
  createdAt: string | null | undefined,
  explicitType?: string | null,
  caption?: string | null,
): ProfileMediaItem | null {
  const type = inferMediaType(rawUrl, explicitType);
  const src = resolveCloudinaryMediaUrl(rawUrl, type);
  if (!src) {
    return null;
  }
  const thumbnailSrc =
    type === "video" ? resolveCloudinaryVideoPoster(rawUrl) ?? undefined : undefined;
  return {
    createdAt: createdAt ?? undefined,
    id,
    src,
    thumbnailSrc,
    type,
    caption: caption ?? undefined,
  } satisfies ProfileMediaItem;
}

export function isProfileMediaItem(
  item: ProfileMediaItem | null,
): item is ProfileMediaItem {
  return item !== null;
}

export function isActiveDrop(drop: DropRow) {
  if (!drop.expires_at) {
    return true;
  }
  const expiresAt = new Date(drop.expires_at).getTime();
  if (Number.isNaN(expiresAt)) {
    return true;
  }
  return expiresAt > Date.now();
}
