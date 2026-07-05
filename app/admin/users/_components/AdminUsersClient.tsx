"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AdminUser } from "@/features/admin/users/server";

const styles = {
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    marginBottom: "18px",
  },
  input: {
    width: "100%",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "#f8fafc",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
  },
  select: {
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "#f8fafc",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    textAlign: "left" as const,
    padding: "16px 12px",
    color: "#9fb0c6",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  td: {
    padding: "14px 12px",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "middle" as const,
  },
  avatar: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },
  avatarCircle: {
    display: "inline-grid",
    placeItems: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(94,234,212,0.12)",
    color: "#99f6e4",
    fontWeight: 700,
    fontSize: "13px",
  },
  avatarImage: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.04)",
  },
  empty: {
    padding: "28px 16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    color: "#9fb0c6",
    textAlign: "center" as const,
  },
  rowActions: {
    display: "flex",
    gap: "10px",
  },
  button: {
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "8px 14px",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    fontSize: "13px",
    cursor: "default",
  },
};

function getInitials(username: string | null | undefined) {
  const trimmed = username?.trim();

  if (!trimmed) {
    return "U";
  }

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

interface Props {
  initialUsers: AdminUser[];
}

export function AdminUsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!search.trim() && !genderFilter) {
      return users;
    }

    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesGender = genderFilter ? user.gender === genderFilter : true;
      const matchesSearch = normalizedSearch
        ? user.username.toLowerCase().includes(normalizedSearch) || (user.city ?? "").toLowerCase().includes(normalizedSearch)
        : true;

      return matchesGender && matchesSearch;
    });
  }, [users, genderFilter, search]);

  async function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (genderFilter) params.set("gender", genderFilter);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to load users.");
      }

      const payload = await response.json() as { users: AdminUser[] };
      setUsers(payload.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearchSubmit} style={styles.filters}>
        <input
          aria-label="Search by username or city"
          placeholder="Search username or city"
          style={styles.input}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", minWidth: 0 }}>
          <select
            aria-label="Filter by gender"
            style={styles.select}
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
          >
            <option value="">All genders</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <button type="submit" style={styles.button}>Search</button>
        </div>
      </form>

      {error ? <div style={styles.empty}>{error}</div> : null}

      {filteredUsers.length === 0 ? (
        <div style={styles.empty}>No users found.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Gender</th>
              <th style={styles.th}>City</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>
                  <div style={styles.avatar}>
                    {user.avatar_url ? (
                      <div style={styles.avatarImage}>
                        <Image
                          src={user.avatar_url}
                          alt={user.username || "User avatar"}
                          width={40}
                          height={40}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <span style={styles.avatarCircle}>{getInitials(user.username)}</span>
                    )}
                    <span>{user.username}</span>
                  </div>
                </td>
                <td style={styles.td}>{user.gender}</td>
                <td style={styles.td}>{user.city ?? "—"}</td>
                <td style={styles.td}>{user.phone_number ?? "—"}</td>
                <td style={styles.td}>
                  <div style={styles.rowActions}>
                    <button type="button" style={styles.button} disabled>{isLoading ? "Loading..." : "Pending"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
