"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { 
  GalleryIcon,
  NotificationsIcon, 
  PrivacyIcon, 
  PenIcon,
  LogoutIcon,
} from "./ProfileNavIcons";
import { LogOutModal } from "./LogOutModal";
import styles from "./profile.module.css";
import type { ProfilePageData } from "@/features/profile/models";

const PROFILE_LINKS: Array<{
  href: string;
  icon: ReactNode;
  label: string;
  color: string;
}> = [
  { href: "/profile/gallery", icon: <GalleryIcon className="h-6 w-6" />, label: "Gallery", color: "#27d6c5" },
  { href: "/profile/edit", icon: <PenIcon className="h-6 w-6" />, label: "Account", color: "#27d6c5" },
  { href: "/profile/privacy", icon: <PrivacyIcon className="h-6 w-6" />, label: "Privacy", color: "#27d6c5" },
  { href: "/profile/notifications", icon: <NotificationsIcon className="h-6 w-6" />, label: "Notifications", color: "#27d6c5" },
];

export function ProfileMobileNav({ data }: { data: ProfilePageData }) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className={styles.profilePageContainer}>
      <header className={`${styles.profilePageHeaderWithBack} sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-white/5`}>
        <div className="flex flex-1 items-center justify-start">
          <h1 className={styles.profilePageTitle}>Profile</h1>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={styles.logoutButton}
          title="Logout"
          type="button"
        >
          <LogoutIcon className="h-5 w-5" />
        </button>
      </header>

      <div className={styles.profileMobileNavWrapper}>
        {/* Profile Picture Section */}
        <div className={styles.profileMobileInfoSection}>
          <div className={styles.profileCoverImage + " h-40!"}>
            <Image 
              alt={data.username} 
              className="object-cover" 
              fill 
              priority 
              sizes="100vw"
              src={data.avatar_url} 
            />
          </div>
          <div className={styles.profileNameAndBio}>
            <div className={styles.profileNameRow}>
              <h1 className={styles.profileUsername}>{data.username}</h1>
              {data.is_profile_verified ? <VerifiedBadge className="h-6 w-6" /> : null}
            </div>
            {data.bio ? (
              <p className={styles.profileBio}>{data.bio}</p>
            ) : null}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={styles.profileMobileNavLinks}>
          {PROFILE_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <div 
                className={styles.profileMobileNavLink}
                style={{ "--accent-color": link.color } as CSSProperties}
              >
                <div className={styles.profileMobileNavLinkIcon}>{link.icon}</div>
                <div className={styles.profileMobileNavLinkContent}>
                  <span className={styles.profileMobileNavLinkLabel}>{link.label}</span>
                  <svg className="h-5 w-5 text-gray-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {showLogoutConfirm ? (
        <LogOutModal
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      ) : null}
    </div>
  );
}
