"use client";

import { useEffect, useState } from "react";
import styles from "@/app/profile/_components/profile.module.css";
import {
  MessageSquare,
  MapPin,
  Users,
  Camera,
  Heart,
  Eye,
  MessageCircle,
  Bell,
  Check,
  LucideIcon,
} from "lucide-react";
import {
  formatNotification,
  getNotificationIcon,
  getNotificationActionUrl,
  formatRelativeTime,
  getNotificationStyleClass,
} from "@/features/notifications/formatter";
import type { NotificationPayload } from "@/features/notifications/types";

const IconMap: Record<string, LucideIcon> = {
  "message-square": MessageSquare,
  "map-pin": MapPin,
  "users": Users,
  "camera": Camera,
  "heart": Heart,
  "eye": Eye,
  "message-circle": MessageCircle,
  "bell": Bell,
};

type NotificationsActionResponse = {
  error?: string;
  success?: true;
};

type NotificationsProps = {
  notifications: (NotificationPayload & { timeLabel: string })[];
  onNotificationsChange: (
    notifications: (NotificationPayload & { timeLabel: string })[]
  ) => void;
};

export function NotificationsEnhanced({
  notifications,
  onNotificationsChange,
}: NotificationsProps) {
  const [items, setItems] = useState(notifications);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [pendingDismissId, setPendingDismissId] = useState<string | null>(null);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const handleMarkAllRead = async () => {
    if (items.length === 0 || items.every((item) => item.isRead)) {
      return;
    }

    const previousItems = items;
    const nextItems = items.map((item) => ({
      ...item,
      isRead: true,
    }));

    setError(null);
    setIsMarkingAllRead(true);
    setItems(nextItems);
    onNotificationsChange(nextItems);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ all: true }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const payload = (await response.json()) as NotificationsActionResponse;

      if (!response.ok) {
        setItems(previousItems);
        onNotificationsChange(previousItems);
        setError(payload.error ?? "Unable to mark notifications as read.");
      }
    } catch {
      setItems(previousItems);
      onNotificationsChange(previousItems);
      setError("Unable to mark notifications as read right now.");
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    const previousItems = items;
    const nextItems = items.filter((item) => item.id !== notificationId);

    setError(null);
    setPendingDismissId(notificationId);
    setItems(nextItems);
    onNotificationsChange(nextItems);

    try {
      const response = await fetch("/api/notifications", {
        body: JSON.stringify({ notificationId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });
      const payload = (await response.json()) as NotificationsActionResponse;

      if (!response.ok) {
        setItems(previousItems);
        onNotificationsChange(previousItems);
        setError(payload.error ?? "Unable to dismiss that notification.");
      }
    } catch {
      setItems(previousItems);
      onNotificationsChange(previousItems);
      setError("Unable to dismiss that notification right now.");
    } finally {
      setPendingDismissId(null);
    }
  };

  const handleNotificationClick = (notification: NotificationPayload) => {
    const actionUrl = getNotificationActionUrl(notification);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={styles.sectionHeading}>
        <h2 className="text-xl font-bold text-white">Notifications</h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 items-center justify-end px-1">
        <button
          className={styles.markAllReadButton}
          disabled={
            isMarkingAllRead ||
            items.length === 0 ||
            items.every((item) => item.isRead)
          }
          onClick={() => void handleMarkAllRead()}
          type="button"
        >
          <Check size={14} />
          <span>Mark all as read</span>
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="mt-2 flex flex-col gap-3">
        {items.map((notification) => {
          const formatted = formatNotification(notification);
          const actionUrl = getNotificationActionUrl(notification);
          const icon = getNotificationIcon(notification.type);
          const styleClass = getNotificationStyleClass(notification.type);
          const IconComponent = IconMap[icon] || Bell;

          return (
            <div
              key={notification.id}
              className={`${styles.notificationItem} border border-white/10 rounded-xl overflow-hidden ${
                notification.isRead
                  ? styles.notificationRead
                  : styles.notificationUnread
              } ${
                pendingDismissId === notification.id ? "opacity-50" : ""
              } cursor-pointer hover:bg-white/5 transition-colors`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3 flex-1">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${styleClass} flex-shrink-0`}>
                  <IconComponent 
                    size={18} 
                    className={notification.isRead ? "opacity-40" : "opacity-100"} 
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-black tracking-[0.15em] text-gray-500">
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-gray-600 font-medium italic">
                      {notification.timeLabel}
                    </span>
                  </div>
                  
                  <p
                    className={`text-[15px] leading-snug ${
                      notification.isRead
                        ? "text-gray-500"
                        : "text-cyan-400 font-bold"
                    }`}
                  >
                    {formatted.title}
                  </p>

                  {formatted.text && (
                    <p
                      className={`text-sm mt-1 leading-normal ${
                        notification.isRead
                          ? "text-gray-600"
                          : "text-gray-300"
                      }`}
                    >
                      {formatted.text}
                    </p>
                  )}
                </div>
              </div>

              {!notification.isRead ? (
                <button
                  aria-label="Dismiss"
                  className="text-gray-500 hover:text-white disabled:text-gray-700 flex-shrink-0 ml-2"
                  disabled={pendingDismissId === notification.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDismiss(notification.id);
                  }}
                  type="button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          );
        })}

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p className="text-gray-400 text-center py-8">
              No notifications yet.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
