"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPrimaryMediaThumbnail } from "@/features/discovery";
import { ErrorAlert } from "@/components/alerts/ErrorAlert";
import { RadarWishlistSwitch } from "@/app/radar/_components/RadarPageButtons";
import { WishlistDetailPane } from "./WishlistDetailPane";
import type { WishlistProfile } from "@/features/wishlist/server";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { WishlistPlaceholderIcon } from "@/components/ui/PlaceholderIcons";
import styles from "./radar.module.css";


interface WishlistPageClientProps {
  initialError?: string | null;
  profiles: WishlistProfile[];
}

function toggleProfileId(previous: Set<string>, profileId: string) {
  const next = new Set(previous);

  if (next.has(profileId)) {
    next.delete(profileId);
    return next;
  }

  next.add(profileId);
  return next;
}

export function WishlistPageClient({
  initialError,
  profiles,
}: WishlistPageClientProps) {
  const [selectedProfile, setSelectedProfile] = useState<WishlistProfile | null>(null);
  const [likedProfileIds, setLikedProfileIds] = useState<Set<string>>(() => {
    return new Set(profiles.map((p) => p.id));
  });

  const handleBackToGrid = () => {
    setSelectedProfile(null);
  };

  const handleLikeClick = async () => {
    if (!selectedProfile) return;

    try {
      setLikedProfileIds((prev) => toggleProfileId(prev, selectedProfile.id));

      await fetch("/api/wishlist", {
        body: JSON.stringify({ targetUserId: selectedProfile.userId }),
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to update wishlist", error);
    }
  };

  const secondaryPane = (
    <>
      <header className={styles.wishlistHeader}>
        <h1 className={styles.wishlistTitle}>Wishlist</h1>
        <RadarWishlistSwitch currentPage="wishlist" fixed={false} showLabel={false} />
      </header>

      {initialError && (
        <div className="pane-shell__notice">
          <ErrorAlert onClose={() => { /* no-op as initialError can't be dismissed from here */ }}>
            {initialError}
          </ErrorAlert>
        </div>
      )}

      <section className="pane-shell__body pane-shell__body--list min-h-0 flex-1 overflow-y-auto">
        {profiles.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <WishlistPlaceholderIcon className="mb-8 h-20 w-20 text-white" />
            <h2 className="text-xl font-bold text-white">Your wishlist is empty</h2>
            <Link
              href="/radar"
              className={styles.wishlistDiscoverButton}
            >
              Discover
            </Link>
            {initialError && (
              <ErrorAlert className="mt-6" title="Error loading wishlist">
                {initialError}
              </ErrorAlert>
            )}
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-20 pb-24">
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-3">
              {profiles.map((profile) => {
                const isOnline = profile.activityStatus?.trim().toLowerCase() === "online";

                return (
                  <button
                    className="group flex flex-col items-center text-center"
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    type="button"
                  >
                  <div className="relative h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36">
                    <Image
                      alt={profile.username}
                      className="rounded-full object-cover ring-1 ring-white/10 transition duration-200 group-hover:scale-[1.03] group-hover:ring-highlight/40"
                      fill
                      sizes="(max-width: 768px) 112px, 144px"
                      src={getPrimaryMediaThumbnail(profile)}
                    />
                    {isOnline && (
                      <span
                        aria-label={profile.activityStatus}
                        className="absolute bottom-2 right-2 inline-flex h-4 w-4 rounded-full border-2 border-slate-950 ring-1 ring-black/20 bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,0.16)]"
                        title={profile.activityStatus}
                      />
                    )}
                  </div>

                  <div className="mt-3 flex flex-col items-center gap-1">
                    <span className="text-sm font-semibold text-white">{profile.username}</span>
                    {profile.isVerified ? (
                      <VerifiedBadge className="h-3.5 w-3.5 text-blue-400" />
                    ) : null}
                  </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );

  const detailPane = (
    <WishlistDetailPane
      profile={selectedProfile}
      isLiked={selectedProfile ? likedProfileIds.has(selectedProfile.id) : false}
      onClose={handleBackToGrid}
      onLike={handleLikeClick}
    />
  );

  return (
    <>
      <div className="flex min-h-[calc(100dvh-92px-env(safe-area-inset-bottom))] w-full lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[1fr_360px] gap-0">
        {/* Secondary Pane: Profile Grid - Full width on mobile, left side on desktop */}
        <section className="flex flex-col min-h-0 min-w-0 flex-1 lg:flex-none lg:border-r lg:border-white/8 lg:bg-[linear-gradient(180deg,rgba(14,17,24,0.94),rgba(8,10,14,0.98))] overflow-hidden">
          {secondaryPane}
        </section>

        {/* Detail Pane: Profile View - Hidden on mobile, side column on desktop */}
        <section className="hidden lg:flex h-full flex-col min-h-0 min-w-0 bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(5,7,10,1))] overflow-hidden">
          {detailPane}
        </section>

        {/* Mobile Detail Pane: Full-screen overlay on mobile when profile selected */}
        {selectedProfile && (
          <div className="fixed lg:hidden inset-0 z-50 flex flex-col min-h-0 min-w-0 bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(5,7,10,1))] overflow-hidden">
            {detailPane}
          </div>
        )}
      </div>
    </>
  );
}
