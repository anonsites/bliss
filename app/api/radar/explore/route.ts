import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getExploreFeedForUser } from "@/features/discovery/radar-feed";

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feed = await getExploreFeedForUser(authenticatedUser.id);

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch explore feed." }, { status: 500 });
  }
}
