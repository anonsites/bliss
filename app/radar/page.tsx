import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getRadarFeedForUser } from "@/features/discovery/radar-feed";
import { RadarPageClient } from "./_components/RadarPageClient";
import { LocationPermissionRequest } from "@/components/ui/LocationPermissionRequest";

export default async function RadarPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (authenticatedUser.role === "admin" || authenticatedUser.role === "moderator") {
    redirect("/admin");
  }

  const radarFeed = await getRadarFeedForUser(authenticatedUser.id);

  if (radarFeed.error?.includes("Enable location")) {
    return <LocationPermissionRequest message={radarFeed.error} />;
  }

  return (
    <RadarPageClient
      initialError={radarFeed.error ?? null}
      profiles={radarFeed.profiles}
    />
  );
}
