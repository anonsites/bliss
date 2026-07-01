import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/features/auth/server";
import { querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";

type HiddenContactRow = {
  target_phone_number: string;
};

type HiddenContactResponse = {
  error?: string;
  hiddenContacts?: string[];
};

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "Unable to update hidden contacts right now.";
  }
  return error.message;
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<HiddenContactResponse>({ error: "You need to sign in again." }, { status: 401 });
    }

    const payload = (await request.json()) as { phoneNumber?: string };
    const phoneNumber = payload.phoneNumber?.trim();

    if (!phoneNumber) {
      return NextResponse.json<HiddenContactResponse>({ error: "A valid phone number is required." }, { status: 400 });
    }

    await requestSupabaseRest("hidden_contacts", {
      body: {
        user_id: authenticatedUser.id,
        target_phone_number: phoneNumber,
      },
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      method: "POST",
      searchParams: new URLSearchParams({
        on_conflict: "user_id,target_phone_number",
      }),
    });

    const hiddenContactRows = await querySupabaseRest<HiddenContactRow[]>(
      "hidden_contacts",
      new URLSearchParams({
        select: "target_phone_number",
        user_id: `eq.${authenticatedUser.id}`,
      }),
    );

    return NextResponse.json<HiddenContactResponse>({
      hiddenContacts: hiddenContactRows.map((row) => row.target_phone_number),
    });
  } catch (error) {
    return NextResponse.json<HiddenContactResponse>({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return NextResponse.json<HiddenContactResponse>({ error: "You need to sign in again." }, { status: 401 });
    }

    const payload = (await request.json()) as { phoneNumber?: string };
    const phoneNumber = payload.phoneNumber?.trim();

    if (!phoneNumber) {
      return NextResponse.json<HiddenContactResponse>({ error: "A valid phone number is required." }, { status: 400 });
    }

    await requestSupabaseRest("hidden_contacts", {
      method: "DELETE",
      searchParams: new URLSearchParams({
        user_id: `eq.${authenticatedUser.id}`,
        target_phone_number: `eq.${phoneNumber}`,
      }),
    });

    const hiddenContactRows = await querySupabaseRest<HiddenContactRow[]>(
      "hidden_contacts",
      new URLSearchParams({
        select: "target_phone_number",
        user_id: `eq.${authenticatedUser.id}`,
      }),
    );

    return NextResponse.json<HiddenContactResponse>({
      hiddenContacts: hiddenContactRows.map((row) => row.target_phone_number),
    });
  } catch (error) {
    return NextResponse.json<HiddenContactResponse>({ error: getErrorMessage(error) }, { status: 400 });
  }
}
