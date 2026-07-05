import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { listAdminChatThreads, getAdminConversation } from "@/features/admin/messages/server";

function isAdminUser(role: string | null | undefined) {
  return role === "admin" || role === "moderator";
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminUser(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const chatId = request.nextUrl.searchParams.get("chatId");

    if (chatId) {
      const conversation = await getAdminConversation(chatId);

      if (!conversation) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      return NextResponse.json({ conversation });
    }

    const threads = await listAdminChatThreads();
    return NextResponse.json({ threads });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load messages." },
      { status: 500 },
    );
  }
}
