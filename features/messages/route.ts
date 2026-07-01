import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { createChatThread } from "@/features/messages/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Target user ID is required." }, { status: 400 });
    }

    const result = await createChatThread(user.id, targetUserId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create chat.";
    // Returning 400 allows the client to show the error (e.g. "Out of range")
    return NextResponse.json({ error: message }, { status: 400 });
  }
}