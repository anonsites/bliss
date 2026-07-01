"use client";

import { useState, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { 
  GalleryIcon,
  NotificationsIcon, 
  PrivacyIcon, 
  PenIcon, 
  LogoutIcon,
} from "./ProfileNavIcons";

// Import existing modular components
import { EditProfile } from "./EditProfile";
import { NotificationsEnhanced } from "@/components/notifications/NotificationsEnhanced";
import { Privacy } from "./Privacy";
import { LogOutModal } from "./LogOutModal";
import { UserGallery } from "./UserGallery";
import styles from "./profile.module.css"; // Import the CSS module
import type { ProfileGender, ProfilePageData } from "@/features/profile/models";
import type { NotificationPayload } from "@/features/notifications/types";

type ProfilePageClientProps = {
  initialData: ProfilePageData;
};

function calculateAge(birthdate: string) {
  const parsedBirthdate = new Date(`${birthdate}T00:00:00.000Z`);

  if (Number.isNaN(parsedBirthdate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getUTCFullYear() - parsedBirthdate.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - parsedBirthdate.getUTCMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < parsedBirthdate.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

type ProfileTab = "gallery" | "account" | "privacy" | "notifications";

const PROFILE_TABS: Array<{
  id: ProfileTab;
  icon: ReactNode;
  color: string;
  label: string;
}> = [
  { id: "gallery", icon: <GalleryIcon className="h-6 w-6" />, color: "#27d6c5", label: "Gallery" },
  { id: "account", icon: <PenIcon className="h-6 w-6" />, color: "#27d6c5", label: "Account" },
  { id: "privacy", icon: <PrivacyIcon className="h-6 w-6" />, color: "#27d6c5", label: "Privacy" },
  { id: "notifications", icon: <NotificationsIcon className="h-6 w-6" />, color: "#27d6c5", label: "Notifications" },
];

function ProfileNav({
  activeTab,
  className = "",
  onTabChange,
}: {
  activeTab: ProfileTab;
  className?: string;
  onTabChange: (tab: ProfileTab) => void;
}) {
  return (
    <nav className={`${styles.profileNav} ${className}`}>
      {PROFILE_TABS.map((tab) => (
        <button
          key={tab.id}
          aria-label={tab.label}
          className={`${styles.profileNavLink} ${activeTab === tab.id ? styles.profileNavLinkActive : ""}`}
          style={{ "--accent-color": tab.color } as CSSProperties}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.icon}
        </button>
      ))}
    </nav>
  );
}

function ProfileSummary({
  data,
  activeTab,
  onTabChange,
  fullHeight = false,
  onEdit,
  onLogout,
  showNav = true,
}: {
  data: ProfilePageData;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  fullHeight?: boolean;
  onEdit: () => void;
  onLogout: () => void;
  showNav?: boolean;
}) {
  const wrapperClassName = `${styles.profileSummaryWrapper} ${fullHeight ? "flex flex-col" : ""}`;

  const ChevronRight = () => (
    <svg className="h-4 w-4 text-gray-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className={wrapperClassName}>
      <div className={styles.profileSummaryInner}>
        <div className={styles.profileSummaryContent}>
          <div className={styles.profileInfoSection}>
              {/* Profile Picture, Name, and Basic Info */}

              <div className={styles.profilePictureContainer}>
                <div className={`${styles.profileCoverImage} !h-40 lg:!h-64`}>
                  <Image alt={data.username} className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 320px" src={data.avatar_url} />
                </div>

                <div className={styles.profileNameAndBio}>
                  <div className={styles.profileNameRow}>
                    <h1 className={styles.profileUsername}>{data.username}</h1>
                    {data.is_profile_verified ? <VerifiedBadge className="h-6 w-6" /> : null}
                    <button
                      onClick={onLogout}
                      className={styles.logoutButton}
                      title="Logout"
                      type="button"
                    >
                      <LogoutIcon className="h-5 w-5" />
                    </button>
                  </div>
                  </div>
                  {data.bio ? (
                    <p className={styles.profileBio}>{data.bio}</p>
                  ) : null}

                </div>
              </div>
            </div>
            

            {showNav ? <ProfileNav activeTab={activeTab} onTabChange={onTabChange} /> : null}


          </div>
        </div>
      

  );
}

export function ProfilePageClient({ initialData }: ProfilePageClientProps) {
  const [profileData, setProfileData] = useState<ProfilePageData>(initialData);
  const [notifications, setNotifications] = useState<Array<NotificationPayload & { timeLabel: string }>>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs: ProfileTab[] = ['gallery', 'account', 'privacy', 'notifications'];
  const initialTab = (tabParam && validTabs.includes(tabParam as ProfileTab)) ? (tabParam as ProfileTab) : 'gallery';
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch notifications from the new API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const response = await fetch("/api/notifications?limit=50");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
  };

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

  const renderContent = (currentTab: ProfileTab, isDesktop = false) => {
    const isMobile = !isDesktop;
    const containerClass = isMobile ? styles.profileContentPanelWrapperMobile : styles.profileContentPanelWrapperDesktop;

    switch (currentTab) {
      case "gallery":
        return (
          <div className={`mx-auto w-full max-w-5xl flex flex-col ${containerClass}`}>
            <UserGallery
              username={profileData.username}
              media={profileData.user_media}
            />
          </div>
        );
      case "account":
        return (
          <div className={`mx-auto w-full max-w-2xl flex flex-col ${containerClass}`}>
            <EditProfile
              profile={{
                username: profileData.username,
                bio: profileData.bio ?? "", // Fix: convert null to empty string for form
                gender: profileData.gender as ProfileGender,
                age: calculateAge(profileData.birthdate) ?? 0,
                avatarUrl: profileData.avatar_url,
                isVerified: profileData.is_profile_verified,
                locationLabel: profileData.location_label,
                phoneNumber: profileData.phone_number,
                birthdate: profileData.birthdate,
              }}
              onProfileSaved={(updated) => {
                setProfileData((prev) => ({
                  ...prev,
                  username: updated.username,
                  bio: updated.bio,
                  gender: updated.gender,
                  avatar_url: updated.avatarUrl ?? prev.avatar_url,
                  is_profile_verified: updated.isVerified,
                  location_label: updated.locationLabel,
                  phone_number: updated.phoneNumber,
                }));
          setActiveTab("gallery");
              }}
            />
          </div>
        );
      case "notifications":
        return (
          <div className={`max-w-2xl mx-auto flex flex-col ${containerClass}`}>
            {notificationsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading notifications...</div>
            ) : (
              <NotificationsEnhanced
                notifications={notifications}
                onNotificationsChange={setNotifications}
              />
            )}
          </div>
        );
      case "privacy":
        return (
          <div className={`max-w-2xl mx-auto flex flex-col ${containerClass}`}>
            <Privacy 
              blockedUsers={profileData.blockedUsers} 
              onUnblock={(userId) => setProfileData((prev) => ({ ...prev, blockedUsers: prev.blockedUsers.filter((u) => u.id !== userId), blockedUsersCount: Math.max(0, prev.blockedUsersCount - 1), }))}
              hiddenContacts={profileData.hiddenContacts || []}
              onHideContact={(phone) => setProfileData((prev) => ({ ...prev, hiddenContacts: [...(prev.hiddenContacts || []), phone] }))}
              onRemoveHiddenContact={(phone) => setProfileData((prev) => ({ ...prev, hiddenContacts: (prev.hiddenContacts || []).filter((p) => p !== phone) }))}
              initialPhoneVisibility={profileData.settings.hideFromContacts}
              initialPushNotifications={profileData.settings.pushNotifications}
              onSettingsChange={(settings) => setProfileData((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }))}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <> {/* min-h-[100dvh] lg:hidden */}
      <div className={styles.profilePageContainer}>
          <header className={`${styles.profilePageHeader} sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-center`}>
            <h1 className={styles.profilePageTitle}>Profile</h1>
          </header>
          <ProfileSummary
            data={profileData}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onEdit={() => handleTabChange("account")}
            onLogout={() => setShowLogoutConfirm(true)}
            showNav={false}
          />
          <ProfileNav
            activeTab={activeTab}
            className={styles.profileNavStickyMobile}
            onTabChange={handleTabChange}
          />
          {renderContent(activeTab, false)}
        </div>


      <div className={styles.profilePageContainerDesktop}>
        <aside className={styles.profileSidebar}>
          <ProfileSummary
            data={profileData}
            fullHeight={true}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onEdit={() => handleTabChange("account")}
            onLogout={() => setShowLogoutConfirm(true)}
          />
        </aside>

        <main className={styles.profileMainContent}>
          {renderContent(activeTab, true)}
        </main>
      </div>

      {showLogoutConfirm && (
        <LogOutModal 
          onClose={() => setShowLogoutConfirm(false)} 
          onConfirm={handleLogout} 
        />
      )}
    </>
  );
}
