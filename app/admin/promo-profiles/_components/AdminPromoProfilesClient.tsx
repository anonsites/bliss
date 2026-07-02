"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AdminPromoProfile } from "@/features/admin/promo-profiles/server";

const styles: Record<string, React.CSSProperties> = {
  tabBar: { display: "flex", gap: 8, marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12 },
  tabButton: { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "999px", color: "#8ea2b8", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: "8px 12px" },
  tabButtonActive: { background: "rgba(14, 165, 163, 0.13)", border: "1px solid rgba(14, 165, 163, 0.35)", color: "#5eead4" },
  panel: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 },
  form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  inputsColumn: { display: "grid", gap: 12 },
  imagesColumn: { display: "flex", flexDirection: "row", gap: 12 },
  label: { display: "block" },
  input: { width: "100%", padding: "8px 10px" },
  textarea: { width: "100%", padding: "8px 10px", height: 80 },
  mediaRow: { display: "flex", gap: 12 },
  mediaCard: { display: "block", width: 140, cursor: "pointer" },
  mediaCardPreview: { width: 140, height: 200, background: "#0b0f14", borderRadius: 8, overflow: "hidden", position: "relative" },
  mediaCardPlaceholder: { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9fb0c6" },
  actions: { marginTop: 12, gridColumn: "1 / -1" },
  button: { padding: "8px 12px", borderRadius: 8, background: "#0ea5a3", color: "#042023", border: "none", cursor: "pointer" },
  error: { color: "#ff6b6b", gridColumn: "1 / -1" },
  profilesList: { display: "grid", gap: 12 },
  profileItem: { display: "flex", gap: 12, alignItems: "center", padding: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 },
  profileAvatar: { width: 42, height: 42, position: "relative" as const, flexShrink: 0 },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: 700 },
  profileMeta: { color: "#9fb0c6", fontSize: 12, marginTop: 4 },
  profileActions: { display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" },
  badge: { background: "#0ea5a3", color: "#042023", padding: "4px 8px", borderRadius: 8, fontSize: 12 },
  emptyState: { color: "#9fb0c6", textAlign: "center" as const, padding: 24 },
};

interface Props {
  initialProfiles: AdminPromoProfile[];
}

export function AdminPromoProfilesClient({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "published">("create");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const hasProfiles = profiles.length > 0;

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setAvatarPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  }

  function handleMediaChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setMediaPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const form = event.currentTarget;
      const response = await fetch("/api/admin/promo-profiles", {
        body: new FormData(form),
        method: "POST",
      });

      const payload = await response.json().catch(() => null) as { profile?: AdminPromoProfile; error?: string } | null;

      if (!response.ok || !payload?.profile) {
        throw new Error(payload?.error ?? "Failed to create promo profile.");
      }

      setProfiles((current) => [payload.profile as AdminPromoProfile, ...current]);
      form.reset();
      setAvatarPreview(null);
      setMediaPreview(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create promo profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalProfiles = useMemo(() => profiles.length, [profiles]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Promo Profiles</h2>
        <div style={{ color: "#9fb0c6", fontSize: 12 }}>{totalProfiles} profiles</div>
      </div>

      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab("create")}
          style={{ ...styles.tabButton, ...(activeTab === "create" ? styles.tabButtonActive : {}) }}
          type="button"
        >
          Create
        </button>
        <button
          onClick={() => setActiveTab("published")}
          style={{ ...styles.tabButton, ...(activeTab === "published" ? styles.tabButtonActive : {}) }}
          type="button"
        >
          Published
        </button>
      </div>

      {activeTab === "create" ? (
        <section style={styles.panel}>
          <form encType="multipart/form-data" onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputsColumn}>
          <label style={styles.label}>
            Username
            <input name="username" required style={styles.input} type="text" />
          </label>

          <label style={styles.label}>
            City
            <input name="city" placeholder="insert city" style={styles.input} type="text" />
          </label>

          <label style={styles.label}>
            Gender
            <select name="gender" defaultValue="female" style={styles.input} required>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>

          <label style={styles.label}>
            Phone number
            <input name="phone" placeholder="Insert phone number" style={styles.input} type="text" />
          </label>

          <label style={styles.label}>
            Bio
            <textarea name="bio" style={styles.textarea} />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input name="isVerified" type="checkbox" defaultChecked value="1" />
            <span style={{ color: "#9fb0c6" }}>Verified</span>
          </label>
        </div>

        <div style={styles.imagesColumn}>
          {error ? <div style={styles.error}>{error}</div> : null}
          <label style={styles.label}>
            Profile picture
            <label style={styles.mediaCard}>
              <div style={styles.mediaCardPreview}>
                {avatarPreview ? (
                  <Image alt="Selected profile picture preview" fill sizes="140px" src={avatarPreview} style={{ objectFit: "cover" }} />
                ) : (
                  <div style={styles.mediaCardPlaceholder}>Choose image</div>
                )}
              </div>
              <input accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif" name="avatar" onChange={handleAvatarChange} required style={{ display: "none" }} type="file" />
            </label>
          </label>

          <label style={styles.label}>
            Gallery image
            <label style={styles.mediaCard}>
              <div style={styles.mediaCardPreview}>
                {mediaPreview ? (
                  <Image alt="Selected gallery image preview" fill sizes="140px" src={mediaPreview} style={{ objectFit: "cover" }} />
                ) : (
                  <div style={styles.mediaCardPlaceholder}>Select media</div>
                )}
              </div>
              <input accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.mp4,.mov,.webm,.m4v,.avi" name="media" onChange={handleMediaChange} required style={{ display: "none" }} type="file" />
            </label>
          </label>

          <div style={styles.actions}>
            <button disabled={isSubmitting} style={styles.button} type="submit">
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
          </form>
        </section>
      ) : (
        <div style={styles.profilesList}>
          {hasProfiles ? (
            profiles.map((profile) => (
              <article key={profile.id} style={styles.profileItem}>
                <div style={styles.profileAvatar}>
                  <Image alt="" fill sizes="42px" src={profile.avatar_url} style={{ objectFit: "cover", borderRadius: 8 }} />
                </div>

                <div style={styles.profileInfo}>
                  <div style={styles.profileName}>{profile.username}</div>
                  <div style={styles.profileMeta}>{new Date(profile.created_at).toLocaleDateString()}</div>
                </div>

                <div style={styles.profileActions}>
                  {profile.phone_number ? (
                    <div style={{ color: "#9fb0c6", fontSize: 12 }}>{profile.phone_number}</div>
                  ) : null}

                  {profile.is_verified ? (
                    <div style={styles.badge}>
                      Verified
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div style={styles.emptyState}>No promo profiles yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
