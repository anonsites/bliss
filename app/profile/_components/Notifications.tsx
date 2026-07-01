"use client";

import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import type { ProfileNotificationData } from "@/features/profile/models";

type NotificationsActionResponse = {
  error?: string;
  ok?: true;
};

type NotificationsProps = {
  notifications: ProfileNotificationData[];
  onNotificationsChange: (notifications: ProfileNotificationData[]) => void;
};

export function Notifications({ notifications, onNotificationsChange }: NotificationsProps) {
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
    const nextItems = items.map((item) => ({ ...item, isRead: true }));

    setError(null);
    setIsMarkingAllRead(true);
    setItems(nextItems);
    onNotificationsChange(nextItems);

    try {
      const response = await fetch("/api/profile/notifications", {
        method: "PATCH",
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
      const response = await fetch("/api/profile/notifications", {
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

  return (
    <div className="flex flex-col h-full">
      <div className={styles.sectionHeading}>
        <h2 className="text-xl font-bold text-white">Notifications</h2>
      </div>

      <div className="mb-8 flex justify-end">
        <button
          className={styles.markAllReadButton}
          disabled={isMarkingAllRead || items.length === 0 || items.every((item) => item.isRead)}
          onClick={() => void handleMarkAllRead()}
          type="button"
          title="Mark all as read"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="space-y-1">
        {items.map((notification) => (
          <div
            key={notification.id}
            className={`${styles.notificationItem} ${
              notification.isRead ? styles.notificationRead : styles.notificationUnread
            } ${pendingDismissId === notification.id ? "opacity-50" : ""}`}
          >
            <div className="flex gap-3">
              <div className={notification.isRead ? "mt-1.5 h-2 w-2" : styles.unreadDot} />
              <div>
                <p className={`text-sm ${notification.isRead ? "text-gray-400" : "text-white"}`}>{notification.text}</p>
                <p className="mt-1 text-xs text-gray-600">{notification.timeLabel}</p>
              </div>
            </div>
            
            {!notification.isRead ? (
                <button
                  aria-label="Dismiss"
                  className="text-gray-500 hover:text-white disabled:text-gray-700"
                  disabled={pendingDismissId === notification.id}
                  onClick={() => void handleDismiss(notification.id)}
                  type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            ) : null}
          </div>
        ))}

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No notifications yet.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
