import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { AuthActionResponse } from "@/features/auth";
import {
  applySessionCookie,
  buildPhoneEmailAlias,
  calculateBirthdateFromAge,
  createAuthSession,
  ensurePhoneNumberAvailable,
  normalizeGender,
  normalizePhoneNumber,
} from "@/features/auth/server";
import {
  CLOUDINARY_UPLOAD_FOLDERS,
  uploadFileToCloudinary,
} from "@/lib/cloudinary";
import { extractClientIp } from "@/lib/get-ip";
import { querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";
import { getGeoFromIP } from "@/services/geo";

type SupabaseSignupResponse = {
  data?: {
    user?: {
      id?: string | null;
    } | null;
  } | null;
  id?: string | null;
  user?: {
    id?: string | null;
  } | null;
};

function resolveCreatedUserId(payload: SupabaseSignupResponse) {
  return payload.user?.id ?? payload.data?.user?.id ?? payload.id ?? null;
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "Unable to create your account right now.";
  }

  if (error.message.includes("users_phone_hash_key") || error.message.includes("users_phone_number_key")) {
    return "An account with this phone number already exists.";
  }

  if (error.message.includes("users_email_alias_key")) {
    return "An account with this phone number already exists.";
  }

  return error.message;
}

function requireTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${fieldName}.`);
  }

  return value;
}

function requireImageFile(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    throw new Error(`Missing ${fieldName}.`);
  }

  if (!value.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported during registration.");
  }

  return value;
}

function parseRequiredNumber(value: string, fieldName: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return numericValue;
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadKey = randomUUID();
    const clientIp = extractClientIp(request.headers);
    const phoneNumber = normalizePhoneNumber(requireTextField(formData, "phoneNumber"));
    const password = requireTextField(formData, "password");
    const username = requireTextField(formData, "username").trim();
    const age = parseRequiredNumber(requireTextField(formData, "age"), "age");
    const gender = normalizeGender(requireTextField(formData, "gender"));
    const latitude = parseRequiredNumber(requireTextField(formData, "latitude"), "latitude");
    const longitude = parseRequiredNumber(requireTextField(formData, "longitude"), "longitude");
    const profileImage = requireImageFile(formData, "profileImage");
    const galleryImage0 = requireImageFile(formData, "galleryImage0");
    const galleryImage1 = requireImageFile(formData, "galleryImage1");

    await ensurePhoneNumberAvailable(phoneNumber);

    const [avatarUpload, galleryUpload0, galleryUpload1, ipLocation] = await Promise.all([
      uploadFileToCloudinary(profileImage, {
        folder: CLOUDINARY_UPLOAD_FOLDERS.profiles,
        publicId: `${uploadKey}-avatar`,
      }),
      uploadFileToCloudinary(galleryImage0, {
        folder: CLOUDINARY_UPLOAD_FOLDERS.gallery,
        publicId: `${uploadKey}-gallery-1`,
      }),
      uploadFileToCloudinary(galleryImage1, {
        folder: CLOUDINARY_UPLOAD_FOLDERS.gallery,
        publicId: `${uploadKey}-gallery-2`,
      }),
      getGeoFromIP(clientIp),
    ]);

    const email = buildPhoneEmailAlias(phoneNumber);
    const birthdate = calculateBirthdateFromAge(age);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase is not configured.");
    }

    // 1. Sign up via Supabase Auth
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      body: JSON.stringify({
        data: {
          avatar_url: avatarUpload.publicId,
          birthdate,
          gender,
          username,
        },
        email,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      method: "POST",
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      throw new Error(errorData.msg || errorData.message || "Registration failed.");
    }

    const authPayload = (await authResponse.json()) as SupabaseSignupResponse;
    let createdUserId = resolveCreatedUserId(authPayload);

    if (!createdUserId) {
      const users = await querySupabaseRest<{ id: string }[]>(
        "users",
        new URLSearchParams({
          email_alias: `eq.${email}`,
          limit: "1",
          select: "id",
        }),
      );
      createdUserId = users[0]?.id ?? null;
    }

    if (!createdUserId) {
      throw new Error("Registration failed: No user ID returned.");
    }

    // 2. Post-signup: Update public tables with data not handled by trigger
    await Promise.all([
      // Update phone number (trigger sets it to null for email signups)
      requestSupabaseRest("users", {
        body: {
          phone_number: phoneNumber,
          profile_completed_at: new Date().toISOString(),
        },
        headers: {
          Prefer: "return=minimal",
        },
        method: "PATCH",
        searchParams: new URLSearchParams({ id: `eq.${createdUserId}` }),
      }),
      // Insert Location
      requestSupabaseRest("user_locations", {
        body: { accuracy_meters: null, ip_city: ipLocation?.city ?? null, latitude, longitude, user_id: createdUserId },
        method: "POST",
      }),
      // Insert Media
      requestSupabaseRest("user_media", {
        body: [
          { media_type: "image", media_url: galleryUpload0.publicId, sort_order: 0, user_id: createdUserId },
          { media_type: "image", media_url: galleryUpload1.publicId, sort_order: 1, user_id: createdUserId },
        ],
        method: "POST",
      }),
    ]);

    // 3. Create Custom Session (Bridge for existing app logic)
    const session = await createAuthSession(createdUserId, {
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });
    const response = NextResponse.json<AuthActionResponse>({
      redirectTo: "/radar",
      userId: createdUserId,
    });

    applySessionCookie(response, session);

    return response;
  } catch (error) {
    return NextResponse.json<AuthActionResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
