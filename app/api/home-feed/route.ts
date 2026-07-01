import { NextRequest, NextResponse } from "next/server";
import { getHomeFeedPreview } from "@/features/discovery/home-feed";
import { extractClientIp } from "@/lib/get-ip";

function parseCoordinate(value: string | null) {
  if (!value) {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function parseLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  return Number.isFinite(limit) ? limit : undefined;
}

export async function GET(request: NextRequest) {
  const latitude = parseCoordinate(request.nextUrl.searchParams.get("latitude"));
  const longitude = parseCoordinate(request.nextUrl.searchParams.get("longitude"));
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const feed = await getHomeFeedPreview({
    coordinates:
      latitude !== null && longitude !== null
        ? { latitude, longitude }
        : undefined,
    ip: extractClientIp(request.headers),
    limit,
  });

  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
