import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getProfilePageData } from "@/features/profile/server";
import { ProfilePageWithBack } from "../_components/ProfilePageWithBack";
import { EditProfileWrapper } from "../_components/EditProfileWrapper";

function calculateAge(birthdate: string) {
  const parsedBirthdate = new Date(`${birthdate}T00:00:00.000Z`);

  if (Number.isNaN(parsedBirthdate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getUTCFullYear() - parsedBirthdate.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - parsedBirthdate.getUTCMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < parsedBirthdate.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

export default async function EditPage() {
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
    <ProfilePageWithBack title="Edit Profile">
      <EditProfileWrapper initialProfile={{
        username: profilePageData.username,
        bio: profilePageData.bio ?? "",
        gender: profilePageData.gender as any,
        age: calculateAge(profilePageData.birthdate) ?? 0,
        avatarUrl: profilePageData.avatar_url,
        isVerified: profilePageData.is_profile_verified,
        locationLabel: profilePageData.location_label,
        phoneNumber: profilePageData.phone_number,
        birthdate: profilePageData.birthdate,
      }} />
    </ProfilePageWithBack>
  );
}
