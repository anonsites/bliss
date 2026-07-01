import { HomePageClient } from "@/components/home/HomePageClient";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getHomeFeedPreview } from "@/features/discovery/home-feed";
import { getUserIP } from "@/lib/get-ip";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (authenticatedUser) {
    redirect("/radar");
  }

  const ip = await getUserIP();
  const initialFeed = await getHomeFeedPreview({ ip, limit: 18 });

  return <HomePageClient initialFeed={initialFeed} />;
}
