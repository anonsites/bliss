import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  clearSessionCookie,
  revokeSession,
} from "@/features/auth/server";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;

  await revokeSession(sessionToken);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}
