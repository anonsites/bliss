import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminOverview, type AdminOverview } from "@/features/admin/overview";
import { getAuthenticatedUser } from "@/features/auth/server";
import { AdminShell } from "./_components/AdminShell";

export const dynamic = "force-dynamic";

const styles = {
  content: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  header: {
    background: "rgba(11, 16, 26, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.24)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
  },
  badge: {
    border: "1px solid rgba(94, 234, 212, 0.28)",
    background: "rgba(94, 234, 212, 0.12)",
    color: "#5eead4",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gap: "16px",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "rgba(11, 16, 26, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 10px 32px rgba(0,0,0,0.2)",
  },
  cardLabel: {
    color: "#9fb0c6",
    fontSize: "14px",
    marginBottom: "10px",
  },
  cardValue: {
    fontSize: "28px",
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "12px",
  },
  sectionSubtitle: {
    color: "#9fb0c6",
    fontSize: "14px",
    marginTop: "4px",
  },
  barRow: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: "10px",
    alignItems: "end",
    marginTop: "18px",
  },
  barColumn: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "8px",
  },
  barFill: {
    width: "100%",
    borderRadius: "10px",
    background: "linear-gradient(180deg, #5eead4 0%, #7c3aed 100%)",
  },
  error: {
    border: "1px solid rgba(248, 113, 113, 0.22)",
    background: "rgba(248, 113, 113, 0.08)",
    color: "#fecaca",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
  },
  barLabel: {
    fontSize: "13px",
    color: "#8ea2b8",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    marginBottom: "10px",
  },
  userBlock: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },
  avatar: {
    position: "relative" as const,
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarFallback: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid rgba(94, 234, 212, 0.22)",
    background: "rgba(94, 234, 212, 0.12)",
    color: "#99f6e4",
    display: "grid",
    flexShrink: 0,
    fontSize: "13px",
    fontWeight: 700,
    placeItems: "center",
    textTransform: "uppercase" as const,
  },
  dropThumb: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    objectFit: "cover" as const,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  dropThumbPlaceholder: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#8ea2b8",
    display: "grid",
    placeItems: "center",
    fontSize: "12px",
    flexShrink: 0,
  },
  itemTitle: {
    fontSize: "14px",
    fontWeight: 600,
    margin: 0,
  },
  itemMeta: {
    fontSize: "12px",
    color: "#8ea2b8",
    marginTop: "3px",
  },
  pill: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "999px",
    color: "#cbd5e1",
    padding: "6px 8px",
    fontSize: "12px",
    whiteSpace: "nowrap" as const,
  },
  empty: {
    color: "#8ea2b8",
    fontSize: "14px",
    padding: "8px 0",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },
};

function getProfileInitials(username: string | null | undefined) {
  const normalizedUsername = username?.trim();

  if (!normalizedUsername) {
    return "U";
  }

  return normalizedUsername
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export default async function AdminDashboardPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator") {
    redirect("/");
  }

  let overviewError: string | null = null;
  let overview: AdminOverview = {
    activeUsers: 0,
    monthlyVisitors: [],
    recentDrops: [],
    recentUsers: [],
    totalDrops: 0,
    totalUsers: 0,
  };

  try {
    overview = await getAdminOverview();
  } catch (error) {
    overviewError = error instanceof Error ? error.message : "Failed to load overview data.";
  }

  const statCards = [
    { label: "Total users", value: overview.totalUsers.toLocaleString() },
    { label: "Active now", value: overview.activeUsers.toLocaleString() },
    { label: "Drops", value: overview.totalDrops.toLocaleString() },
  ];
  const maxMonthlyVisitors = Math.max(1, ...overview.monthlyVisitors.map((item) => item.value));

  return (
    <AdminShell>
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Overview</h1>
            </div>
            <div style={styles.badge}>Signed in as {authenticatedUser.profile?.username ?? authenticatedUser.phoneNumber}</div>
          </div>
        </header>

        <section style={styles.statGrid}>
          {overviewError ? (
            <div style={{ ...styles.error, gridColumn: "1 / -1" }}>{overviewError}</div>
          ) : null}
          {statCards.map((card) => (
            <div key={card.label} style={styles.card}>
              <div style={styles.cardLabel}>{card.label}</div>
              <div style={styles.cardValue}>{card.value}</div>
            </div>
          ))}
        </section>

        <section style={styles.twoCol}>
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Monthly visitors</div>
            <div style={styles.sectionSubtitle}>Real sign-up activity from the database.</div>
            <div style={styles.barRow}>
              {(overview.monthlyVisitors.length > 0 ? overview.monthlyVisitors : [
                { label: "No data", value: 0 },
              ]).map((item, index) => (
                <div key={`${item.label}-${index}`} style={styles.barColumn}>
                  <div style={{ ...styles.barFill, height: `${Math.max(8, (item.value / maxMonthlyVisitors) * 100)}%` }} />
                  <span style={styles.barLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>New users</div>
            {overview.recentUsers.length === 0 ? (
              <div style={styles.empty}>No users yet.</div>
            ) : (
              overview.recentUsers.map((user) => {
                const profile = user.profiles?.[0];
                return (
                  <div key={user.id} style={styles.item}>
                    <div style={styles.userBlock}>
                      {profile?.avatar_url ? (
                        <span style={styles.avatar}>
                        <Image
                          src={profile.avatar_url}
                          alt={profile.username ?? "User avatar"}
                          fill
                          sizes="40px"
                          style={{ objectFit: "cover" }}
                        />
                        </span>
                      ) : (
                        <div aria-label={profile?.username ?? "Unnamed user"} style={styles.avatarFallback}>
                          {getProfileInitials(profile?.username)}
                        </div>
                      )}
                      <div>
                        <div style={styles.itemTitle}>{profile?.username ?? "Unnamed user"}</div>
                        <div style={styles.itemMeta}>{new Date(user.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section style={styles.twoCol}>
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Popular drops</div>
            {overview.recentDrops.length === 0 ? (
              <div style={styles.empty}>No drops yet.</div>
            ) : (
              overview.recentDrops.map((drop) => {
                const author = drop.profiles?.[0];
                return (
                  <div key={drop.id} style={styles.item}>
                    <div style={styles.userBlock}>
                      {drop.media_url ? (
                        <Image
                          src={drop.media_url}
                          alt={drop.caption ?? "Drop thumbnail"}
                          width={48}
                          height={48}
                          style={styles.dropThumb}
                        />
                      ) : (
                        <div style={styles.dropThumbPlaceholder}>No media</div>
                      )}
                      <div>
                        <div style={styles.itemTitle}>{drop.caption ?? "Untitled drop"}</div>
                        <div style={styles.itemMeta}>By {author?.username ?? "Unknown"}</div>
                      </div>
                    </div>
                    <span style={styles.pill}>{new Date(drop.created_at).toLocaleDateString()}</span>
                  </div>
                );
              })
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Next steps</div>
            <div style={{ ...styles.itemMeta, lineHeight: 1.7 }}>
              • Add a dedicated users management page.<br />
              • Add moderation actions for drops and reports.<br />
              • Add charts backed by real analytics data.
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
