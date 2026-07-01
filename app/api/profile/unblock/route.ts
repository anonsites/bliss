import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { requestSupabaseRest } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Delete the block record
    await requestSupabaseRest(
      "blocks",
      {
        method: "DELETE",
        searchParams: new URLSearchParams({
          user_id: `eq.${authenticatedUser.id}`,
          blocked_user_id: `eq.${userId}`,
        }),
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unblock error:", error);
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
  }
}