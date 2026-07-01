/**
 * Radar and Discovery notification triggers
 * These are called to notify users about nearby content
 * Typically called by background jobs or periodic checks
 */

import { getRadarFeedForUser } from "@/features/discovery/radar-feed";
import {
  notifyNearbyProfiles,
  notifyNearbyDrops,
} from "@/features/notifications";
import { getInsiderDropsFeed } from "@/features/discovery/drops-feed";

/**
 * Notify a user about nearby users/profiles
 * This should be called periodically or when checking the radar
 */
export async function notifyAboutNearbyProfiles(userId: string) {
  try {
    const radarResult = await getRadarFeedForUser(userId);

    if (radarResult.error || radarResult.profiles.length === 0) {
      return;
    }

    // Notify about hot profiles nearby (if count is significant)
    if (radarResult.profiles.length >= 3) {
      await notifyNearbyProfiles(userId, radarResult.profiles.length);
    }
  } catch (error) {
    console.error("Error notifying about nearby profiles:", error);
  }
}

/**
 * Notify a user about new drops nearby
 * This should be called periodically to notify about new drops
 */
export async function notifyAboutNearbyDrops(userId: string) {
  try {
    const { drops, error } = await getInsiderDropsFeed(30);

    if (error || !drops || drops.length === 0) {
      return;
    }

    // Notify about nearby drops (if count is significant)
    if (drops.length >= 3) {
      await notifyNearbyDrops(userId, drops.length);
    }
  } catch (error) {
    console.error("Error notifying about nearby drops:", error);
  }
}

/**
 * Check and notify about all discovery content
 * This is a combined check for all nearby notifications
 * Call this periodically to keep users updated about new content
 */
export async function checkAndNotifyAboutDiscoveryContent(userId: string) {
  await Promise.all([
    notifyAboutNearbyProfiles(userId),
    notifyAboutNearbyDrops(userId),
  ]);
}
