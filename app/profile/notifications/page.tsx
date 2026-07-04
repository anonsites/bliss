"use client";

import { useState, useEffect } from "react";
import { ProfilePageWithBack } from "../_components/ProfilePageWithBack";
import { NotificationsEnhanced } from "@/components/notifications/NotificationsEnhanced";
import type { NotificationPayload } from "@/features/notifications/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Array<NotificationPayload & { timeLabel: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/notifications?limit=50");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <ProfilePageWithBack title="Notifications">
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading notifications...</div>
      ) : (
        <NotificationsEnhanced
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />
      )}
    </ProfilePageWithBack>
  );
}
