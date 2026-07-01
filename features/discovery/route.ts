import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getRadarFeedForUser } from "@/features/discovery/radar-feed";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feed = await getRadarFeedForUser(user.id);
    return NextResponse.json(feed);
  } catch {
    return NextResponse.json({ error: "Failed to fetch nearby feed" }, { status: 500 });
  }
}
