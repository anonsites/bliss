"use client";

import { useRouter } from "next/navigation";
import { EditProfile } from "./EditProfile";
import type { ProfileGender } from "@/features/profile/models";

interface EditProfileWrapperProps {
  initialProfile: {
    username: string;
    bio: string;
    gender: ProfileGender;
    age: number;
    avatarUrl: string;
    isVerified: boolean;
    locationLabel: string | null;
    phoneNumber: string | null;
    birthdate: string;
  };
}

export function EditProfileWrapper({ initialProfile }: EditProfileWrapperProps) {
  const router = useRouter();

  const handleProfileSaved = () => {
    router.push("/profile");
    router.refresh();
  };

  return (
    <EditProfile
      profile={initialProfile}
      onProfileSaved={(updated) => {
        handleProfileSaved();
      }}
    />
  );
}
