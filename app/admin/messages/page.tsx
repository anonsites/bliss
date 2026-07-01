import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { AdminShell } from "../_components/AdminShell";

export const dynamic = "force-dynamic";

const styles = {
  card: {
    background: "rgba(11, 16, 26, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    marginTop: "8px",
    color: "#9fb0c6",
    fontSize: "14px",
  },
  placeholder: {
    marginTop: "20px",
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: "18px",
    padding: "28px",
    textAlign: "center" as const,
    color: "#8ea2b8",
    background: "rgba(255,255,255,0.02)",
  },
};

export default async function AdminMessagesPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator") {
    redirect("/");
  }

  return (
    <AdminShell>
      <div style={styles.card}>
        <h1 style={styles.title}>Messages</h1>
        <p style={styles.subtitle}>This section will handle message moderation and support next.</p>
        <div style={styles.placeholder}>UI placeholder for messages.</div>
      </div>
    </AdminShell>
  );
}
