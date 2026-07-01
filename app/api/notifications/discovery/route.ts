/**
 * API endpoint to check and send discovery notifications
 * This can be called periodically by a cron job or background task
 * Example: GET /api/notifications/discovery?userId=user-123
 * Or call checkAndNotifyAboutDiscoveryContent(userId) from other endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { checkAndNotifyAboutDiscoveryContent } from "@/features/discovery/notifications";

type NotificationResponse = {
  error?: string;
  success?: boolean;
};

/**
 * GET /api/notifications/discovery
 * Trigger discovery notifications for the current user
 * This checks for nearby profiles and drops and notifies if found
 */
export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<NotificationResponse>(
        { error: "You need to sign in again." },
        { status: 401 }
      );
    }

    // Check and send notifications about nearby content
    await checkAndNotifyAboutDiscoveryContent(authenticatedUser.id);

    return NextResponse.json<NotificationResponse>({
      success: true,
    });
  } catch (error) {
    console.error("Error checking discovery notifications:", error);
    return NextResponse.json<NotificationResponse>(
      { error: "Unable to check notifications." },
      { status: 400 }
    );
  }
}
