import "server-only";

import { requestSupabaseRest, querySupabaseRest } from "@/lib/supabase";
import type { NotificationPayload, NotificationType, NotificationFilter } from "./types";

/**
 * Helper type for database row
 */
type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  chat_id: string | null;
  target_user_id: string | null;
  target_username: string | null;
  target_avatar_url: string | null;
  count: number | null;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

/**
 * Create a notification in the database
 */
export async function createNotification(
  userId: string,
  payload: Omit<NotificationPayload, "id" | "createdAt" | "isRead" | "userId">
): Promise<NotificationPayload | null> {
  // Ensure specific fields like 'message' are included in metadata if not already there
  const metadata = {
    ...(payload.metadata || {}),
    ...(payload.message ? { message: payload.message } : {}),
    ...(payload.messageCount ? { messageCount: payload.messageCount } : {}),
    ...(payload.description ? { description: payload.description } : {}),
  };

  try {
    const response = await requestSupabaseRest<NotificationRow[]>("notifications", {
      body: {
        user_id: userId,
        type: payload.type,
        title: payload.title,
        content: payload.text,
        chat_id: payload.chatId || null,
        target_user_id: payload.targetUserId || null,
        target_username: payload.targetUsername || null,
        target_avatar_url: payload.targetAvatarUrl || null,
        count: payload.count || null,
        is_read: false,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      },
      headers: {
        Prefer: "return=representation",
      },
      method: "POST",
    });

    const row = response[0];
    if (!row) return null;

    return mapRowToPayload(row);
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Get notifications for a user with optional filtering
 */
export async function getUserNotifications(
  userId: string,
  filter: NotificationFilter = {}
): Promise<NotificationPayload[]> {
  try {
    const searchParams = new URLSearchParams({
      user_id: `eq.${userId}`,
      order: "created_at.desc",
      limit: String(filter.limit || 50),
      offset: String(filter.offset || 0),
    });

    if (filter.type) {
      searchParams.set("type", `eq.${filter.type}`);
    }

    if (filter.isRead !== undefined) {
      searchParams.set("is_read", `eq.${filter.isRead}`);
    }

    if (filter.since) {
      searchParams.set("created_at", `gt.${encodeURIComponent(filter.since)}`);
    }

    const rows = await querySupabaseRest<NotificationRow[]>(
      "notifications",
      searchParams
    );

    return rows.map(mapRowToPayload);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await requestSupabaseRest("notifications", {
      body: { is_read: true },
      method: "PATCH",
      searchParams: new URLSearchParams({
        id: `eq.${notificationId}`,
        user_id: `eq.${userId}`,
      }),
      headers: {
        Prefer: "return=minimal",
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    await requestSupabaseRest("notifications", {
      body: { is_read: true },
      method: "PATCH",
      searchParams: new URLSearchParams({
        user_id: `eq.${userId}`,
        is_read: "eq.false",
      }),
      headers: {
        Prefer: "return=minimal",
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return false;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await requestSupabaseRest("notifications", {
      method: "DELETE",
      searchParams: new URLSearchParams({
        id: `eq.${notificationId}`,
        user_id: `eq.${userId}`,
      }),
      headers: {
        Prefer: "return=minimal",
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return false;
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    await requestSupabaseRest("notifications", {
      method: "DELETE",
      searchParams: new URLSearchParams({
        user_id: `eq.${userId}`,
      }),
      headers: {
        Prefer: "return=minimal",
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to delete all notifications:", error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const rows = await querySupabaseRest<{ count?: number }[]>(
      "notifications",
      new URLSearchParams({
        user_id: `eq.${userId}`,
        is_read: "eq.false",
        select: "count",
      })
    );
    return rows[0]?.count || 0;
  } catch (error) {
    console.error("Failed to get unread notification count:", error);
    return 0;
  }
}

/**
 * Check if a duplicate notification already exists
 * (prevents duplicate notifications for same event)
 */
export async function getDuplicateNotification(
  userId: string,
  type: NotificationType,
  targetUserId?: string
): Promise<NotificationPayload | null> {
  try {
    const searchParams = new URLSearchParams({
      user_id: `eq.${userId}`,
      type: `eq.${type}`,
      is_read: "eq.false",
      order: "created_at.desc",
      limit: "1",
    });

    if (targetUserId) {
      searchParams.set("target_user_id", `eq.${targetUserId}`);
    }

    const rows = await querySupabaseRest<NotificationRow[]>(
      "notifications",
      searchParams
    );

    if (!rows[0]) return null;

    // Check if it's within last 5 minutes (300s)
    const createdTime = new Date(rows[0].created_at).getTime();
    const now = new Date().getTime();
    const diffSeconds = (now - createdTime) / 1000;

    if (diffSeconds < 300) {
      return mapRowToPayload(rows[0]);
    }

    return null;
  } catch (error) {
    console.error("Failed to check duplicate notification:", error);
    return null;
  }
}

/**
 * Map database row to notification payload
 */
function mapRowToPayload(row: NotificationRow): NotificationPayload {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    category: getCategoryFromType(row.type),
    createdAt: row.created_at,
    isRead: row.is_read,
    title: row.title,
    text: row.content,
    chatId: row.chat_id || undefined,
    targetUserId: row.target_user_id || undefined,
    targetUsername: row.target_username || undefined,
    targetAvatarUrl: row.target_avatar_url || undefined,
    count: row.count || undefined,
    metadata: row.metadata || undefined,
  };
}

/**
 * Get notification category from type
 */
function getCategoryFromType(type: NotificationType): "messaging" | "discovery" | "social" | "engagement" {
  switch (type) {
    case "message":
      return "messaging";
    case "nearby_user":
    case "nearby_profiles":
    case "nearby_drops":
      return "discovery";
    case "wishlist_add":
    case "profile_view":
      return "social";
    case "drop_like":
    case "drop_comment":
      return "engagement";
    default:
      return "engagement";
  }
}
