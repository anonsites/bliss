"use client";

import Image from "next/image";
import {
  getPrimaryMediaThumbnail,
  type HomeFeedProfile,
} from "@/features/discovery";
import { VerifiedBadge } from "./VerifiedBadge";

interface ProfileGridCardProps {
  onProfileClick: (profile: HomeFeedProfile) => void;
  profiles: HomeFeedProfile[];
  variant?: "preview" | "shell";
}

function chunkProfiles(profiles: HomeFeedProfile[], size: number) {
  const pages: HomeFeedProfile[][] = [];

  for (let index = 0; index < profiles.length; index += size) {
    pages.push(profiles.slice(index, index + size));
  }

  return pages;
}

function ProfileGridTile({
  profile,
  onClick,
  tileKey,
}: {
  profile: HomeFeedProfile;
  onClick: () => void;
  tileKey: string;
}) {
  const isOnline = profile.activityStatus.trim().toLowerCase() === "online";

  return (
    <button
      type="button"
      className="profile-grid-card__tile"
      key={tileKey}
      onClick={onClick}
      style={{
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        display: "block",
        position: "relative",
        border: "none",
        background: "none",
        padding: 0,
        aspectRatio: "3 / 4",
      }}
    >
      <div className="profile-grid-card__media">
        <Image
          src={getPrimaryMediaThumbnail(profile)}
          alt={profile.username}
          fill
          sizes="(max-width: 1023px) 50vw, 22vw"
        />
      </div>

      <div className="profile-grid-card__scrim" />

      <div className="profile-grid-card__meta">
        <div className="profile-grid-card__identity flex items-center min-w-0 gap-1">
          <h3 className="truncate flex-1">{profile.username}</h3>
          {profile.isVerified ? <VerifiedBadge className="flex-shrink-0 h-3.5 w-3.5" /> : null}
        </div>

        <p className={isOnline ? "activity-status activity-status--online" : "activity-status"}>
          {isOnline ? <span aria-hidden="true" className="activity-status__dot" /> : null}
          {profile.activityStatus}
        </p>
      </div>
    </button>
  );
}

export function ProfileGridCard({
  onProfileClick,
  profiles,
  variant = "preview",
}: ProfileGridCardProps) {
  const desktopPages = chunkProfiles(profiles, 4);
  const rootClassName =
    variant === "shell" ? "profile-grid-card profile-grid-card--shell" : "profile-grid-card";

  return (
    <section className={rootClassName}>
      <div className="profile-grid-card__desktop">
        {desktopPages.map((page, pageIndex) => (
          <div className="profile-grid-card__page" key={`page-${pageIndex}`}>
            {page.map((profile) => (
              <ProfileGridTile
                key={`desktop-${profile.id}`}
                onClick={() => onProfileClick(profile)}
                profile={profile}
                tileKey={`desktop-${profile.id}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="profile-grid-card__mobile">
        {profiles.map((profile) => (
          <ProfileGridTile
            key={`mobile-${profile.id}`}
            onClick={() => onProfileClick(profile)}
            profile={profile}
            tileKey={`mobile-${profile.id}`}
          />
        ))}
      </div>
    </section>
  );
}
