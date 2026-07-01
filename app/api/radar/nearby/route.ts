import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getRadarFeedForUser } from "@/features/discovery/radar-feed";

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feed = await getRadarFeedForUser(authenticatedUser.id);

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch nearby feed." }, { status: 500 });
  }
}
