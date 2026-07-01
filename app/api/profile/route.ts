import { NextRequest, NextResponse } from "next/server";
import { buildPhoneEmailAlias, calculateBirthdateFromAge, getAuthenticatedUser, normalizeGender, normalizePhoneNumber } from "@/features/auth/server";
import type { ProfileGender } from "@/features/profile/models";
import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";
import { requestSupabaseRest } from "@/lib/supabase";

type ProfileUpdateResponse = {
  error?: string;
  profile?: {
    age: number;
    bio: string;
    birthdate: string;
    gender: ProfileGender;
    locationLabel?: string;
    phoneNumber?: string;
    username: string;
  };
};

type ProfileMeResponse = {
  error?: string;
  profile?: {
    avatarUrl: string | null;
    username: string | null;
  };
};

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "Unable to update your profile right now.";
  }

  if (error.message.includes("profiles_username_lower_key") || error.message.includes("username")) {
    return "That username is already taken.";
  }

  return error.message;
}

export async function GET(): Promise<NextResponse<ProfileMeResponse>> {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<ProfileMeResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const profileRows = await requestSupabaseRest<Array<{ avatar_url: string | null; username: string | null }>>(
      "profiles",
      {
        method: "GET",
        searchParams: new URLSearchParams({
          limit: "1",
          select: "avatar_url,username",
          user_id: `eq.${authenticatedUser.id}`,
        }),
      },
    );

    const profile = profileRows?.[0];
    const avatarUrl = profile?.avatar_url?.trim()
      ? resolveCloudinaryMediaUrl(profile.avatar_url, "image") ?? profile.avatar_url
      : null;

    return NextResponse.json<ProfileMeResponse>({
      profile: {
        avatarUrl,
        username: profile?.username?.trim() ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json<ProfileMeResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<ProfileUpdateResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as {
      age?: number;
      bio?: string;
      birthdate?: string;
      gender?: string;
      locationLabel?: string;
      phoneNumber?: string;
      username?: string;
    };
    const username = payload.username?.trim();
    const bio = payload.bio?.trim() ?? "";
    const birthdate = payload.birthdate?.trim();
    const locationLabel = payload.locationLabel?.trim();
    const phoneNumber = payload.phoneNumber !== undefined ? normalizePhoneNumber(payload.phoneNumber) : undefined;

    if (!username) {
      throw new Error("Username is required.");
    }

    let normalizedBirthdate: string;
    let age: number;

    if (birthdate) {
      const parsedBirthdate = new Date(`${birthdate}T00:00:00.000Z`);

      if (Number.isNaN(parsedBirthdate.getTime())) {
        throw new Error("Birthdate is invalid.");
      }

      normalizedBirthdate = parsedBirthdate.toISOString().slice(0, 10);
      age = new Date().getUTCFullYear() - parsedBirthdate.getUTCFullYear();

      const monthDifference = new Date().getUTCMonth() - parsedBirthdate.getUTCMonth();

      if (
        monthDifference < 0 ||
        (monthDifference === 0 && new Date().getUTCDate() < parsedBirthdate.getUTCDate())
      ) {
        age -= 1;
      }

      if (!Number.isInteger(age) || age < 18 || age > 120) {
        throw new Error("Age must be between 18 and 120.");
      }
    } else {
      age = Number(payload.age);

      if (!Number.isInteger(age)) {
        throw new Error("Age must be a whole number.");
      }

      normalizedBirthdate = calculateBirthdateFromAge(age);
    }

    const gender = normalizeGender(payload.gender ?? "");

    if (locationLabel !== undefined && locationLabel.length > 80) {
      throw new Error("City must be 80 characters or fewer.");
    }

    await requestSupabaseRest<unknown>("profiles", {
      body: {
        bio,
        birthdate: normalizedBirthdate,
        gender,
        username,
      },
      headers: {
        Prefer: "return=minimal",
      },
      method: "PATCH",
      searchParams: new URLSearchParams({
        user_id: `eq.${authenticatedUser.id}`,
      }),
    });

    if (locationLabel !== undefined) {
      await requestSupabaseRest<unknown>("user_locations", {
        body: {
          ip_city: locationLabel,
        },
        headers: {
          Prefer: "return=minimal",
        },
        method: "PATCH",
        searchParams: new URLSearchParams({
          user_id: `eq.${authenticatedUser.id}`,
        }),
      });
    }

    if (phoneNumber !== undefined) {
      await requestSupabaseRest<unknown>("users", {
        body: {
          email_alias: buildPhoneEmailAlias(phoneNumber),
          phone_number: phoneNumber,
        },
        headers: {
          Prefer: "return=minimal",
        },
        method: "PATCH",
        searchParams: new URLSearchParams({
          id: `eq.${authenticatedUser.id}`,
        }),
      });
    }

    return NextResponse.json<ProfileUpdateResponse>({
      profile: {
        age,
        bio,
        birthdate: normalizedBirthdate,
        gender,
        ...(locationLabel !== undefined ? { locationLabel } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        username,
      },
    });
  } catch (error) {
    return NextResponse.json<ProfileUpdateResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
