import { NextRequest, NextResponse } from "next/server";
import { createAdminPromoProfile, listAdminPromoProfiles } from "@/features/admin/promo-profiles/server";
import { getAuthenticatedUser } from "@/features/auth/server";

function isAdminRole(role: string | null | undefined) {
  return role === "admin" || role === "moderator";
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json({ profiles: await listAdminPromoProfiles() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load profiles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const profile = await createAdminPromoProfile(await request.formData(), user.id);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create profile." }, { status: 400 });
  }
}
