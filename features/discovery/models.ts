import type { GeoLookupSource } from "@/lib/geo";

export type ProfileMediaType = "image" | "video";
export type MediaSource = "profile" | "drop";

export interface ProfileMediaItem {
  createdAt?: string;
  durationSeconds?: number;
  id: string;
  src: string;
  thumbnailSrc?: string;
  type: ProfileMediaType;
  caption?: string;
}

export interface HomeFeedLocation {
  city: string | null;
  country: string | null;
  region: string | null;
  source: GeoLookupSource;
}

export interface HomeFeedMeta {
  error?: string;
  fetchedAt: string;
  location: HomeFeedLocation;
}

export interface HomeFeedPromoDrop {
  avatarUrl: string;
  id: string;
  isVerified?: boolean;
  mediaSrc: string;
  mediaType: "image" | "video";
  posterSrc: string;
  username: string;
}

export interface HomeFeedPromoProfile {
  avatarUrl: string;
  city?: string | null;
  id: string;
  isVerified?: boolean;
  mediaSrc: string | null;
  mediaType?: "image" | "video";
  posterSrc?: string | null;
  username: string;
  phoneNumber?: string;
}

export interface HomeFeedProfile {
  activityStatus: string;
  age: number | null;
  distance: string;
  dropImages: string[];
  dropMedia: ProfileMediaItem[];
  dropTime?: string;
  hasDrop?: boolean;
  id: string;
  images: string[];
  isVerified?: boolean;
  locationLabel: string;
  media: ProfileMediaItem[];
  username: string;
  userId: string;
  phoneNumber?: string;
  isWishlisted?: boolean;
  isPromoProfile?: boolean;
}

export interface InsiderDrop {
  caption?: string;
  createdAt?: string;
  id: string;
  ownerAvatarUrl?: string;
  ownerName?: string;
  source?: "promo" | "user";
  media: ProfileMediaItem;
  timeLabel: string;
}

export interface HomeFeedPayload {
  meta: HomeFeedMeta;
  promoDrops: HomeFeedPromoDrop[];
  promoProfiles?: HomeFeedPromoProfile[];
  profiles: HomeFeedProfile[];
}

type MediaBearingProfile = Pick<HomeFeedProfile, "dropImages" | "dropMedia" | "images" | "media">;

function getMediaList(profile: MediaBearingProfile, source: MediaSource) {
  return source === "drop" ? profile.dropMedia : profile.media;
}

function getImageList(profile: MediaBearingProfile, source: MediaSource) {
  return source === "drop" ? profile.dropImages : profile.images;
}

function toRenderableSource(item: ProfileMediaItem) {
  if (item.type === "video") {
    return item.thumbnailSrc ?? null;
  }

  return item.src;
}

export function deriveImages(media: ProfileMediaItem[]) {
  return media
    .map((item) => toRenderableSource(item))
    .filter((item): item is string => Boolean(item));
}

export function getPrimaryMediaItem(
  profile: MediaBearingProfile,
  source: MediaSource = "profile",
) {
  return getMediaList(profile, source)[0] ?? null;
}

export function getPrimaryMediaThumbnail(
  profile: MediaBearingProfile,
  source: MediaSource = "profile",
) {
  const primaryMedia = getPrimaryMediaItem(profile, source);
  const images = getImageList(profile, source);

  if (!primaryMedia) {
    return images[0] ?? getImageList(profile, source === "drop" ? "profile" : "drop")[0] ?? "";
  }

  if (primaryMedia.type === "video") {
    return (
      primaryMedia.thumbnailSrc ??
      images[0] ??
      getImageList(profile, source === "drop" ? "profile" : "drop")[0] ??
      ""
    );
  }

  return primaryMedia.src;
}

export function getProfileMediaHighlights(
  profile: MediaBearingProfile,
  source: MediaSource = "profile",
) {
  return getMediaList(profile, source).reduce(
    (counts, item) => {
      if (item.type === "video") {
        counts.videoCount += 1;
      } else {
        counts.imageCount += 1;
      }

      return counts;
    },
    { imageCount: 0, videoCount: 0 },
  );
}
