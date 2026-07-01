import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getMessagesPageData } from "@/features/messages/server";
import { MessagesPageClient } from "../_components/MessagesPageClient";

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (!authenticatedUser.profileCompletedAt) {
    redirect("/checkpoint");
  }

  const { chatId } = await params;
  const messagesPageData = await getMessagesPageData(authenticatedUser.id);

  return <MessagesPageClient initialChatId={chatId} initialThreads={messagesPageData.threads} />;
}
