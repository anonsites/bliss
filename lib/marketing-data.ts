import { NearbyUser } from "@/components/home/NearbyUsers";
import { DropUser } from "@/components/home/DropsPreview";

/**
 * MARKETING DATA FALLBACKS
 * 
 * These are used as "hot data" to fill the home page when real-time 
 * location-based data is not yet available for a user.
 * 
 */

const CLOUDINARY_BASE = "https://res.cloudinary.com/dwqxfvedp";

export const FALLBACK_NEARBY_USERS: NearbyUser[] = [
  {
    id: "mkt-nearby-1",
    username: "Sasha",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/sasha.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/sasha_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/sasha_p1.jpg`,
    mediaType: "image",
    distance: "Nearby",
    isVerified: true,
  },
  {
    id: "mkt-nearby-2",
    username: "Marcus",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/marcus.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/marcus_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/marcus_p1.jpg`,
    mediaType: "image",
    distance: "Top Pick",
    isVerified: false,
  },
  {
    id: "mkt-nearby-3",
    username: "Elena",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/elena.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/elena_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/elena_p1.jpg`,
    mediaType: "image",
    distance: "Active Now",
    isVerified: true,
  },
  {
    id: "mkt-nearby-4",
    username: "Jordan",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/jordan.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/jordan_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/jordan_p1.jpg`,
    mediaType: "image",
    distance: "New Member",
    isVerified: false,
  },
  {
    id: "mkt-nearby-5",
    username: "Alex",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/alex.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/alex_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/alex_p1.jpg`,
    mediaType: "image",
    distance: "1.2 km",
    isVerified: true,
  },
  {
    id: "mkt-nearby-6",
    username: "Sam",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/sam.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/sam_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/sam_p1.jpg`,
    mediaType: "image",
    distance: "800 m",
    isVerified: false,
  },
  {
    id: "mkt-nearby-7",
    username: "Taylor",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/taylor.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/taylor_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/taylor_p1.jpg`,
    mediaType: "image",
    distance: "3.5 km",
    isVerified: true,
  },
  {
    id: "mkt-nearby-8",
    username: "Riley",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/riley.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/riley_p1.jpg`,
    posterSrc: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/gallery/riley_p1.jpg`,
    mediaType: "image",
    distance: "5.1 km",
    isVerified: false,
  },
];

export const FALLBACK_DROPS: DropUser[] = [
  {
    id: "mkt-drop-1",
    username: "Sasha",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/sasha.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/sasha_v1.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/sasha_v1_poster.jpg`,
    mediaType: "video",
    isVerified: true,
  },
  {
    id: "mkt-drop-2",
    username: "Sasha",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/sasha.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/sasha_v2.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/sasha_v2_poster.jpg`,
    mediaType: "video",
    isVerified: true,
  },
  {
    id: "mkt-drop-3",
    username: "Marcus",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/marcus.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/marcus_v1.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/marcus_v1_poster.jpg`,
    mediaType: "video",
    isVerified: false,
  },
  {
    id: "mkt-drop-4",
    username: "Marcus",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/marcus.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/marcus_v2.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/marcus_v2_poster.jpg`,
    mediaType: "video",
    isVerified: false,
  },
  {
    id: "mkt-drop-5",
    username: "Elena",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/elena.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/elena_v1.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/elena_v1_poster.jpg`,
    mediaType: "video",
    isVerified: true,
  },
  {
    id: "mkt-drop-6",
    username: "Elena",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/elena.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/elena_v2.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/elena_v2_poster.jpg`,
    mediaType: "video",
    isVerified: true,
  },
  {
    id: "mkt-drop-7",
    username: "Jordan",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/jordan.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/jordan_v1.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/jordan_v1_poster.jpg`,
    mediaType: "video",
    isVerified: false,
  },
  {
    id: "mkt-drop-8",
    username: "Alex",
    avatarUrl: `${CLOUDINARY_BASE}/image/upload/v1/bliss/marketing_content/profiles/alex.jpg`,
    mediaSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/alex_v1.mp4`,
    posterSrc: `${CLOUDINARY_BASE}/video/upload/v1/bliss/marketing_content/drops/alex_v1_poster.jpg`,
    mediaType: "video",
    isVerified: true,
  },
];