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
  avatar: {
    borderRadius: "50%",
    overflow: "hidden",
    position: "relative" as const,
    width: "42px",
    height: "42px",
    flexShrink: 0,
    background: "rgba(255,255,255,0.08)",
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
  textarea: {
    minHeight: "90px",
    resize: "vertical" as const,
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
  const hasDrops = drops.length > 0;
  const totalViews = useMemo(() => drops.reduce((sum, drop) => sum + drop.views, 0), [drops]);

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
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to publish drop.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.grid}>
      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>Publish drop</h2>
        <form encType="multipart/form-data" onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Owner name
            <input name="ownerName" required style={styles.input} type="text" />
          </label>

          <label style={styles.label}>
            Profile picture
            <input accept="image/*" name="avatar" required style={styles.input} type="file" />
          </label>

          <label style={styles.label}>
            Short video
            <input accept="video/*" name="video" required style={styles.input} type="file" />
            <span style={styles.hint}>Uploads to Cloudinary and publishes immediately.</span>
          </label>

          <label style={styles.label}>
            Caption
            <textarea name="caption" style={{ ...styles.input, ...styles.textarea }} />
          </label>

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

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>Published drops</h2>
        <p style={styles.hint}>{drops.length} drops, {totalViews.toLocaleString()} total views</p>

        <div style={{ marginTop: "14px" }}>
          {hasDrops ? (
            drops.map((drop) => (
              <article key={drop.id} style={styles.row}>
                <div style={styles.avatar}>
                  <Image alt="" fill sizes="42px" src={drop.owner_avatar_url} style={{ objectFit: "cover" }} />
                </div>
                <div>
                  <div style={styles.rowTitle}>{drop.owner_name}</div>
                  <div style={styles.rowMeta}>
                    {new Date(drop.created_at).toLocaleDateString()} {drop.caption ? `- ${drop.caption}` : ""}
                  </div>
                </div>
                <span style={styles.views}>{drop.views.toLocaleString()} views</span>
              </article>
            ))
          ) : (
            <p style={styles.hint}>No admin drops have been published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
