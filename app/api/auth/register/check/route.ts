import { NextRequest, NextResponse } from "next/server";
import type { AuthActionResponse } from "@/features/auth";
import { ensurePhoneNumberAvailable } from "@/features/auth/server";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to validate that phone number right now.";
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { phoneNumber?: string };

    await ensurePhoneNumberAvailable(payload.phoneNumber ?? "");

    return NextResponse.json<AuthActionResponse>({});
  } catch (error) {
    return NextResponse.json<AuthActionResponse>(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
