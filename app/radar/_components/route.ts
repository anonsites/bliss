import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { searchProfilesByCity } from "@/features/discovery/radar-feed";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    const feed = await searchProfilesByCity(user.id, city);
    return NextResponse.json(feed);
  } catch {
    return NextResponse.json({ error: "Failed to search profiles" }, { status: 500 });
  }
}
