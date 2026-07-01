import "server-only";

import {
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";
import { querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";

export const AUTH_SESSION_COOKIE_NAME = "bliss_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_TOUCH_INTERVAL_MS = 1000 * 60 * 2;

type SessionCookieResponse = {
  cookies: {
    set: (options: {
      expires: Date;
      httpOnly: boolean;
      name: string;
      path: string;
      sameSite: "lax";
      secure: boolean;
      value: string;
    }) => unknown;
  };
};

type UserRecord = {
  email_alias: string | null;
  id: string;
  last_login_at: string | null;
  phone_number: string;
  profile_completed_at: string | null;
  role: string | null;
};

type SessionRecord = {
  expires_at: string;
  id: string;
  last_seen_at: string;
  revoked_at: string | null;
  user_id: string;
};

type ProfileRecord = {
  avatar_url: string | null;
  id: string;
  user_id: string;
  username: string;
};

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  profile: ProfileRecord | null;
  profileCompletedAt: string | null;
  role: string | null;
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizePhoneNumber(value: string) {
  const normalizedValue = value.trim().replace(/[^\d+]/g, "");

  if (!/^\+[1-9]\d{7,14}$/.test(normalizedValue)) {
    throw new Error("Please enter a valid phone number.");
  }

  return normalizedValue;
}

export function buildPhoneEmailAlias(phoneNumber: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  // Use digits only for the alias to avoid special characters in email
  const phoneDigits = normalizedPhone.replace(/[^\d]/g, "");
  return `phone-${phoneDigits}@bliss.com`;
}

export function normalizeGender(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue !== "male" && normalizedValue !== "female") {
    throw new Error("Please select a valid gender.");
  }

  return normalizedValue;
}

export function calculateBirthdateFromAge(age: number) {
  if (!Number.isInteger(age) || age < 18 || age > 120) {
    throw new Error("Age must be between 18 and 120.");
  }

  const birthdate = new Date();
  birthdate.setUTCFullYear(birthdate.getUTCFullYear() - age);

  return birthdate.toISOString().slice(0, 10);
}

function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

async function queryUsersByPhoneIdentity<T>(options: {
  emailAlias: string;
  select: string;
}) {
  const { emailAlias, select } = options;

  return querySupabaseRest<T>(
    "users",
    new URLSearchParams({
      email_alias: `eq.${emailAlias}`,
      limit: "1",
      select,
    }),
  );
}

export async function ensurePhoneNumberAvailable(phoneNumber: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const emailAlias = buildPhoneEmailAlias(normalizedPhone);
  const users = await queryUsersByPhoneIdentity<Pick<UserRecord, "id">[]>({
    emailAlias,
    select: "id",
  });

  if (users.length > 0) {
    throw new Error("An account with this phone number already exists.");
  }
}

export async function updateUserLastLogin(userId: string) {
  await requestSupabaseRest<unknown>("users", {
    body: {
      last_login_at: nowIso(),
    },
    headers: {
      Prefer: "return=minimal",
    },
    method: "PATCH",
    searchParams: new URLSearchParams({
      id: `eq.${userId}`,
    }),
  });
}

export async function createAuthSession(
  userId: string,
  metadata?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await requestSupabaseRest<unknown>("auth_sessions", {
    body: {
      expires_at: expiresAt,
      ip_address: metadata?.ipAddress ?? null,
      session_token: sessionToken,
      user_agent: metadata?.userAgent ?? null,
      user_id: userId,
    },
    headers: {
      Prefer: "return=minimal",
    },
    method: "POST",
  });

  return {
    expiresAt,
    sessionToken,
  };
}

export function applySessionCookie(
  response: SessionCookieResponse,
  session: { expiresAt: string; sessionToken: string },
) {
  response.cookies.set({
    expires: new Date(session.expiresAt),
    httpOnly: true,
    name: AUTH_SESSION_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: session.sessionToken,
  });
}

export async function revokeSession(sessionToken: string | null | undefined) {
  if (!sessionToken) {
    return;
  }

  await requestSupabaseRest<unknown>("auth_sessions", {
    body: {
      revoked_at: nowIso(),
    },
    headers: {
      Prefer: "return=minimal",
    },
    method: "PATCH",
    searchParams: new URLSearchParams({
      revoked_at: "is.null",
      session_token: `eq.${sessionToken}`,
    }),
  });
}

async function touchSession(sessionId: string) {
  await requestSupabaseRest<unknown>("auth_sessions", {
    body: {
      last_seen_at: nowIso(),
    },
    headers: {
      Prefer: "return=minimal",
    },
    method: "PATCH",
    searchParams: new URLSearchParams({
      id: `eq.${sessionId}`,
      revoked_at: "is.null",
    }),
  });
}

export function clearSessionCookie(
  response: SessionCookieResponse,
) {
  response.cookies.set({
    expires: new Date(0),
    httpOnly: true,
    name: AUTH_SESSION_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: "",
  });
}

async function getSessionRecord(sessionToken: string) {
  const sessions = await querySupabaseRest<SessionRecord[]>(
    "auth_sessions",
    new URLSearchParams({
      limit: "1",
      revoked_at: "is.null",
      select: "id,user_id,expires_at,revoked_at,last_seen_at",
      session_token: `eq.${sessionToken}`,
    }),
  );

  const session = sessions[0] ?? null;

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return null;
  }

  const lastSeenAt = new Date(session.last_seen_at).getTime();

  if (Number.isNaN(lastSeenAt) || Date.now() - lastSeenAt >= SESSION_TOUCH_INTERVAL_MS) {
    try {
      await touchSession(session.id);
    } catch (error) {
      console.error("Failed to update session activity timestamp:", error);
    }
  }

  return session;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await getSessionRecord(sessionToken);

  if (!session) {
    return null;
  }

  const [users, profiles] = await Promise.all([
    querySupabaseRest<Array<Pick<UserRecord, "id" | "phone_number" | "profile_completed_at" | "role">>>(
      "users",
      new URLSearchParams({
        id: `eq.${session.user_id}`,
        limit: "1",
        select: "id,phone_number,profile_completed_at,role",
      }),
    ),
    querySupabaseRest<ProfileRecord[]>(
      "profiles",
      new URLSearchParams({
        limit: "1",
        select: "id,user_id,username,avatar_url",
        user_id: `eq.${session.user_id}`,
      }),
    ),
  ]);

  const user = users[0] ?? null;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    phoneNumber: user.phone_number,
    profile: profiles[0] ?? null,
    profileCompletedAt: user.profile_completed_at,
    role: user.role,
  };
}
