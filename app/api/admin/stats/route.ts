import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getAdminOverview } from "@/features/admin/overview";

export async function GET() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser || (authenticatedUser.role !== "admin" && authenticatedUser.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json(await getAdminOverview());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
