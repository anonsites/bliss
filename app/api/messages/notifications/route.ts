import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import {
  getMessageNotificationEvents,
  type MessageNotificationEvent,
} from "@/features/messages/server";

type MessageNotificationsResponse = {
  error?: string;
  events?: MessageNotificationEvent[];
  nextCursor?: string;
};

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<MessageNotificationsResponse>(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const since = request.nextUrl.searchParams.get("since");

    if (!since) {
      return NextResponse.json<MessageNotificationsResponse>(
        { error: "Notification cursor is required." },
        { status: 400 },
      );
    }

    const events = await getMessageNotificationEvents(authenticatedUser.id, since);
    const nextCursor = events.at(-1)?.createdAt ?? since;

    return NextResponse.json<MessageNotificationsResponse>({
      events,
      nextCursor,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load message notifications.";

    return NextResponse.json<MessageNotificationsResponse>(
      { error: message },
      { status: 400 },
    );
  }
}
