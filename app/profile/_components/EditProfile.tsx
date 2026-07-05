"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import uiStyles from "@/components/ui/ui.module.css";
import styles from "./profile.module.css";
import type { ProfileEditorData } from "@/features/profile/models";

type ProfileSaveResponse = {
  error?: string;
  profile?: Pick<ProfileEditorData, "age" | "bio" | "gender" | "username"> &
    Partial<Pick<ProfileEditorData, "locationLabel" | "phoneNumber">>;
};

type EditProfileProps = {
  onProfileSaved: (profile: ProfileEditorData) => void;
  profile: ProfileEditorData & { birthdate?: string };
};

type EditUsernameModalProps = EditProfileProps & {
  onClose: () => void;
};

type DeleteAccountModalProps = {
  onClose: () => void;
};

function formatGender(gender: ProfileEditorData["gender"]) {
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function getEditableCity(locationLabel: string | null | undefined) {
  if (locationLabel === "Location unavailable" || locationLabel === "Location enabled" || !locationLabel) {
    return "";
  }

  return locationLabel;
}

function getCityDisplayLabel(locationLabel: string | null | undefined) {
  return getEditableCity(locationLabel) || "What's your city?";
}

function getEditableBio(bio: string | null | undefined) {
  return bio?.trim() ? bio.trim() : "";
}

function getBioDisplayLabel(bio: string | null | undefined) {
  return getEditableBio(bio) || "Write your bio";
}

function EditUsernameModal({ onClose, onProfileSaved, profile }: EditUsernameModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = username.trim() !== profile.username;

  useEffect(() => {
    setUsername(profile.username);
    setError(null);
    setSuccess(null);
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError("Username is required.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsSaving(true);

      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          bio: profile.bio,
          birthdate: profile.birthdate,
          gender: profile.gender,
          username: trimmedUsername,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as ProfileSaveResponse;

      if (!response.ok || !payload.profile) {
        setError(payload.error ?? "Unable to save your profile.");
        return;
      }

      const nextProfile = {
        ...profile,
        ...payload.profile,
      };

      onProfileSaved(nextProfile);
      setSuccess("Profile updated.");
      onClose();
    } catch {
      setError("Unable to save your profile right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} w-full max-w-md`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Username</h2>
            <p className="mt-1 text-sm text-gray-500">Update how your name appears on Bliss.</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white transition-colors" type="button">&times;</button>
        </div>

        <form className={styles.editUsernameModalForm} onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="complete-profile__label">Username</label>
            <input
              autoFocus
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
                setSuccess(null);
              }}
              className={styles.underlinedInput}
              placeholder="Enter username"
            />
          </div>

          {error ? <p className="complete-profile__error">{error}</p> : null}
          {success ? <p className="text-emerald-400 text-sm font-medium">{success}</p> : null}

          <div className={styles.editUsernameModalActions}>
            <button type="button" onClick={onClose} className={styles.secondaryActionBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving || !hasChanges} className={`${styles.saveChangesBtn} ${styles.compactSaveBtn}`}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCityModal({ onClose, onProfileSaved, profile }: EditUsernameModalProps) {
  const [city, setCity] = useState(getEditableCity(profile.locationLabel));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = city.trim() !== getEditableCity(profile.locationLabel);

  useEffect(() => {
    setCity(getEditableCity(profile.locationLabel));
    setError(null);
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCity = city.trim();

    if (!trimmedCity) {
      setError("City is required.");
      return;
    }

    try {
      setError(null);
      setIsSaving(true);

      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          bio: profile.bio,
          birthdate: profile.birthdate,
          gender: profile.gender,
          locationLabel: trimmedCity,
          username: profile.username,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as ProfileSaveResponse;

      if (!response.ok || !payload.profile) {
        setError(payload.error ?? "Unable to save your city.");
        return;
      }

      onProfileSaved({
        ...profile,
        ...payload.profile,
        locationLabel: payload.profile.locationLabel ?? trimmedCity,
      });
      onClose();
    } catch {
      setError("Unable to save your city right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} w-full max-w-md`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Edit City</h2>
            <p className="mt-1 text-sm text-gray-500">Update the city shown on your profile.</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white transition-colors" type="button">&times;</button>
        </div>

        <form className={styles.editUsernameModalForm} onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="complete-profile__label">City</label>
            <input
              autoFocus
              type="text"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setError(null);
              }}
              className={styles.underlinedInput}
              placeholder="Enter city"
            />
          </div>

          {error ? <p className="complete-profile__error">{error}</p> : null}

          <div className={styles.editUsernameModalActions}>
            <button type="button" onClick={onClose} className={styles.secondaryActionBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving || !hasChanges} className={`${styles.saveChangesBtn} ${styles.compactSaveBtn}`}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPhoneModal({ onClose, onProfileSaved, profile }: EditUsernameModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = (phoneNumber ?? "").trim() !== (profile.phoneNumber ?? "");

  useEffect(() => {
    setPhoneNumber(profile.phoneNumber ?? "");
    setError(null);
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPhoneNumber = (phoneNumber ?? "").trim();

    if (!trimmedPhoneNumber) {
      setError("Phone number is required.");
      return;
    }

    try {
      setError(null);
      setIsSaving(true);

      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          bio: profile.bio,
          birthdate: profile.birthdate,
          gender: profile.gender,
          phoneNumber: trimmedPhoneNumber,
          username: profile.username,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as ProfileSaveResponse;

      if (!response.ok || !payload.profile) {
        setError(payload.error ?? "Unable to save your phone number.");
        return;
      }

      onProfileSaved({
        ...profile,
        ...payload.profile,
        phoneNumber: payload.profile.phoneNumber ?? trimmedPhoneNumber,
      });
      onClose();
    } catch {
      setError("Unable to save your phone number right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} w-full max-w-md`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Phone Number</h2>
            <p className="mt-1 text-sm text-gray-500">Use international format, for example +1234567890.</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white transition-colors" type="button">&times;</button>
        </div>

        <form className={styles.editUsernameModalForm} onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="complete-profile__label">Phone Number</label>
            <input
              autoFocus
              type="tel"
              value={phoneNumber}
              onChange={(event) => {
                setPhoneNumber(event.target.value);
                setError(null);
              }}
              className={styles.underlinedInput}
              placeholder="insert phone number"
            />
          </div>

          {error ? <p className="complete-profile__error">{error}</p> : null}

          <div className={styles.editUsernameModalActions}>
            <button type="button" onClick={onClose} className={styles.secondaryActionBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving || !hasChanges} className={`${styles.saveChangesBtn} ${styles.compactSaveBtn}`}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditBioModal({ onClose, onProfileSaved, profile }: EditUsernameModalProps) {
  const [bio, setBio] = useState(getEditableBio(profile.bio));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = bio.trim() !== getEditableBio(profile.bio);

  useEffect(() => {
    setBio(getEditableBio(profile.bio));
    setError(null);
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedBio = bio.trim();

    try {
      setError(null);
      setIsSaving(true);

      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          bio: trimmedBio,
          birthdate: profile.birthdate,
          gender: profile.gender,
          username: profile.username,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as ProfileSaveResponse;

      if (!response.ok || !payload.profile) {
        setError(payload.error ?? "Unable to save your bio.");
        return;
      }

      onProfileSaved({
        ...profile,
        ...payload.profile,
        bio: payload.profile.bio ?? trimmedBio,
      });
      onClose();
    } catch {
      setError("Unable to save your bio right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} w-full max-w-md`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Bio</h2>
            <p className="mt-1 text-sm text-gray-500">Tell people a little about yourself.</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white transition-colors" type="button">&times;</button>
        </div>

        <form className={styles.editUsernameModalForm} onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="complete-profile__label">Bio</label>
            <textarea
              autoFocus
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                setError(null);
              }}
              className={styles.underlinedInput}
              placeholder="Write your bio"
              rows={4}
            />
          </div>

          {error ? <p className="complete-profile__error">{error}</p> : null}

          <div className={styles.editUsernameModalActions}>
            <button type="button" onClick={onClose} className={styles.secondaryActionBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving || !hasChanges} className={`${styles.saveChangesBtn} ${styles.compactSaveBtn}`}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setError(null);
      setIsDeleting(true);

      const response = await fetch("/api/profile/account", {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string; ok?: true };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Unable to delete your account.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to delete your account right now.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={uiStyles["modal-overlay"]} onClick={onClose}>
      <div className={`${uiStyles["modal-content"]} text-center`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold text-white">Delete account?</h2>
          <p className="mt-2 text-sm text-gray-400">This will permanently delete your account and sign you out.</p>
        </div>

        {error ? <p className="complete-profile__error">{error}</p> : null}

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteAccountConfirmBtn}
            type="button"
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </button>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={styles.deleteAccountCancelBtn}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditProfile({ onProfileSaved, profile }: EditProfileProps) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className={styles.sectionHeading}>
        <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
      </div>

      <div className={styles.accountOverview}>
        <button className={styles.usernameAccountCard} onClick={() => setShowUsernameModal(true)} type="button">
          <div className={styles.accountCardText}>
            <span className={styles.accountCardLabel}>Username</span>
            <strong className={styles.accountCardValue}>{profile.username}</strong>
          </div>
          <span className={styles.usernameEditButton} aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
              <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m15 5 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <button className={styles.usernameAccountCard} onClick={() => setShowPhoneModal(true)} type="button">
          <div className={styles.accountCardText}>
            <span className={styles.accountCardLabel}>Phone Number</span>
            <strong className={styles.accountCardValue}>{profile.phoneNumber || "Add phone number"}</strong>
          </div>
          <span className={styles.usernameEditButton} aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
              <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m15 5 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <button className={styles.usernameAccountCard} onClick={() => setShowCityModal(true)} type="button">
          <div className={styles.accountCardText}>
            <span className={styles.accountCardLabel}>City</span>
            <strong className={styles.accountCardValue}>{getCityDisplayLabel(profile.locationLabel)}</strong>
          </div>
          <span className={styles.usernameEditButton} aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
              <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m15 5 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <button className={styles.usernameAccountCard} onClick={() => setShowBioModal(true)} type="button">
          <div className={styles.accountCardText}>
            <span className={styles.accountCardLabel}>Bio</span>
            <strong className={styles.accountCardValue}>{getBioDisplayLabel(profile.bio)}</strong>
          </div>
          <span className={styles.usernameEditButton} aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
              <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m15 5 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <div className={styles.deleteAccountSection}>
          <button
            className={styles.deleteAccountBtn}
            onClick={() => setShowDeleteAccountModal(true)}
            type="button"
          >
            Delete account
          </button>
        </div>
      </div>

      {showUsernameModal ? (
        <EditUsernameModal
          onClose={() => setShowUsernameModal(false)}
          onProfileSaved={onProfileSaved}
          profile={profile}
        />
      ) : null}

      {showPhoneModal ? (
        <EditPhoneModal
          onClose={() => setShowPhoneModal(false)}
          onProfileSaved={onProfileSaved}
          profile={profile}
        />
      ) : null}

      {showCityModal ? (
        <EditCityModal
          onClose={() => setShowCityModal(false)}
          onProfileSaved={onProfileSaved}
          profile={profile}
        />
      ) : null}

      {showBioModal ? (
        <EditBioModal
          onClose={() => setShowBioModal(false)}
          onProfileSaved={onProfileSaved}
          profile={profile}
        />
      ) : null}

      {showDeleteAccountModal ? (
        <DeleteAccountModal onClose={() => setShowDeleteAccountModal(false)} />
      ) : null}
    </div>
  );
}
