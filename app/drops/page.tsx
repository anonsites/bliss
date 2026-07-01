import { getAuthenticatedUser } from "@/features/auth/server";
import { getInsiderDropsFeed } from "@/features/discovery/drops-feed";
import { redirect } from "next/navigation";
import { DropsPageClient } from "./_components/DropsPageClient";

export const dynamic = "force-dynamic";

export default async function DropsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  if (!user.profileCompletedAt) {
    redirect("/checkpoint");
  }

  const { drops, error } = await getInsiderDropsFeed();

  if (error) {
    console.error("Failed to load drops feed:", error);
  }

  return <DropsPageClient initialDrops={drops} />;
}
