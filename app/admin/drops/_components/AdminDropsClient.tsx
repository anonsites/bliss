"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AdminPromoDrop } from "@/features/admin/drops/server";

const styles = {
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  tabBar: {
    display: "flex",
    gap: "8px",
    marginTop: "18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: "12px",
  },
  tabButton: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "999px",
    color: "#8ea2b8",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
    padding: "8px 12px",
  },
  tabButtonActive: {
    background: "rgba(94,234,212,0.13)",
    border: "1px solid rgba(94,234,212,0.35)",
    color: "#99f6e4",
  },
  avatar: {
    borderRadius: "50%",
    overflow: "hidden",
    position: "relative" as const,
    width: "42px",
    height: "42px",
    flexShrink: 0,
    background: "rgba(255,255,255,0.08)",
  },
  mediaCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
    padding: "8px",
    display: "grid",
    gap: "7px",
    cursor: "pointer",
    width: "100%",
  },
  mediaCardPreview: {
    position: "relative" as const,
    borderRadius: "10px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.06)",
    height: "140px",
    width: "100%",
    display: "grid",
    placeItems: "center",
    color: "#8ea2b8",
  },
  mediaCardPlaceholder: {
    fontSize: "13px",
    color: "#8ea2b8",
    textAlign: "center" as const,
    padding: "10px",
  },
  mediaCardLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#f8fafc",
  },
  mediaCardHint: {
    fontSize: "12px",
    color: "#8ea2b8",
    lineHeight: 1.5,
  },
  button: {
    background: "#5eead4",
    border: "none",
    borderRadius: "12px",
    color: "#06201d",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    padding: "12px 16px",
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.6,
  },
  error: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.22)",
    borderRadius: "12px",
    color: "#fecaca",
    fontSize: "14px",
    padding: "10px 12px",
  },
  form: {
    display: "grid",
    gap: "14px",
    marginTop: "18px",
  },
  mediaRow: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
  },
  grid: {
    display: "grid",
    gap: "18px",
    gridTemplateColumns: "minmax(280px, 420px) minmax(320px, 1fr)",
    marginTop: "22px",
  },
  hint: {
    color: "#8ea2b8",
    fontSize: "12px",
    marginTop: "6px",
  },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
    padding: "12px",
    width: "100%",
  },
  label: {
    color: "#cbd5e1",
    display: "grid",
    fontSize: "13px",
    fontWeight: 700,
    gap: "7px",
  },
  panel: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "18px",
  },
  createGrid: {
    display: "grid",
    gap: "18px",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    marginTop: "18px",
  },
  publishedGrid: {
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    marginTop: "18px",
  },
  listCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    display: "grid",
    gap: "12px",
    padding: "14px",
  },
  publishedHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  ownerRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  tags: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap" as const,
  },
  tag: {
    background: "rgba(94,234,212,0.12)",
    border: "1px solid rgba(94,234,212,0.24)",
    borderRadius: "999px",
    color: "#99f6e4",
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 8px",
    textTransform: "uppercase" as const,
  },
  thumbnail: {
    borderRadius: "14px",
    overflow: "hidden",
    position: "relative" as const,
    height: "150px",
    background: "rgba(255,255,255,0.04)",
    display: "grid",
    placeItems: "center",
  },
  thumbnailLabel: {
    color: "#8ea2b8",
    fontSize: "13px",
    textAlign: "center" as const,
    padding: "12px",
  },
  row: {
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "42px minmax(0, 1fr) auto",
    marginBottom: "10px",
    padding: "12px",
  },
  rowTitle: {
    fontSize: "14px",
    fontWeight: 700,
  },
  rowMeta: {
    color: "#8ea2b8",
    fontSize: "12px",
    marginTop: "4px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    margin: 0,
  },
  views: {
    border: "1px solid rgba(94,234,212,0.18)",
    borderRadius: "999px",
    color: "#99f6e4",
    fontSize: "12px",
    padding: "6px 10px",
    whiteSpace: "nowrap" as const,
  },
};

