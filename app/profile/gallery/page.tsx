import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getProfilePageData } from "@/features/profile/server";
import { ProfilePageWithBack } from "../_components/ProfilePageWithBack";
import { UserGallery } from "../_components/UserGallery";

export default async function GalleryPage() {
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

  return (
    <ProfilePageWithBack title="Gallery">
      <UserGallery
        username={profilePageData.username}
        media={profilePageData.user_media}
      />
    </ProfilePageWithBack>
  );
}
