import { redirect } from "next/navigation";
import { listAdminPromoDrops } from "@/features/admin/drops/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { AdminShell } from "../_components/AdminShell";
import { AdminDropsClient } from "./_components/AdminDropsClient";

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

export default async function AdminDropsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator") {
    redirect("/");
  }

  const drops = await listAdminPromoDrops();

  return (
    <AdminShell>
      <div style={styles.card}>
        <h1 style={styles.title}>POST DROPS</h1>
        <AdminDropsClient initialDrops={drops} />
      </div>
    </AdminShell>
  );
}
