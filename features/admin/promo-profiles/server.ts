import "server-only";

import { CLOUDINARY_UPLOAD_FOLDERS, resolveCloudinaryMediaUrl, uploadFileToCloudinary } from "@/lib/cloudinary";
import { countSupabaseRest, querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";

export type AdminPromoProfile = {
  id: string;
  username: string;
  avatar_url: string;
  media_url: string | null;
  media_type: string;
  phone_number?: string | null;
  city?: string | null;
  gender: string;
  is_verified?: boolean;
  bio: string | null;
  is_published: boolean;
  created_at: string;
};

type PromoProfileRow = {
  id: string;
  username: string;
  avatar_url: string;
  media_url: string | null;
  media_type: string;
  phone_number: string | null;
  city: string | null;
  gender: string;
  is_verified: boolean | null;
  bio: string | null;
  is_published: boolean;
  created_at: string;
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

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isLikelyImage(file: File) {
  const normalizedType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  return normalizedType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(extension);
}

function isLikelyVideo(file: File) {
  const normalizedType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  return normalizedType.startsWith("video/") || ["mp4", "mov", "webm", "m4v", "avi"].includes(extension);
}

function validateImage(file: File) {
  if (!isLikelyImage(file)) {
    throw new Error("Profile avatar must be an image file.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Profile avatar must be less than 10MB.");
  }
}

function validateMedia(file: File) {
  if (isLikelyImage(file)) {
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("Profile media image must be less than 20MB.");
    }
    return;
  }

  if (isLikelyVideo(file)) {
    if (file.size > 80 * 1024 * 1024) {
      throw new Error("Profile media video must be less than 80MB.");
    }
    return;
  }

  throw new Error("Profile media must be an image or video file.");
}

function mapAdminPromoProfile(row: PromoProfileRow): AdminPromoProfile {
  return {
    ...row,
    avatar_url: resolveCloudinaryMediaUrl(row.avatar_url, "image") ?? row.avatar_url,
    media_url: row.media_url
      ? resolveCloudinaryMediaUrl(
          row.media_url,
          row.media_type === "video" ? "video" : "image",
        ) ?? row.media_url
      : null,
    media_type: row.media_type,
    phone_number: row.phone_number ?? null,
    is_verified: Boolean(row.is_verified),
  };
}

export async function listAdminPromoProfiles(limit = 40) {
  const rows = await querySupabaseRest<PromoProfileRow[]>(
    "promo_profiles",
    new URLSearchParams({
      limit: String(limit),
      order: "created_at.desc",
      select: "id,username,avatar_url,media_url,media_type,bio,phone_number,city,gender,is_published,created_at",
    }),
  );

  return rows.map(mapAdminPromoProfile);
}

export async function createAdminPromoProfile(formData: FormData, adminUserId: string) {
  const username = requireText(formData.get("username"), "Username");
  const bio = typeof formData.get("bio") === "string" ? String(formData.get("bio"))?.trim() || null : null;
  const phone = typeof formData.get("phone") === "string" ? String(formData.get("phone")).trim() || null : null;
  const city = typeof formData.get("city") === "string" ? String(formData.get("city")).trim() || null : null;
  const gender = requireText(formData.get("gender"), "Gender");
  const isVerified = formData.get("isVerified") === "1" || formData.get("isVerified") === "true";
  const avatar = requireFile(formData.get("avatar"), "Profile picture");
  validateImage(avatar);

  const mediaFile = requireFile(formData.get("media"), "Gallery image");
  validateMedia(mediaFile);

  const avatarUpload = await uploadFileToCloudinary(avatar, {
    folder: CLOUDINARY_UPLOAD_FOLDERS.promoProfiles,
    resourceType: "image",
  });

  const resourceType = isLikelyVideo(mediaFile) ? "video" : "image";
  const mediaUpload = await uploadFileToCloudinary(mediaFile, {
    folder: CLOUDINARY_UPLOAD_FOLDERS.promoProfiles,
    resourceType: resourceType as "image",
  });

  const insertedRows = await requestSupabaseRest<PromoProfileRow[]>("promo_profiles", {
    body: {
      username,
      avatar_url: avatarUpload.publicId,
      media_url: mediaUpload.publicId,
      media_type: mediaUpload.resourceType,
      phone_number: phone ?? null,
      city: city ?? null,
      gender,
      is_verified: isVerified,
      bio: bio ?? null,
      is_published: true,
      created_by: adminUserId,
    },
    headers: {
      Prefer: "return=representation",
    },
    method: "POST",
  });

  const inserted = insertedRows[0];

  if (!inserted) {
    throw new Error("Promo profile could not be created.");
  }

  return mapAdminPromoProfile(inserted);
}

export async function countPromoProfiles() {
  return countSupabaseRest("promo_profiles");
}
