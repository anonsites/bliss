import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { listAdminUsers } from "@/features/admin/users/server";
import { AdminShell } from "../_components/AdminShell";
import { AdminUsersClient } from "./_components/AdminUsersClient";

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

export default async function AdminUsersPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator") {
    redirect("/");
  }

  const users = await listAdminUsers({ limit: 200 });

  return (
    <AdminShell>
      <div style={styles.card}>
        <h1 style={styles.title}>Users</h1>
        <p style={styles.subtitle}>Query users by username, city, and gender.</p>
        <AdminUsersClient initialUsers={users} />
      </div>
    </AdminShell>
  );
}
