import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import type { ProfileSettingsData } from "@/features/profile/models";
import { querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";

type UserSettingsRow = {
  ghost_mode: boolean | null;
  hide_from_contacts: boolean | null;
  push_notifications: boolean | null;
};

type SettingsResponse = {
  error?: string;
  settings?: ProfileSettingsData;
};

const DEFAULT_SETTINGS: ProfileSettingsData = {
  ghostMode: false,
  hideFromContacts: true,
  pushNotifications: false,
};

function mapSettings(row: UserSettingsRow | null | undefined): ProfileSettingsData {
  if (!row) {
    return DEFAULT_SETTINGS;
  }

  return {
    ghostMode: Boolean(row.ghost_mode),
    hideFromContacts: row.hide_from_contacts ?? true,
    pushNotifications: row.push_notifications ?? false,
  };
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "Unable to save your settings right now.";
  }

  if (error.message.includes("user_settings")) {
    return "Apply the latest schema.sql changes to enable settings sync.";
  }

  return error.message;
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<SettingsResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as Partial<ProfileSettingsData>;
    const updates: Record<string, boolean> = {};

    if (typeof payload.hideFromContacts === "boolean") {
      updates.hide_from_contacts = payload.hideFromContacts;
    }

    if (typeof payload.ghostMode === "boolean") {
      updates.ghost_mode = payload.ghostMode;
    }

    if (typeof payload.pushNotifications === "boolean") {
      updates.push_notifications = payload.pushNotifications;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid settings were provided.");
    }

    await requestSupabaseRest<unknown>("user_settings", {
      body: {
        user_id: authenticatedUser.id,
        ...updates,
      },
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      method: "POST",
      searchParams: new URLSearchParams({
        on_conflict: "user_id",
      }),
    });

    const settingsRows = await querySupabaseRest<UserSettingsRow[]>(
      "user_settings",
      new URLSearchParams({
        limit: "1",
        select: "hide_from_contacts,ghost_mode,push_notifications",
        user_id: `eq.${authenticatedUser.id}`,
      }),
    );

    return NextResponse.json<SettingsResponse>({
      settings: mapSettings(settingsRows[0]),
    });
  } catch (error) {
    return NextResponse.json<SettingsResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
