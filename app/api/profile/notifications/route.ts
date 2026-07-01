import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { requestSupabaseRest } from "@/lib/supabase";

type NotificationsResponse = {
  error?: string;
  ok?: true;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to update notifications right now.";
}

export async function PATCH() {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<NotificationsResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    await requestSupabaseRest<unknown>("notifications", {
      body: {
        is_read: true,
      },
      headers: {
        Prefer: "return=minimal",
      },
      method: "PATCH",
      searchParams: new URLSearchParams({
        is_read: "eq.false",
        user_id: `eq.${authenticatedUser.id}`,
      }),
    });

    return NextResponse.json<NotificationsResponse>({ ok: true });
  } catch (error) {
    return NextResponse.json<NotificationsResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<NotificationsResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as { notificationId?: string };
    const notificationId = payload.notificationId?.trim();

    if (!notificationId) {
      throw new Error("Notification id is required.");
    }

    await requestSupabaseRest<unknown>("notifications", {
      headers: {
        Prefer: "return=minimal",
      },
      method: "DELETE",
      searchParams: new URLSearchParams({
        id: `eq.${notificationId}`,
        user_id: `eq.${authenticatedUser.id}`,
      }),
    });

    return NextResponse.json<NotificationsResponse>({ ok: true });
  } catch (error) {
    return NextResponse.json<NotificationsResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
