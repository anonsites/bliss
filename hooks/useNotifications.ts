"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";

export function useNotifications() {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCounts = async () => {
      // Fetch total unread notifications
      const { count: totalCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadCount(totalCount || 0);

      // Check for unread message-type notifications specifically
      const { count: messageCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .eq("type", "message");

      setHasUnreadMessages((messageCount || 0) > 0);
    };

    fetchUnreadCounts();

    // Subscribe to notification changes
    const channel = supabase
      .channel(`unread_counts_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  return {
    unreadCount,
    hasUnreadNotifications: unreadCount > 0,
    hasUnreadMessages,
  };
}