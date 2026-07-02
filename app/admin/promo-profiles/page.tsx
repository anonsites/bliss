import { redirect } from "next/navigation";
import { listAdminPromoProfiles } from "@/features/admin/promo-profiles/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { AdminShell } from "../_components/AdminShell";
import { AdminPromoProfilesClient } from "./_components/AdminPromoProfilesClient";

export const dynamic = "force-dynamic";

const styles = {
  card: {
    background: "rgba(11, 16, 26, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  },
  title: { fontSize: "24px", fontWeight: 700, margin: 0 },
};

export default async function AdminPromoProfilesPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator") {
    redirect("/");
  }

  const profiles = await listAdminPromoProfiles();

  return (
    <AdminShell>
      <div style={styles.card}>
        <h1 style={styles.title}>PROMO PROFILES</h1>
        <AdminPromoProfilesClient initialProfiles={profiles} />
      </div>
    </AdminShell>
  );
}
