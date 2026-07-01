/**
 * Utility functions for creating different types of notifications
 * These are called from API routes or server functions
 */

import {
  createNotification,
  getDuplicateNotification,
} from "@/features/notifications/server";
import type { NotificationPayload } from "@/features/notifications/types";

/**
 * Create a "new message" notification
 */
export async function notifyNewMessage(
  userId: string,
  senderUsername: string,
  senderId: string,
  chatId: string,
  message: string
): Promise<NotificationPayload | null> {
  return createNotification(userId, {
    type: "message",
    category: "messaging",
    title: "New message",
    text: `${senderUsername} wants to chat up with you`,
    targetUsername: senderUsername,
    targetUserId: senderId,
    chatId,
    message, // This will now be saved in metadata via createNotification
    toastTitle: "New Message",
    toastMessage: `${senderUsername} sent you a message`,
  });
}

/**
 * Create a "user nearby" notification
 */
export async function notifyUserNearby(
  userId: string,
  nearbyUsername: string,
  nearbyUserId: string,
  avatarUrl?: string
): Promise<NotificationPayload | null> {
  // Check for duplicate within last 5 minutes
  const existing = await getDuplicateNotification(
    userId,
    "nearby_user",
    nearbyUserId
  );
  if (existing) return existing;

  return createNotification(userId, {
    type: "nearby_user",
    category: "discovery",
    title: "User nearby",
    text: `${nearbyUsername} is around your area, meet up with them`,
    targetUsername: nearbyUsername,
    targetUserId: nearbyUserId,
    targetAvatarUrl: avatarUrl,
    toastTitle: "User Nearby",
    toastMessage: `${nearbyUsername} is in your area!`,
  });
}

/**
 * Create a "hot profiles nearby" notification
 */
export async function notifyNearbyProfiles(
  userId: string,
  count: number
): Promise<NotificationPayload | null> {
  // Check for duplicate within last 5 minutes
  const existing = await getDuplicateNotification(userId, "nearby_profiles");
  if (existing) return existing;

  return createNotification(userId, {
    type: "nearby_profiles",
    category: "discovery",
    title: "Hot profiles nearby",
    text: `${count} hot profiles in your area, see who they are`,
    count,
    toastTitle: "Profiles Near You",
    toastMessage: `${count} hot profiles found in your area`,
  });
}

/**
 * Create a "drops nearby" notification
 */
export async function notifyNearbyDrops(
  userId: string,
  count: number
): Promise<NotificationPayload | null> {
  // Check for duplicate within last 5 minutes
  const existing = await getDuplicateNotification(userId, "nearby_drops");
  if (existing) return existing;

  return createNotification(userId, {
    type: "nearby_drops",
    category: "discovery",
    title: "New drops nearby",
    text: `${count} drops around your area`,
    count,
    toastTitle: "New Drops Nearby",
    toastMessage: `${count} new drops near you`,
  });
}

/**
 * Create an "added to wishlist" notification
 */
export async function notifyAddedToWishlist(
  userId: string,
  adderUsername: string,
  adderId: string,
  avatarUrl?: string
): Promise<NotificationPayload | null> {
  // Check for duplicate within last 5 minutes
  const existing = await getDuplicateNotification(
    userId,
    "wishlist_add",
    adderId
  );
  if (existing) return existing;

  return createNotification(userId, {
    type: "wishlist_add",
    category: "social",
    title: "Added to wishlist",
    text: `${adderUsername} added you to their wishlist`,
    targetUsername: adderUsername,
    targetUserId: adderId,
    targetAvatarUrl: avatarUrl,
    toastTitle: "Added to Wishlist",
    toastMessage: `${adderUsername} added you to their wishlist`,
  });
}
