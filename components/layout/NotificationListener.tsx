"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/lib/toast-context";
import { usePathname } from "next/navigation";
import { formatNotification } from "@/features/notifications/formatter";
import type { NotificationPayload } from "@/features/notifications/types";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

type NotificationsResponse = {
  error?: string;
  notifications?: Array<NotificationPayload & { timeLabel: string }>;
};

export function NotificationListener() {
  const { addToast } = useToast();
  const pathname = usePathname();
  const cursorRef = useRef(new Date().toISOString());
  const seenNotificationIdsRef = useRef(new Set<string>());
  const pathnameRef = useRef(pathname);

  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const currentUserId = user?.id;

  const suppressToastForCurrentContext = useCallback((notificationType: NotificationPayload["type"]) => {
    const currentPathname = pathnameRef.current;
    const isOnMessagesPage = currentPathname.startsWith("/messages");
    const isOnRadarPage = currentPathname.startsWith("/radar");

    const isRedundantMessage = notificationType === "message" && isOnMessagesPage;
    const isRedundantRadar = (
      notificationType === "nearby_user" ||
      notificationType === "nearby_profiles" ||
      notificationType === "nearby_drops"
    ) && isOnRadarPage;

    return isRedundantMessage || isRedundantRadar;
  }, []);

  const processNotification = useCallback(
    (notification: NotificationPayload) => {
      if (notification.isRead || seenNotificationIdsRef.current.has(notification.id)) {
        return false;
      }

      seenNotificationIdsRef.current.add(notification.id);

      if (!suppressToastForCurrentContext(notification.type)) {
        const formatted = formatNotification(notification);
        addToast({
          duration: 5500,
          title: formatted.toastTitle,
          message: formatted.toastMessage,
          type: "info",
        });
      }

      cursorRef.current = notification.createdAt;
      return true;
    },
    [addToast, suppressToastForCurrentContext],
  );

  const poll = useCallback(async () => {
    if (!currentUserId || document.visibilityState === "hidden") {
      return;
    }

    try {
      const response = await fetch(
        `/api/notifications?since=${encodeURIComponent(cursorRef.current)}&limit=50`,
        {
          cache: "no-store",
          method: "GET",
        },
      );

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as NotificationsResponse;

      if (payload.error) {
        return;
      }

      for (const notification of payload.notifications ?? []) {
        processNotification(notification);
      }
    } catch {
      // Ignore polling failures to avoid spamming the console.
    }
  }, [currentUserId, processNotification]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let isMounted = true;

    void poll();

    const handleActivity = () => {
      if (document.visibilityState !== "hidden") {
        void poll();
      }
    };

    window.addEventListener("focus", handleActivity);
    document.addEventListener("visibilitychange", handleActivity);

    const channel = supabase
      .channel(`notifications_for_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (!isMounted) {
            return;
          }

          const newNotification = payload.new as NotificationPayload;
          processNotification(newNotification);
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleActivity);
      document.removeEventListener("visibilitychange", handleActivity);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, poll, supabase, processNotification]);

  return null;
}
