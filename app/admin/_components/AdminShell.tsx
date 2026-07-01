"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/drops", label: "Drops" },
  { href: "/admin/messages", label: "Messages" },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #06070b 0%, #0d1117 100%)",
    color: "#f8fafc",
    fontFamily: "Inter, 'Segoe UI', sans-serif",
    padding: "24px",
  },
  shell: {
    maxWidth: "1380px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },
  navbar: {
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    background: "rgba(10, 15, 24, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "18px 22px",
    boxShadow: "0 16px 46px rgba(0,0,0,0.26)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    backdropFilter: "blur(10px)",
  },
  brand: {
    display: "flex",
    flexDirection: "column" as const,
    minWidth: "180px",
  },
  eyebrow: {
    fontSize: "12px",
    letterSpacing: "0.3em",
    textTransform: "uppercase" as const,
    color: "#5eead4",
    marginBottom: "4px",
  },
  heading: {
    fontSize: "20px",
    fontWeight: 700,
    margin: 0,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap" as const,
  },
  navLink: {
    textDecoration: "none",
    color: "#dbe2eb",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  navLinkActive: {
    background: "rgba(94, 234, 212, 0.15)",
    color: "#5eead4",
    boxShadow: "inset 0 0 0 1px rgba(94, 234, 212, 0.2)",
  },
  content: {
    flex: 1,
  },
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.navbar}>
          <div style={styles.brand}>
            <h2 style={styles.heading}>MY DASHBOARD</h2>
          </div>

          <nav style={styles.nav}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...styles.navLink,
                    ...(isActive ? styles.navLinkActive : {}),
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}
