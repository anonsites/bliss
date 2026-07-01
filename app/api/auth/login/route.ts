import { NextRequest, NextResponse } from "next/server";
import type { AuthActionResponse } from "@/features/auth";
import {
  applySessionCookie,
  buildPhoneEmailAlias,
  createAuthSession,
  normalizePhoneNumber,
  updateUserLastLogin,
} from "@/features/auth/server";
import { extractClientIp } from "@/lib/get-ip";
import { syncUserIpCityFromIP } from "@/services/geo";
import { querySupabaseRest } from "@/lib/supabase";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to sign you in right now.";
}

type PublicUser = {
  id: string;
  profile_completed_at: string | null;
  role: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      password?: string;
      phoneNumber?: string;
    };
    const clientIp = extractClientIp(request.headers);
    const phoneNumber = normalizePhoneNumber(payload.phoneNumber ?? "");
    const password = payload.password ?? "";
    const email = buildPhoneEmailAlias(phoneNumber);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    //TODO: catch this error with error alert with something went wrong message.
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase is not configured.");
    }

    // 1. Authenticate via Supabase Auth
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      method: "POST",
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      throw new Error(errorData.error_description || "The phone number or password is incorrect.");
    }

    const { user: authUser } = await authResponse.json();
    if (!authUser?.id) {
      throw new Error("Authentication failed: No user returned.");
    }

    // 2. Fetch user from public table to get profile status
    const users = await querySupabaseRest<PublicUser[]>(
      "users",
      new URLSearchParams({
        id: `eq.${authUser.id}`,
        limit: "1",
        select: "id,profile_completed_at,role",
      }),
    );
    const user = users[0];

    if (!user) {
      throw new Error("Authentication failed: User not found in public records.");
    }

    // 3. Update login stats and create custom session
    await Promise.all([
      updateUserLastLogin(user.id),
      syncUserIpCityFromIP(user.id, clientIp),
    ]);

    const session = await createAuthSession(user.id, {
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });
    const response = NextResponse.json<AuthActionResponse>({
      redirectTo:
        user.role === "admin" || user.role === "moderator"
          ? "/admin"
          : user.profile_completed_at
            ? "/radar"
            : "/checkpoint",
      userId: user.id,
    });

    applySessionCookie(response, session);

    return response;
  } catch (error) {
    return NextResponse.json<AuthActionResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
