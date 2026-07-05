import "server-only";

import { querySupabaseRest } from "@/lib/supabase";
import type { ChatConversation, ChatMessage, ChatParticipantSummary, ChatThread } from "@/features/messages/models";

type ChatParticipantRow = {
  chat_id: string;
  user_id: string;
  joined_at: string | null;
};

type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  created_at: string | null;
  status: string | null;
};

type ProfileRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  is_profile_verified: boolean | null;
};

function buildInFilter(ids: string[]) {
  return `in.(${ids.join(",")})`;
}

function mapAdminMessage(row: MessageRow): ChatMessage {
  const content = row.content?.trim();

  return {
    id: row.id,
    content: content || (row.media_url ? "Shared media" : "Message"),
    createdAt: row.created_at ?? new Date(0).toISOString(),
    senderId: row.sender_id,
    mediaUrl: row.media_url ?? null,
    isMine: false,
    isRead: row.status === "read",
  } as unknown as ChatMessage;
}

function buildParticipantSummary(options: {
  participantIds: string[];
  profileMap: Map<string, ProfileRow>;
}): ChatParticipantSummary {
  const { participantIds, profileMap } = options;
  const usernames = participantIds
    .map((userId) => profileMap.get(userId)?.username?.trim() || "Bliss member")
    .filter(Boolean);
  const avatarUrl = profileMap.get(participantIds[0])?.avatar_url ?? null;
  const isVerified = participantIds.some(
    (userId) => Boolean(profileMap.get(userId)?.is_profile_verified),
  );

  return {
    activityStatus: "",
    avatarUrl,
    id: participantIds[0],
    isVerified,
    locationLabel: "",
    username: usernames.length > 1 ? usernames.join(" ↔ ") : usernames[0] ?? "Bliss member",
  };
}

async function getProfiles(userIds: string[]) {
  if (userIds.length === 0) {
    return [] as ProfileRow[];
  }

  return querySupabaseRest<ProfileRow[]>(
    "profiles",
    new URLSearchParams({
      select: "user_id,username,avatar_url,is_profile_verified",
      user_id: buildInFilter(userIds),
    }),
  );
}

export async function listAdminChatThreads(limit = 200): Promise<ChatThread[]> {
  const participantRows = await querySupabaseRest<ChatParticipantRow[]>(
    "chat_participants",
    new URLSearchParams({
      order: "joined_at.asc",
      select: "chat_id,user_id,joined_at",
    }),
  );

  const chatIds = Array.from(new Set(participantRows.map((row) => row.chat_id)));

  if (chatIds.length === 0) {
    return [];
  }

  const latestMessages = await querySupabaseRest<MessageRow[]>(
    "messages",
    new URLSearchParams({
      chat_id: buildInFilter(chatIds),
      order: "created_at.desc",
      select: "id,chat_id,sender_id,content,media_url,created_at,status",
      limit: String(limit * 5),
    }),
  );

  const latestMessageMap = new Map<string, ChatMessage>();

  for (const row of latestMessages) {
    if (!latestMessageMap.has(row.chat_id)) {
      latestMessageMap.set(row.chat_id, mapAdminMessage(row));
    }
  }

  const chatParticipantMap = new Map<string, string[]>();

  for (const row of participantRows) {
    const participants = chatParticipantMap.get(row.chat_id) ?? [];
    participants.push(row.user_id);
    chatParticipantMap.set(row.chat_id, participants);
  }

  const participantIds = Array.from(new Set(participantRows.map((row) => row.user_id)));
  const profiles = await getProfiles(participantIds);
  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));

  const threads = Array.from(chatParticipantMap.entries())
    .map(([chatId, participants]) => {
      const lastMessage = latestMessageMap.get(chatId) ?? null;

      return {
        id: chatId,
        participant: buildParticipantSummary({ participantIds: participants, profileMap }),
        participantId: participants[0] ?? "",
        lastMessage,
        unreadCount: 0,
        updatedAt: lastMessage?.createdAt ?? new Date(0).toISOString(),
      } satisfies ChatThread;
    })
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, limit);

  return threads;
}

export async function getAdminConversation(chatId: string): Promise<ChatConversation | null> {
  const participantRows = await querySupabaseRest<ChatParticipantRow[]>(
    "chat_participants",
    new URLSearchParams({
      chat_id: `eq.${chatId}`,
      order: "joined_at.asc",
      select: "chat_id,user_id,joined_at",
    }),
  );

  if (participantRows.length === 0) {
    return null;
  }

  const participantIds = Array.from(new Set(participantRows.map((row) => row.user_id)));
  const profiles = await getProfiles(participantIds);
  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));

  const messageRows = await querySupabaseRest<MessageRow[]>(
    "messages",
    new URLSearchParams({
      chat_id: `eq.${chatId}`,
      order: "created_at.asc",
      select: "id,chat_id,sender_id,content,media_url,created_at,status",
      limit: "500",
    }),
  );

  const messages = messageRows.map(mapAdminMessage);
  const lastMessage = messages[messages.length - 1] ?? null;
  const thread = {
    id: chatId,
    participant: buildParticipantSummary({ participantIds, profileMap }),
    participantId: participantIds[0] ?? "",
    lastMessage,
    unreadCount: 0,
    updatedAt: lastMessage?.createdAt ?? new Date(0).toISOString(),
  } satisfies ChatThread;

  return {
    messages,
    thread,
  };
}
