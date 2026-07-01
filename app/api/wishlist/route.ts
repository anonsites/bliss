import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { toggleWishlistProfile } from "@/features/wishlist/server";

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as { targetUserId?: string };
    const targetUserId = payload.targetUserId?.trim();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required." }, { status: 400 });
    }

    const result = await toggleWishlistProfile(authenticatedUser.id, targetUserId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update wishlist.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
