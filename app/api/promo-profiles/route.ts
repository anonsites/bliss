import { NextResponse } from "next/server";
import { querySupabaseRest } from "@/lib/supabase";
import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";

type PromoProfileRow = {
  id: string;
  username: string;
  avatar_url: string;
  media_url: string | null;
  media_type: string | null;
  gender: string;
  phone_number?: string | null;
  is_verified?: boolean | null;
};

function mapForClient(row: PromoProfileRow) {
  return {
    id: row.id,
    username: row.username?.trim() || "",
    avatarUrl: resolveCloudinaryMediaUrl(row.avatar_url, "image") ?? row.avatar_url,
    mediaSrc: row.media_url ? resolveCloudinaryMediaUrl(row.media_url, (row.media_type as any) ?? "image") ?? row.media_url : null,
    mediaType: row.media_type ?? "image",
    gender: row.gender,
    phoneNumber: row.phone_number ?? undefined,
    isVerified: Boolean(row.is_verified),
  };
}

export async function GET() {
  try {
    const rows = await querySupabaseRest<PromoProfileRow[]>(
      "promo_profiles",
      new URLSearchParams({
        is_published: "eq.true",
        limit: "8",
        order: "created_at.desc",
        select: "id,username,avatar_url,media_url,media_type,gender,is_verified",
      }),
    );

    const mapped = rows.map(mapForClient);

    return NextResponse.json(mapped, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
