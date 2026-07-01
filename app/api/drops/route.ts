import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getInsiderDropsFeed } from "@/features/discovery/drops-feed";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { drops, error } = await getInsiderDropsFeed();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ drops });
}
