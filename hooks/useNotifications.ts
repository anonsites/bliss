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
    if (!user) {
      return;
    }

    const fetchUnreadCounts = async () => {
      const [{ count: totalCount }, { count: messageCount }] = await Promise.all([
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .neq("sender_id", user.id)
          .neq("status", "read"),
      ]);

      setUnreadCount(totalCount || 0);
      setHasUnreadMessages((messageCount || 0) > 0);
    };

    fetchUnreadCounts();

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
        () => fetchUnreadCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => fetchUnreadCounts(),
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