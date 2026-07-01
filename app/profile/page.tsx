import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getProfilePageData } from "@/features/profile/server";
import { ProfilePageClient } from "./_components/ProfilePageClient";

export default async function ProfilePage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (!authenticatedUser.profileCompletedAt) {
    redirect("/checkpoint");
  }

  const profilePageData = await getProfilePageData(authenticatedUser.id);

  if (!profilePageData) {
    redirect("/checkpoint");
  }

  return <ProfilePageClient initialData={profilePageData} />;
}
