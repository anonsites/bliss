import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { upsertRadarLocationForUser } from "@/features/discovery/radar-feed";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { latitude, longitude, accuracyMeters } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates provided." },
        { status: 400 }
      );
    }

    await upsertRadarLocationForUser({
      accuracyMeters: accuracyMeters || null,
      latitude,
      longitude,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Location update failed:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}