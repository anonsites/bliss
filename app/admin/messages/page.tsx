import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { AdminShell } from "../_components/AdminShell";
import { listAdminChatThreads } from "@/features/admin/messages/server";
import { AdminMessagesClient } from "./_components/AdminMessagesClient";

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
};

export default async function AdminMessagesPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator") {
    redirect("/");
  }

  const threads = await listAdminChatThreads();

  return (
    <AdminShell>
      <div style={styles.card}>
        <h1 style={styles.title}>Messages</h1>
        <p style={styles.subtitle}>Monitor chat threads and open conversations.</p>
        <AdminMessagesClient initialThreads={threads} />
      </div>
    </AdminShell>
  );
}
