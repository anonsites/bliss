import "server-only";

import { CLOUDINARY_UPLOAD_FOLDERS, resolveCloudinaryMediaUrl, uploadFileToCloudinary } from "@/lib/cloudinary";
import { countSupabaseRest, querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";

export type AdminPromoDrop = {
  caption: string | null;
  created_at: string;
  id: string;
  is_published: boolean;
  media_url: string;
  owner_avatar_url: string;
  owner_name: string;
  views: number;
};

type PromoDropRow = {
  caption: string | null;
  created_at: string;
  id: string;
  is_published: boolean;
  media_url: string;
  owner_avatar_url: string;
  owner_name: string;
};

type PromoDropViewRow = {
  promo_drop_id: string;
};

function requireText(value: FormDataEntryValue | null, label: string) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new Error(`${label} is required.`);
  }

  return text;
}

function requireFile(value: FormDataEntryValue | null, label: string) {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function validateImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Profile picture must be an image.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Profile picture must be less than 10MB.");
  }
}

function validateVideo(file: File) {
  if (!file.type.startsWith("video/")) {
    throw new Error("Drop media must be a video.");
  }

  if (file.size > 80 * 1024 * 1024) {
    throw new Error("Drop video must be less than 80MB.");
  }
}

function mapAdminPromoDrop(row: PromoDropRow, viewCounts: Map<string, number>): AdminPromoDrop {
  return {
    ...row,
    media_url: resolveCloudinaryMediaUrl(row.media_url, "video") ?? row.media_url,
    owner_avatar_url: resolveCloudinaryMediaUrl(row.owner_avatar_url, "image") ?? row.owner_avatar_url,
    views: viewCounts.get(row.id) ?? 0,
  };
}

export async function listAdminPromoDrops(limit = 40) {
  const rows = await querySupabaseRest<PromoDropRow[]>(
    "promo_drops",
    new URLSearchParams({
      limit: String(limit),
      order: "created_at.desc",
      select: "id,owner_name,owner_avatar_url,media_url,caption,is_published,created_at",
    }),
  );

  if (rows.length === 0) {
    return [];
  }

  const viewRows = await querySupabaseRest<PromoDropViewRow[]>(
    "promo_drop_views",
    new URLSearchParams({
      promo_drop_id: `in.(${rows.map((row) => row.id).join(",")})`,
      select: "promo_drop_id",
    }),
  );
  const viewCounts = viewRows.reduce((counts, row) => {
    counts.set(row.promo_drop_id, (counts.get(row.promo_drop_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return rows.map((row) => mapAdminPromoDrop(row, viewCounts));
}

export async function createAdminPromoDrop(formData: FormData, adminUserId: string) {
  const ownerName = requireText(formData.get("ownerName"), "Owner name");
  const caption = typeof formData.get("caption") === "string" ? String(formData.get("caption")).trim() : "";
  const avatar = requireFile(formData.get("avatar"), "Profile picture");
  const video = requireFile(formData.get("video"), "Drop video");

  validateImage(avatar);
  validateVideo(video);

  const [avatarUpload, videoUpload] = await Promise.all([
    uploadFileToCloudinary(avatar, {
      folder: CLOUDINARY_UPLOAD_FOLDERS.promoProfiles,
      resourceType: "image",
    }),
    uploadFileToCloudinary(video, {
      folder: CLOUDINARY_UPLOAD_FOLDERS.promoDrops,
      resourceType: "video",
    }),
  ]);

  const insertedRows = await requestSupabaseRest<PromoDropRow[]>("promo_drops", {
    body: {
      caption: caption || null,
      created_by: adminUserId,
      is_published: true,
      media_type: "video",
      media_url: videoUpload.publicId,
      owner_avatar_url: avatarUpload.publicId,
      owner_name: ownerName,
    },
    headers: {
      Prefer: "return=representation",
    },
    method: "POST",
  });

  const inserted = insertedRows[0];

  if (!inserted) {
    throw new Error("Drop could not be created.");
  }

  return mapAdminPromoDrop(inserted, new Map());
}

export async function trackPromoDropView(userId: string, promoDropId: string) {
  await requestSupabaseRest("promo_drop_views", {
    body: {
      promo_drop_id: promoDropId,
      user_id: userId,
    },
    headers: {
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    method: "POST",
    searchParams: new URLSearchParams({
      on_conflict: "user_id,promo_drop_id",
    }),
  });
}

export async function countPromoDrops() {
  return countSupabaseRest("promo_drops");
}
