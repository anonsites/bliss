"use client";

import { useRouter } from "next/navigation";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { ActionButtons } from "@/components/ui/ActionButtons";
import { DetailPanePlaceholder, ProfilePlaceholderIcon } from "@/components/ui/PlaceholderIcons";
import type { WishlistProfile } from "@/features/wishlist/server";

interface WishlistDetailPaneProps {
  profile: WishlistProfile | null;
  isLiked: boolean;
  onClose: () => void;
  onLike: () => void;
}

function getLocationLabel(profile: WishlistProfile) {
  return profile.locationLabel || profile.distance;
}

export function WishlistDetailPane({
  profile,
  isLiked,
  onClose,
  onLike,
}: WishlistDetailPaneProps) {
  const router = useRouter();

  const handleMessage = async () => {
    if (!profile) {
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

      if (response.ok) {
        router.push("/messages");
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  if (!profile) {
    return (
      <DetailPanePlaceholder
        description="Photos and actions appear here."
        icon={<ProfilePlaceholderIcon />}
        title="Select a profile to view"
        tone="cyan"
      />
    );
  }

  return (
    <ProfileCard locationLabel={getLocationLabel(profile)} profile={profile} phoneNumber={profile.phoneNumber}>
      <ActionButtons
        isDisabled={false}
        isLiked={isLiked}
        onGridClick={onClose}
        onLikeClick={onLike}
        onMessageClick={handleMessage}
      />
    </ProfileCard>
  );
}
