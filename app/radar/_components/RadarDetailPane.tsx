"use client";

import { useRouter } from "next/navigation";
import styles from "./radar.module.css";
import { ActionButtons } from "@/components/ui/ActionButtons";
import { DetailPanePlaceholder, ProfilePlaceholderIcon } from "@/components/ui/PlaceholderIcons";
import { ProfileCard } from "@/components/ui/ProfileCard";
import type { HomeFeedProfile } from "@/features/discovery";

type RadarMode = "nearby" | "explore";

interface RadarDetailPaneProps {
  mode: RadarMode;
  profile: HomeFeedProfile | null;
  isLiked: boolean;
  onClose: () => void;
  onLike: () => void;
}

export function RadarDetailPane({
  mode,
  profile,
  isLiked,
  onClose,
  onLike,
}: RadarDetailPaneProps) {
  const router = useRouter();

  const handleMessage = async () => {
    if (!profile || mode === "explore") {
      return;
    }

    try {
      const response = await fetch("/api/chats", {
        body: JSON.stringify({ targetUserId: profile.userId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as { chatId?: string; error?: string };

      if (!response.ok || !payload.chatId) {
        return;
      }

      router.push(`/messages/${payload.chatId}`);
    } catch {
      // Keep the interaction silent
    }
  };

  if (!profile) {
    return (
      <div className={styles.radarDetailPane}>
        <DetailPanePlaceholder
          description="Photos and actions appear here."
          icon={<ProfilePlaceholderIcon />}
          title="Select a profile to view"
          tone="cyan"
        />
      </div>
    );
  }

  return (
    <div className={styles.radarDetailPane}>
      <ProfileCard locationLabel={profile.distance} profile={profile} phoneNumber={profile.phoneNumber}>
        <ActionButtons
          isDisabled={mode === "explore"}
          isLiked={isLiked}
          onGridClick={onClose}
          onLikeClick={onLike}
          onMessageClick={handleMessage}
        />
      </ProfileCard>
    </div>
  );
}
