import { NextRequest, NextResponse } from "next/server";
import { trackPromoDropView } from "@/features/admin/drops/server";
import { getAuthenticatedUser } from "@/features/auth/server";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as { dropId?: string; source?: string } | null;

  if (!payload?.dropId || payload.source !== "promo") {
    return NextResponse.json({ ok: true });
  }

  try {
    await trackPromoDropView(user.id, payload.dropId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to track view." },
      { status: 500 },
    );
  }
}
