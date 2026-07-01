import { createHash } from "node:crypto";
import type { ProfileMediaType } from "@/features/discovery";

const CLOUDINARY_HOST = "res.cloudinary.com";
type CloudinaryResourceType = "image" | "video";

export const CLOUDINARY_UPLOAD_FOLDERS = {
  drops: "users_content/drops",
  gallery: "users_content/gallery",
  promoDrops: "promo_content/drops",
  promoProfiles: "promo_content/profiles",
  profiles: "users_content/profiles",
} as const;

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizePublicId(value: string) {
  return value.replace(/^\/+/, "");
}

function withoutVideoExtension(value: string) {
  return value.replace(/\.(mp4|mov|webm|m4v)$/i, "");
}

function getCloudinaryBaseUrl(type: ProfileMediaType, transformation?: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();

  if (!cloudName) {
    return null;
  }

  const resourceType = type === "video" ? "video" : "image";
  const baseUrl = `https://${CLOUDINARY_HOST}/${cloudName}/${resourceType}/upload`;

  return transformation ? `${baseUrl}/${transformation}` : baseUrl;
}

function getCloudinaryUploadConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return {
    apiKey,
    apiSecret,
    cloudName,
  };
}

function createUploadSignature(
  params: Record<string, string | number>,
  apiSecret: string,
) {
  const serializedParams = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${serializedParams}${apiSecret}`).digest("hex");
}

export function getCloudinaryResourceTypeForFile(file: File): CloudinaryResourceType {
  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  throw new Error("Only image and video uploads are supported.");
}

export async function uploadFileToCloudinary(
  file: File,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: CloudinaryResourceType;
  },
) {
  const config = getCloudinaryUploadConfig();

  if (!config) {
    throw new Error("Cloudinary upload credentials are missing.");
  }

  const resourceType = options.resourceType ?? "image";
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    folder: options.folder,
    public_id: options.publicId ?? "",
    timestamp,
  };
  const signature = createUploadSignature(uploadParams, config.apiSecret);
  const formData = new FormData();

  formData.append("api_key", config.apiKey);
  formData.append("file", file);
  formData.append("folder", options.folder);
  formData.append("signature", signature);
  formData.append("timestamp", String(timestamp));

  if (options.publicId) {
    formData.append("public_id", options.publicId);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
    {
      body: formData,
      method: "POST",
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as {
    public_id: string;
    resource_type: CloudinaryResourceType;
    secure_url: string;
  };

  return {
    publicId: payload.public_id,
    resourceType: payload.resource_type,
    secureUrl: payload.secure_url,
  };
}

export function resolveCloudinaryMediaUrl(
  value: string | null | undefined,
  type: ProfileMediaType,
) {
  const source = value?.trim();

  if (!source) {
    return null;
  }

  if (isAbsoluteUrl(source) || source.startsWith("/")) {
    return source;
  }

  const baseUrl = getCloudinaryBaseUrl(type, "f_auto,q_auto");

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/${normalizePublicId(source)}`;
}

export function resolveCloudinaryVideoPoster(value: string | null | undefined) {
  const source = value?.trim();

  if (!source) {
    return null;
  }

  if (source.startsWith("/")) {
    return null;
  }

  if (isAbsoluteUrl(source)) {
    const [urlWithoutQuery] = source.split("?");

    if (!urlWithoutQuery.includes("/video/upload/")) {
      return null;
    }

    return urlWithoutQuery
      .replace("/video/upload/", "/video/upload/so_0,f_jpg,q_auto/")
      .replace(/\.[^./]+$/, ".jpg");
  }

  const baseUrl = getCloudinaryBaseUrl("video", "so_0,f_jpg,q_auto");

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/${withoutVideoExtension(normalizePublicId(source))}.jpg`;
}
