import { NextRequest, NextResponse } from "next/server";
import { createAdminPromoDrop, listAdminPromoDrops } from "@/features/admin/drops/server";
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
    return NextResponse.json({ drops: await listAdminPromoDrops() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load drops." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const drop = await createAdminPromoDrop(await request.formData(), user.id);
    return NextResponse.json({ drop }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish drop." },
      { status: 400 },
    );
  }
}
