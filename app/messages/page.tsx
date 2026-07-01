// Layout logic:
// Mobile: Show List if no chat selected, Show View if chat selected.
// Desktop: Always show List (Col 2) and View (Col 3).

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getMessagesPageData } from "@/features/messages/server";
import { MessagesPageClient } from "./_components/MessagesPageClient";

export default async function MessagesPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }
  if (!authenticatedUser.profileCompletedAt) {
    redirect("/checkpoint");
  }
  const messagesPageData = await getMessagesPageData(authenticatedUser.id);  
return <MessagesPageClient initialThreads={messagesPageData.threads} />;
}