type AdminDropsClientProps = {
  initialDrops: AdminPromoDrop[];
};

export function AdminDropsClient({ initialDrops }: AdminDropsClientProps) {
  const [drops, setDrops] = useState(initialDrops);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "published">("create");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const hasDrops = drops.length > 0;
  const totalViews = useMemo(() => drops.reduce((sum, drop) => sum + drop.views, 0), [drops]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setAvatarPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  }

  function handleVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setVideoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const form = event.currentTarget;
      const response = await fetch("/api/admin/drops", {
        body: new FormData(form),
        method: "POST",
      });
      const payload = await response.json().catch(() => null) as { drop?: AdminPromoDrop; error?: string } | null;

      if (!response.ok || !payload?.drop) {
        throw new Error(payload?.error ?? "Failed to publish drop.");
      }

      setDrops((current) => [payload.drop as AdminPromoDrop, ...current]);
      form.reset();
      setAvatarPreview(null);
      setVideoPreview(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to publish drop.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
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
        <div style={styles.createGrid}>
          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>Create drop</h2>
            <form encType="multipart/form-data" onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>
                Model username
                <input name="ownerName" required style={styles.input} type="text" />
              </label>

              <div style={styles.mediaRow}>
                <label style={styles.label}>
                  Profile picture
                  <label style={styles.mediaCard}>
                    <div style={styles.mediaCardPreview}>
                      {avatarPreview ? (
                        <Image alt="Selected avatar preview" fill sizes="140px" src={avatarPreview} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      ) : (
                        <div style={styles.mediaCardPlaceholder}>Choose image</div>
                      )}
                    </div>
                    <div>
                      <div style={styles.mediaCardLabel}>Image</div>
                      <div style={styles.mediaCardHint}>Portrait profile image.</div>
                    </div>
                    <input accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif" name="avatar" onChange={handleAvatarChange} required style={{ display: "none" }} type="file" />
                  </label>
                </label>

                <label style={styles.label}>
                  Add video
                  <label style={styles.mediaCard}>
                    <div style={styles.mediaCardPreview}>
                      {videoPreview ? (
                        <video muted playsInline preload="metadata" src={videoPreview} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={styles.mediaCardPlaceholder}>Select video</div>
                      )}
                    </div>
                    <div>
                      <div style={styles.mediaCardLabel}>Video</div>
                      <div style={styles.mediaCardHint}>Portrait thumbnail for the drop.</div>
                    </div>
                    <input accept="video/*,.mp4,.mov,.webm,.m4v,.avi" name="video" onChange={handleVideoChange} required style={{ display: "none" }} type="file" />
                  </label>
                </label>
              </div>

              {error ? <div style={styles.error}>{error}</div> : null}

              <div style={styles.actions}>
                <button
                  disabled={isSubmitting}
                  style={{ ...styles.button, ...(isSubmitting ? styles.buttonDisabled : {}) }}
                  type="submit"
                >
                  {isSubmitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </section>

        </div>
      ) : (
        <div style={styles.publishedGrid}>
          {hasDrops ? (
            drops.map((drop) => (
              <article key={drop.id} style={styles.listCard}>
                <div>
                  <div style={styles.publishedHeader}>
                    <div style={styles.ownerRow}>
                      <div style={styles.avatar}>
                        <Image alt="" fill sizes="42px" src={drop.owner_avatar_url} style={{ objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={styles.rowTitle}>{drop.owner_name}</div>
                        <div style={styles.rowMeta}>{new Date(drop.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={styles.tags}>
                      <span style={styles.tag}>Admin</span>
                    </div>
                  </div>

                  <div style={styles.thumbnail}>
                    {drop.media_url ? (
                      <video muted playsInline preload="metadata" src={drop.media_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={styles.thumbnailLabel}>No video available</div>
                    )}
                  </div>

                  <div style={styles.publishedHeader}>
                    <span style={styles.views}>{drop.views.toLocaleString()} views</span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <section style={styles.panel}>
              <p style={styles.hint}>No drops have been published yet.</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
