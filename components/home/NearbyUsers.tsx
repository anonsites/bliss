import Image from "next/image";
import { LocationPlaceholderIcon } from "@/components/ui/PlaceholderIcons";
import styles from "./home.module.css";
import { VerifiedBadge } from "../ui/VerifiedBadge";

export type NearbyUser = {
  id: string;
  mediaType: "video" | "image";
  avatarUrl: string;
  posterSrc: string;
  mediaSrc: string;
  username: string;
  distance: string;
  isVerified?: boolean;
};

export interface NearbyUsersLocation {
  city: string | null;
  region: string | null;
  country: string | null;
}

interface NearbyUsersProps {
  users: NearbyUser[];
  location?: NearbyUsersLocation;
  onUserClick?: () => void;
}

export function NearbyUsers({ users, location, onUserClick }: NearbyUsersProps) {
  const getLocationName = () => {
    if (!location) return "Nearby";
    return location.city || location.region || location.country || "Nearby";
  };

  const locationName = getLocationName();

  return (
    <section className={styles['nearby-users']} aria-label="Nearby Users">
      <header className={styles['section-heading']}>
        <h2 className={styles['section-title']}>HOT PROFILES</h2>
        <p className={styles['section-location']}>
          <span aria-hidden="true" className={styles['section-location__icon']}>
            <LocationPlaceholderIcon />
          </span>
          <span>{locationName}</span>
        </p>
      </header>
      <div className={styles['nearby-grid']}>
        {users.map((user) => (
          <article
            className={styles['nearby-card']}
            key={user.id}
            onClick={onUserClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onUserClick?.();
              }
            }}
            role="button"
            tabIndex={0}
            style={{ position: 'relative', aspectRatio: '3/4' }}
          >
            {user.mediaType === "video" ? (
            <video
              autoPlay
              className={styles['nearby-card__image']}
              loop
              muted
              playsInline
              poster={user.posterSrc}
              preload="metadata"
            >
              <source src={user.mediaSrc} type="video/mp4" />
            </video>
          ) : (
            <Image
              alt={user.username}
              className={styles['nearby-card__image']}
              fill
              sizes="(min-width: 1280px) 11vw, (min-width: 1024px) 14vw, 44vw"
              src={user.mediaSrc}
            />
          )}
            <div className={styles['nearby-card__info']}>
              <div className={`${styles['nearby-card__name']} flex items-center min-w-0 gap-1.5`}>
                <div className={styles['nearby-card__avatar']}>
                  <Image
                    alt=""
                    fill
                    sizes="24px"
                    src={user.avatarUrl}
                  />
                </div>
                <span className="truncate flex-1">
                  {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
                </span>
                {user.isVerified && <VerifiedBadge className="flex-shrink-0 h-3.5 w-3.5" />}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
