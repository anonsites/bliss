import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getProfilePageData } from "@/features/profile/server";
import { ProfilePageWithBack } from "../_components/ProfilePageWithBack";
import { Privacy } from "../_components/Privacy";

export default async function PrivacyPage() {
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
    <ProfilePageWithBack title="Privacy">
      <Privacy
        blockedUsers={profilePageData.blockedUsers}
        hiddenContacts={profilePageData.hiddenContacts || []}
        initialPhoneVisibility={profilePageData.settings.hideFromContacts}
        initialPushNotifications={profilePageData.settings.pushNotifications}
      />
    </ProfilePageWithBack>
  );
}
