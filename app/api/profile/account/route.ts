import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  clearSessionCookie,
  getAuthenticatedUser,
  revokeSession,
} from "@/features/auth/server";

type AccountActionResponse = {
  error?: string;
  ok?: true;
};

function getAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    serviceRoleKey,
    supabaseUrl,
  };
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<AccountActionResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const adminConfig = getAdminConfig();

    if (!adminConfig) {
      throw new Error("Supabase admin is not configured.");
    }

    const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;

    if (sessionToken) {
      await revokeSession(sessionToken);
    }

    const response = await fetch(
      `${adminConfig.supabaseUrl}/auth/v1/admin/users/${authenticatedUser.id}`,
      {
        headers: {
          Authorization: `Bearer ${adminConfig.serviceRoleKey}`,
          apikey: adminConfig.serviceRoleKey,
        },
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Unable to delete account (${response.status}): ${errorBody}`);
    }

    const nextResponse = NextResponse.json<AccountActionResponse>({ ok: true });
    clearSessionCookie(nextResponse);

    return nextResponse;
  } catch (error) {
    return NextResponse.json<AccountActionResponse>(
      {
        error: error instanceof Error && error.message
          ? error.message
          : "Unable to delete your account right now.",
      },
      { status: 400 },
    );
  }
}
