/**
 * Comprehensive notification type system for all notification categories
 */

export type NotificationType =
  | "message"
  | "nearby_user"
  | "nearby_profiles"
  | "nearby_drops"
  | "wishlist_add"
  | "profile_view"
  | "drop_like"
  | "drop_comment";

export type NotificationCategory =
  | "messaging"
  | "discovery"
  | "social"
  | "engagement";

export interface NotificationPayload {
  // Common fields
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  createdAt: string;
  isRead: boolean;

  // Message notification specific
  chatId?: string;
  message?: string;
  messageCount?: number;

  // User/proximity specific
  targetUserId?: string;
  targetUsername?: string;
  targetAvatarUrl?: string;

  // Count-based notifications
  count?: number;
  profilesCount?: number;
  dropsCount?: number;

  // Generic text for display
  title: string;
  text: string;
  description?: string;
  
  // For toast display
  toastTitle?: string;
  toastMessage?: string;

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Simplified notification for display (without internal fields)
 */
export interface DisplayNotification {
  id: string;
  title: string;
  text: string;
  type: NotificationType;
  category: NotificationCategory;
  createdAt: string;
  timeLabel: string;
  isRead: boolean;
  avatar?: string;
  actionUrl?: string;
}

/**
 * Notification preference settings
 */
export interface NotificationPreferences {
  messaging: boolean;
  discovery: boolean;
  social: boolean;
  engagement: boolean;
  pushNotifications: boolean;
}

/**
 * Notification filter options
 */
export interface NotificationFilter {
  type?: NotificationType;
  category?: NotificationCategory;
  isRead?: boolean;
  since?: string;
  limit?: number;
  offset?: number;
}
