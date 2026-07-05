import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { listAdminUsers } from "@/features/admin/users/server";

function isAdminUser(role: string | null | undefined) {
  return role === "admin" || role === "moderator";
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminUser(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const gender = searchParams.get("gender");
    const search = searchParams.get("search");
    const users = await listAdminUsers({
      gender: gender || undefined,
      search: search || undefined,
      limit: 200,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load users." },
      { status: 500 },
    );
  }
}
