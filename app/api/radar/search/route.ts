import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { searchProfilesByCity } from "@/features/discovery/radar-feed";

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim();

    if (!city) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }

    const feed = await searchProfilesByCity(authenticatedUser.id, city);

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to search profiles." }, { status: 500 });
  }
}
