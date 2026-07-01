import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { uploadFileToCloudinary, CLOUDINARY_UPLOAD_FOLDERS, getCloudinaryResourceTypeForFile } from "@/lib/cloudinary";
import { requestSupabaseRest } from "@/lib/supabase";

type MediaUploadResponse = {
  error?: string;
  media?: {
    id: string;
    media_url: string;
    sort_order: number;
    created_at: string;
  };
};

type UserMediaRow = {
  id: string;
  media_url: string;
  media_type: string;
  sort_order: number;
  created_at: string;
};

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "Unable to upload image right now.";
  }

  if (error.message.includes("Cloudinary")) {
    return "Image upload service is unavailable.";
  }

  if (error.message.includes("Only image")) {
    return error.message;
  }

  return error.message;
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "No file provided." },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "Only image files are supported." },
        { status: 400 },
      );
    }

    // Validate file size (e.g., max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "File size must be less than 10MB." },
        { status: 400 },
      );
    }

    // Upload to Cloudinary
    const resourceType = getCloudinaryResourceTypeForFile(file);
    const cloudinaryResult = await uploadFileToCloudinary(file, {
      folder: CLOUDINARY_UPLOAD_FOLDERS.gallery,
      resourceType,
    });

    // Get the highest sort_order to determine next position
    const existingMedia = await requestSupabaseRest<UserMediaRow[]>("user_media", {
      searchParams: new URLSearchParams({
        user_id: `eq.${authenticatedUser.id}`,
        order: "sort_order.desc",
        limit: "1",
      }),
    });

    const nextSortOrder = (existingMedia?.[0]?.sort_order ?? -1) + 1;

    // Store in Supabase
    const insertedMedia = await requestSupabaseRest<UserMediaRow[]>("user_media", {
      body: {
        user_id: authenticatedUser.id,
        media_url: cloudinaryResult.publicId,
        media_type: "image",
        sort_order: nextSortOrder,
      },
      headers: {
        Prefer: "return=representation",
      },
      method: "POST",
    });

    if (!insertedMedia || insertedMedia.length === 0) {
      throw new Error("Failed to create media record in database.");
    }

    const media = insertedMedia[0];

    return NextResponse.json<MediaUploadResponse>({
      media: {
        id: media.id,
        media_url: media.media_url,
        sort_order: media.sort_order,
        created_at: media.created_at,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json<MediaUploadResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mediaId = formData.get("mediaId") as string | null;

    if (!file || !mediaId) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "File and mediaId are required." },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "Only image files are supported." },
        { status: 400 },
      );
    }

    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "File size must be less than 10MB." },
        { status: 400 },
      );
    }

    // Verify the media belongs to the user
    const existingMedia = await requestSupabaseRest<UserMediaRow[]>("user_media", {
      searchParams: new URLSearchParams({
        id: `eq.${mediaId}`,
        user_id: `eq.${authenticatedUser.id}`,
      }),
    });

    if (!existingMedia || existingMedia.length === 0) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "Media not found." },
        { status: 404 },
      );
    }

    const oldMedia = existingMedia[0];

    // Upload new image to Cloudinary
    const resourceType = getCloudinaryResourceTypeForFile(file);
    const cloudinaryResult = await uploadFileToCloudinary(file, {
      folder: CLOUDINARY_UPLOAD_FOLDERS.gallery,
      resourceType,
    });

    // Update in Supabase
    const updatedMedia = await requestSupabaseRest<UserMediaRow[]>("user_media", {
      body: {
        media_url: cloudinaryResult.publicId,
      },
      headers: {
        Prefer: "return=representation",
      },
      method: "PATCH",
      searchParams: new URLSearchParams({
        id: `eq.${mediaId}`,
      }),
    });

    if (!updatedMedia || updatedMedia.length === 0) {
      throw new Error("Failed to update media record in database.");
    }

    const media = updatedMedia[0];

    return NextResponse.json<MediaUploadResponse>({
      media: {
        id: media.id,
        media_url: media.media_url,
        sort_order: media.sort_order,
        created_at: media.created_at,
      },
    });
  } catch (error) {
    console.error("Media update error:", error);
    return NextResponse.json<MediaUploadResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "You need to sign in again." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("id");

    if (!mediaId) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "Media ID is required." },
        { status: 400 },
      );
    }

    // Verify the media belongs to the user
    const existingMedia = await requestSupabaseRest<UserMediaRow[]>("user_media", {
      searchParams: new URLSearchParams({
        id: `eq.${mediaId}`,
        user_id: `eq.${authenticatedUser.id}`,
      }),
    });

    if (!existingMedia || existingMedia.length === 0) {
      return NextResponse.json<MediaUploadResponse>(
        { error: "Media not found." },
        { status: 404 },
      );
    }

    // Delete from Supabase
    await requestSupabaseRest("user_media", {
      method: "DELETE",
      searchParams: new URLSearchParams({
        id: `eq.${mediaId}`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media deletion error:", error);
    return NextResponse.json<MediaUploadResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
