"use client";

import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import { BlockedUsersIcon, HideUsersIcon, NotificationsIcon } from "./ProfileNavIcons";
import { BlockedUsersModal } from "./BlockedUsersModal";
import { HiddenContactsModal } from "./HiddenContactsModal";

export type BlockedUser = {
  id: string;
  username: string;
  avatar_url: string;
};

type PrivacyProps = {
  blockedUsers: BlockedUser[];
  onUnblock?: (userId: string) => void;
  hiddenContacts: string[];
  onHideContact?: (phoneNumber: string) => void;
  onRemoveHiddenContact?: (phoneNumber: string) => void;
  initialPhoneVisibility?: boolean;
  initialPushNotifications?: boolean;
  onSettingsChange?: (settings: { hideFromContacts: boolean; pushNotifications: boolean }) => void;
};

type Visibility = "public" | "private";

function BirthdayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6v4" />
      <path d="M8 14h8" />
      <path d="M4 10h16v10H4z" />
      <path d="M6 10V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M12 2c1.5 1.2 2 2.1 2 3a2 2 0 0 1-4 0c0-.9.5-1.8 2-3Z" />
    </svg>
  );
}

function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.23a2 2 0 0 1 2.11-.45c.91.31 1.85.53 2.81.66A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function VisibilityToggle({
  value,
  onChange,
  label,
}: {
  value: Visibility;
  onChange: (value: Visibility) => void;
  label: string;
}) {
  const isPublic = value === "public";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublic}
      aria-label={`${label} is ${value}`}
      className={`${styles.visibilityToggle} ${isPublic ? styles.visibilityTogglePublic : styles.visibilityTogglePrivate}`}
      onClick={() => onChange(isPublic ? "private" : "public")}
    >
      <span className={styles.visibilityToggleOption}>Private</span>
      <span className={styles.visibilityToggleOption}>Public</span>
      <span className={styles.visibilityToggleThumb} />
    </button>
  );
}

