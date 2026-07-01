import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import {
  getRadarFeedForUser,
  upsertRadarLocationForUser,
} from "@/features/discovery/radar-feed";

type RadarLocationPayload = {
  accuracyMeters?: number | null;
  latitude?: number;
  longitude?: number;
};

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function GET() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const feed = await getRadarFeedForUser(authenticatedUser.id);

  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const payload = (await request.json()) as RadarLocationPayload;

    if (!isFiniteCoordinate(payload.latitude) || !isFiniteCoordinate(payload.longitude)) {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required." },
        { status: 400 },
      );
    }

    await upsertRadarLocationForUser({
      accuracyMeters:
        typeof payload.accuracyMeters === "number" && Number.isFinite(payload.accuracyMeters)
          ? payload.accuracyMeters
          : null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      userId: authenticatedUser.id,
    });

    const feed = await getRadarFeedForUser(authenticatedUser.id);

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to refresh Radar with your current location." },
      { status: 400 },
    );
  }
}
