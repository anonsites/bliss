// Types
export type {
  NotificationType,
  NotificationCategory,
  NotificationPayload,
  DisplayNotification,
  NotificationPreferences,
  NotificationFilter,
} from "./types";

// Server utilities
export {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadNotificationCount,
  getDuplicateNotification,
} from "./server";

// Formatters & UI helpers
export {
  formatNotification,
  getNotificationIcon,
  getNotificationStyleClass,
  getNotificationActionUrl,
  formatRelativeTime,
} from "./formatter";

// Notification triggers (for creating notifications)
export {
  notifyNewMessage,
  notifyUserNearby,
  notifyNearbyProfiles,
  notifyNearbyDrops,
  notifyAddedToWishlist,
} from "./triggers";
