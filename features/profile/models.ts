export type ProfileGender = "female" | "male";

export interface ProfileEditorData {
  age: number;
  avatarUrl: string | null;
  bio: string;
  gender: ProfileGender;
  isVerified: boolean;
  locationLabel: string;
  phoneNumber: string;
  username: string;
}

export interface ProfileNotificationData {
  createdAt: string | null;
  id: string;
  isRead: boolean;
  text: string;
  timeLabel: string;
}

export interface ProfileSettingsData {
  ghostMode: boolean;
  hideFromContacts: boolean;
  pushNotifications: boolean;
}

export interface ProfilePageData {
  id: string;
  username: string;
  bio: string | null;
  birthdate: string;
  gender: string;
  avatar_url: string;
  is_profile_verified: boolean;
  location_label: string;
  phone_number: string;
  user_media: Array<{ id: string; media_url: string }>;
  drops: Array<{ id: string; media_url: string; created_at: string }>;
  notifications: ProfileNotificationData[];
  settings: ProfileSettingsData;
  blockedUsers: Array<{ id: string; username: string; avatar_url: string }>;
  blockedUsersCount: number;
  hiddenContacts: string[];
}
