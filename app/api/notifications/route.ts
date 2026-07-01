import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/features/notifications/server";
import { formatRelativeTime } from "@/features/notifications/formatter";
import type { NotificationPayload, NotificationType } from "@/features/notifications/types";

type NotificationResponse = {
  error?: string;
  notifications?: Array<NotificationPayload & { timeLabel: string }>;
  success?: boolean;
};

/**
 * GET /api/notifications
 * Fetch notifications with optional filtering
 * Query params: 
 *   - type: notification type filter
 *   - isRead: filter by read status (true/false)
 *   - limit: results per page (default 50)
 *   - offset: pagination offset (default 0)
 *   - since: ISO timestamp to fetch events since (for real-time polling)
 */
export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<NotificationResponse>(
        { error: "You need to sign in again." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const typeParam = searchParams.get("type");
    const isReadParam = searchParams.get("isRead");

    const type = typeParam && (typeParam === "message" || typeParam === "nearby_user" || typeParam === "nearby_profiles" || typeParam === "nearby_drops" || typeParam === "wishlist_add" || typeParam === "profile_view" || typeParam === "drop_like" || typeParam === "drop_comment")
      ? typeParam as NotificationType
      : undefined;

    const notifications = await getUserNotifications(authenticatedUser.id, {
      type,
      isRead: isReadParam ? isReadParam === "true" : undefined,
      since: since || undefined,
      limit,
      offset,
    });

    const formattedNotifications = notifications.map((n) => ({
      ...n,
      timeLabel: formatRelativeTime(n.createdAt),
    }));

    return NextResponse.json<NotificationResponse>({
      notifications: formattedNotifications,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json<NotificationResponse>(
      { error: "Unable to fetch notifications." },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 * Body:
 *   - notificationId?: mark single notification as read
 *   - all?: true to mark all as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<NotificationResponse>(
        { error: "You need to sign in again." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as {
      notificationId?: string;
      all?: boolean;
    };

    if (payload.all) {
      const success = await markAllNotificationsAsRead(authenticatedUser.id);
      return NextResponse.json<NotificationResponse>({
        success,
      });
    }

    if (payload.notificationId) {
      const success = await markNotificationAsRead(
        payload.notificationId,
        authenticatedUser.id
      );
      return NextResponse.json<NotificationResponse>({
        success,
      });
    }

    return NextResponse.json<NotificationResponse>(
      { error: "No action specified." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json<NotificationResponse>(
      { error: "Unable to update notification." },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notifications
 * Body:
 *   - notificationId: delete single notification
 */
export async function DELETE(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<NotificationResponse>(
        { error: "You need to sign in again." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as {
      notificationId?: string;
    };

    if (!payload.notificationId) {
      return NextResponse.json<NotificationResponse>(
        { error: "Notification ID is required." },
        { status: 400 }
      );
    }

    const success = await deleteNotification(
      payload.notificationId,
      authenticatedUser.id
    );

    return NextResponse.json<NotificationResponse>({
      success,
    });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json<NotificationResponse>(
      { error: "Unable to delete notification." },
      { status: 400 }
    );
  }
}
