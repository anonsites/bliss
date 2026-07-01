import type { NotificationType, NotificationPayload } from "./types";

/**
 * Formats notification data into user-friendly title and text
 */
export function formatNotification(notification: Partial<NotificationPayload>) {
  const { type, targetUsername, count } = notification;

  switch (type) {
    case "message":
      return {
        title: "New message",
        text: `${targetUsername || "Someone"} wants to chat up with you`,
        toastTitle: "New Message",
        toastMessage: `${targetUsername || "Someone"} sent you a message`,
      };

    case "nearby_user":
      return {
        title: "Radar",
        text: `${targetUsername || "A user"} is around your area, meet up with them`,
        toastTitle: "Radar",
        toastMessage: `${targetUsername} is in your area!`,
      };

    case "nearby_profiles":
      return {
        title: "Hot profiles nearby",
        text: `${count || 5} hot profiles in your area, see who they are`,
        toastTitle: "Profiles Near You",
        toastMessage: `${count || 5} hot profiles found in your area`,
      };

    case "nearby_drops":
      return {
        title: "New drops nearby",
        text: `${count || 5} drops around your area`,
        toastTitle: "New Drops Nearby",
        toastMessage: `${count || 5} new drops near you`,
      };

    case "wishlist_add":
      return {
        title: "They Like you",
        text: `${targetUsername || "Someone"} added you to their wishlist`,
        toastTitle: "They Like You",
        toastMessage: `${targetUsername} added you to their wishlist`,
      };

    case "profile_view":
      return {
        title: "More views",
        text: `${targetUsername || "Someone"} viewed your profile`,
        toastTitle: "More Views",
        toastMessage: `${targetUsername} checked out your profile`,
      };

    case "drop_like":
      return {
        title: "New like",
        text: `${targetUsername || "Someone"} liked your drop`,
        toastTitle: "New Liked",
        toastMessage: `${targetUsername} liked your drop`,
      };

    case "drop_comment":
      return {
        title: "Drop comment",
        text: `${targetUsername || "Someone"} commented on your drop`,
        toastTitle: "New Comment",
        toastMessage: `${targetUsername} commented on your drop`,
      };

    default:
      return {
        title: "Notification",
        text: "You have a new notification",
        toastTitle: "Notification",
        toastMessage: "You have a new notification",
      };
  }
}

/**
 * Get emoji icon for notification type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    message: "message-square",
    nearby_user: "map-pin",
    nearby_profiles: "users",
    nearby_drops: "camera",
    wishlist_add: "heart",
    profile_view: "eye",
    drop_like: "heart",
    drop_comment: "message-circle",
  };
  return icons[type] || "bell";
}

/**
 * Get color/style class for notification type
 */
export function getNotificationStyleClass(type: NotificationType): string {
  const styles: Record<NotificationType, string> = {
    message: "bg-blue-500/20 border-blue-500/50",
    nearby_user: "bg-orange-500/20 border-orange-500/50",
    nearby_profiles: "bg-pink-500/20 border-pink-500/50",
    nearby_drops: "bg-purple-500/20 border-purple-500/50",
    wishlist_add: "bg-red-500/20 border-red-500/50",
    profile_view: "bg-yellow-500/20 border-yellow-500/50",
    drop_like: "bg-red-500/20 border-red-500/50",
    drop_comment: "bg-blue-500/20 border-blue-500/50",
  };
  return styles[type] || "bg-gray-500/20 border-gray-500/50";
}

export function getNotificationActionPath(
  notification: Partial<NotificationPayload>
): string | undefined {
  const { type, chatId, targetUserId } = notification;

  switch (type) {
    case "message":
      return chatId ? `/messages/${chatId}` : "/messages";

    case "nearby_user":
      return "/radar";

    case "profile_view":
      return targetUserId ? `/profile/${targetUserId}` : "/radar";

    case "nearby_profiles":
    case "nearby_drops":
      return "/radar";

    case "wishlist_add":
    case "drop_like":
    case "drop_comment":
      return targetUserId ? `/profile/${targetUserId}` : "/drops";

    default:
      return undefined;
  }
}

/**
 * Get action URL for notification type
 */
export function getNotificationActionUrl(
  notification: Partial<NotificationPayload>
): string | undefined {
  return getNotificationActionPath(notification);
}

/**
 * Format relative time for notification display
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}
