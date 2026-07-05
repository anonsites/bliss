"use client";

import { useEffect, useState } from "react";
import uiStyles from "@/components/ui/ui.module.css";
import styles from "./profile.module.css";

type CityModalProps = {
  initialValue?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (city: string) => void;
  profile?: {
    bio?: string | null;
    birthdate?: string;
    gender?: string;
    username?: string;
  };
};

function normalizeCityValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const normalized = value.trim();

  if (!normalized || ["Location unavailable", "Location enabled"].includes(normalized)) {
    return "";
  }

  return normalized;
}

function hasCityValue(value: string | null | undefined) {
  return normalizeCityValue(value).length > 0;
}

export function CityModal({ initialValue, isOpen, onClose, onSaved, profile }: CityModalProps) {
  const [city, setCity] = useState(normalizeCityValue(initialValue));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCity(normalizeCityValue(initialValue));
      setError(null);
    }
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

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
          bio: profile?.bio ?? "",
          birthdate: profile?.birthdate ?? "",
          gender: profile?.gender ?? "male",
          locationLabel: trimmedCity,
          username: profile?.username ?? "",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string; profile?: { locationLabel?: string } };

      if (!response.ok || !payload.profile) {
        setError(payload.error ?? "Unable to save your city.");
        return;
      }

      onSaved(payload.profile.locationLabel ?? trimmedCity);
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
            <h2 className="text-xl font-bold text-white">Add your city</h2>
            <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white transition-colors" type="button">&times;</button>
            <p className="mt-1 text-sm text-gray-500">We use this to help people discover you nearby.</p>
          </div>
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
              placeholder="Enter your city"
            />
          </div>

          {error ? <p className="complete-profile__error">{error}</p> : null}

          <div className={styles.editUsernameModalActions}>
            <button type="button" onClick={onClose} className={styles.secondaryActionBtn}>
              Skip
            </button>
            <button type="submit" disabled={isSaving || !city.trim()} className={`${styles.saveChangesBtn} ${styles.compactSaveBtn}`}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { hasCityValue };