export function Privacy({
  blockedUsers,
  onUnblock,
  hiddenContacts,
  onHideContact,
  onRemoveHiddenContact,
  initialPhoneVisibility = true,
  initialPushNotifications = false,
  onSettingsChange,
}: PrivacyProps) {
  const [isUnblocking, setIsUnblocking] = useState<string | null>(null);
  const [isHiding, setIsHiding] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [birthdayVisibility, setBirthdayVisibility] = useState<Visibility>("private");
  const [phoneVisibility, setPhoneVisibility] = useState<Visibility>(initialPhoneVisibility ? "private" : "public");
  const [pushNotifications, setPushNotifications] = useState(initialPushNotifications);
  const [localBlockedUsers, setLocalBlockedUsers] = useState(blockedUsers);
  const [localHiddenContacts, setLocalHiddenContacts] = useState(hiddenContacts);

  useEffect(() => {
    setLocalBlockedUsers(blockedUsers);
  }, [blockedUsers]);

  useEffect(() => {
    setLocalHiddenContacts(hiddenContacts);
  }, [hiddenContacts]);

  const handleUnblock = async (userId: string) => {
    setIsUnblocking(userId);
    try {
      const response = await fetch("/api/profile/unblock", {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setLocalBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
        onUnblock?.(userId);
      }
    } catch (err) {
      console.error("Unblock failed:", err);
    } finally {
      setIsUnblocking(null);
    }
  };

  const handleHidePhone = async (phone: string) => {
    setIsHiding(true);
    try {
      const response = await fetch("/api/profile/privacy/hide", {
        method: "POST",
        body: JSON.stringify({ phoneNumber: phone }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setLocalHiddenContacts((prev) => [...prev, phone]);
        onHideContact?.(phone);
      }
    } catch (err) {
      console.error("Hide contact failed:", err);
    } finally {
      setIsHiding(false);
    }
  };

  const handleRemoveHiddenPhone = async (phone: string) => {
    try {
      const response = await fetch("/api/profile/privacy/hide", {
        method: "DELETE",
        body: JSON.stringify({ phoneNumber: phone }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setLocalHiddenContacts((prev) => prev.filter((contact) => contact !== phone));
        onRemoveHiddenContact?.(phone);
      }
    } catch (err) {
      console.error("Remove hidden contact failed:", err);
    }
  };

  const persistSettings = async (nextPhoneVisibility: Visibility, nextPushNotifications: boolean) => {
    setIsSavingSettings(true);

    try {
      const response = await fetch("/api/profile/settings", {
        method: "PATCH",
        body: JSON.stringify({
          hideFromContacts: nextPhoneVisibility === "private",
          pushNotifications: nextPushNotifications,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Unable to save privacy settings");
      }

      onSettingsChange?.({
        hideFromContacts: nextPhoneVisibility === "private",
        pushNotifications: nextPushNotifications,
      });
    } catch (err) {
      console.error("Privacy settings update failed:", err);
      setPhoneVisibility(initialPhoneVisibility ? "private" : "public");
      setPushNotifications(initialPushNotifications);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePhoneVisibilityChange = async (value: Visibility) => {
    const nextValue = value === "private" ? "private" : "public";
    setPhoneVisibility(nextValue);
    await persistSettings(nextValue, pushNotifications);
  };

  const handlePushNotificationsChange = async () => {
    const nextValue = !pushNotifications;
    setPushNotifications(nextValue);
    await persistSettings(phoneVisibility, nextValue);
  };

  return (
    <div className="flex flex-col h-full fade-in">
      <div className={styles.sectionHeading}>
        <div className="flex items-center justify-center gap-3 mb-1">
          <h2 className="text-xl font-bold text-white">Privacy</h2>
        </div>
      </div>

      <div className={styles.privacyList}>
        <div className={`${styles.privacyListItem} ${styles.privacyVisibilityItem}`}>
          <div className={styles.privacyVisibilityContent}>
            <div className={styles.iconShell}>
              <BirthdayIcon className="h-5 w-5" />
            </div>
            <div className={styles.privacyVisibilityText}>
              <h3 className="font-bold text-white">Birthday</h3>
              <p className="text-xs text-gray-500">Choose who can see your birthday</p>
            </div>
          </div>
          <VisibilityToggle label="Birthday visibility" value={birthdayVisibility} onChange={setBirthdayVisibility} />
        </div>

        <div className={`${styles.privacyListItem} ${styles.privacyVisibilityItem}`}>
          <div className={styles.privacyVisibilityContent}>
            <div className={styles.iconShell}>
              <PhoneIcon className="h-5 w-5" />
            </div>
            <div className={styles.privacyVisibilityText}>
              <h3 className="font-bold text-white">Phone Number</h3>
              <p className="text-xs text-gray-500">Choose who can see your phone number</p>
            </div>
          </div>
          <VisibilityToggle label="Phone number visibility" value={phoneVisibility} onChange={handlePhoneVisibilityChange} />
        </div>

        <div className={`${styles.privacyListItem} ${styles.privacyVisibilityItem}`}>
          <div className={styles.privacyVisibilityContent}>
            <div className={styles.iconShell}>
              <NotificationsIcon className="h-5 w-5" />
            </div>
            <div className={styles.privacyVisibilityText}>
              <h3 className="font-bold text-white">Push Notifications</h3>
              <p className="text-xs text-gray-500">Receive app notifications when something important happens</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pushNotifications}
            aria-label={`Push notifications ${pushNotifications ? "on" : "off"}`}
            onClick={handlePushNotificationsChange}
            disabled={isSavingSettings}
            className={`${styles.visibilityToggle} ${pushNotifications ? styles.visibilityTogglePublic : styles.visibilityTogglePrivate}`}
          >
            <span className={styles.visibilityToggleOption}>Off</span>
            <span className={styles.visibilityToggleOption}>On</span>
            <span className={styles.visibilityToggleThumb} />
          </button>
        </div>

        <div className={styles.privacyListItem}>
          <div className="flex items-center gap-4">
            <div className={styles.iconShell}>
              <BlockedUsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Black List</h3>
              <p className="text-xs text-gray-500">{localBlockedUsers.length} users blocked</p>
            </div>
          </div>
          <button onClick={() => setShowBlockedModal(true)} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
      </div>
        <div className={styles.privacyListItem}>
          <div className="flex items-center gap-4">
            <div className={styles.iconShell}>
              <HideUsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Hidden Contacts</h3>
              <p className="text-xs text-gray-500">{localHiddenContacts.length} numbers hidden</p>
            </div>
          </div>
          <button onClick={() => setShowHiddenModal(true)} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {showBlockedModal && (
        <BlockedUsersModal 
          onClose={() => setShowBlockedModal(false)}
          blockedUsers={localBlockedUsers}
          onUnblock={handleUnblock}
          isUnblocking={isUnblocking}
        />
      )}

      {showHiddenModal && (
        <HiddenContactsModal 
          onClose={() => setShowHiddenModal(false)}
          hiddenContacts={localHiddenContacts}
          onHidePhone={handleHidePhone}
          onRemoveHiddenPhone={handleRemoveHiddenPhone}
          isHiding={isHiding}
        />
      )}
      </div>
  );
}
