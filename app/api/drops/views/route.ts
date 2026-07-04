import { NextRequest, NextResponse } from "next/server";
import { trackPromoDropView } from "@/features/admin/drops/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as { dropId?: string; source?: string } | null;

  if (!payload?.dropId || payload.source !== "promo") {
    // If it's not a promo drop, try to record it in the generic `drop_views` table
    if (payload?.dropId) {
      try {
        await requestSupabaseRest("drop_views", {
          body: { drop_id: payload.dropId, user_id: user.id },
          headers: { Prefer: "return=minimal" },
          method: "POST",
        });
      } catch {
        // Ignore DB errors so the UI doesn't break for users.
      }
    }

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

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ seenDropIds: [] });
  }

  try {
    const rows = await querySupabaseRest<{ drop_id: string }[]>(
      "drop_views",
      new URLSearchParams({ select: "drop_id", user_id: `eq.${user.id}` }),
    );

    return NextResponse.json({ seenDropIds: rows.map((r) => r.drop_id) });
  } catch (error) {
    return NextResponse.json({ seenDropIds: [] });
  }
}
