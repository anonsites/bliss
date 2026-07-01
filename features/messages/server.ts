import "server-only";

import {
  formatApproximateDistance,
  formatRelativeActivity,
  haversineDistanceKm,
  isValidCoordinate,
} from "@/lib/geo";
import { resolveCloudinaryMediaUrl } from "@/lib/cloudinary";
import { querySupabaseRest, requestSupabaseRest } from "@/lib/supabase";
import { notifyNewMessage } from "@/features/notifications";
import { getLatestSessionActivity, resolveActivityReference } from "@/features/activity/server";
import type { ChatConversation, ChatMessage, ChatParticipantSummary, ChatThread, MessagesPageData } from "./models";

type ChatParticipantRow = {
  chat_id: string;
  joined_at: string | null;
  user_id: string;
};

type MessageRow = {
  chat_id: string;
  content: string | null;
  created_at: string | null;
  id: string;
  media_url: string | null;
  read_at: string | null;
  sender_id: string;
  status: string | null;
};

type NotificationRow = {
  content: string | null;
  created_at: string | null;
  id: string;
};

type ProfileRow = {
  avatar_url: string | null;
  id: string;
  is_profile_verified: boolean | null;
  updated_at: string | null;
  user_id: string;
  username: string | null;
};

type UserLocationRow = {
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;
  user_id: string;
};

export type MessageNotificationEvent = {
  chatId?: string;
  createdAt: string;
  id: string;
  message: string;
  title: string;
  type: "message" | "notification";
};

function buildInFilter(ids: string[]) {
  return `in.(${ids.join(",")})`;
}

function formatMessagePreview(row: Pick<MessageRow, "content" | "media_url">) {
  const content = row.content?.trim();

  if (content) {
    return content.length > 120 ? `${content.slice(0, 117)}...` : content;
  }

  return row.media_url ? "Sent a media message." : "Sent you a message.";
}

function parseDateValue(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mapMessage(row: MessageRow, currentUserId: string): ChatMessage {
  const normalizedContent = row.content?.trim();

  return {
    content: normalizedContent || (row.media_url ? "Shared media" : "Message"),
    createdAt: row.created_at ?? new Date(0).toISOString(),
    id: row.id,
    isMine: row.sender_id === currentUserId,
    isRead: row.status === "read",
    mediaUrl: row.media_url ?? null,
    senderId: row.sender_id,
    status: row.status ?? "sent",
  } as unknown as ChatMessage;
}

function buildParticipantSummary(options: {
  otherUserId: string;
  profile: ProfileRow | null;
  profileLocation: UserLocationRow | null;
  sessionActivity: Map<string, string>;
  viewerLocation: UserLocationRow | null;
}): ChatParticipantSummary {
  const { otherUserId, profile, profileLocation, sessionActivity, viewerLocation } = options;
  let locationLabel = "Nearby";

  if (
    viewerLocation &&
    profileLocation &&
    isValidCoordinate(viewerLocation.latitude) &&
    isValidCoordinate(viewerLocation.longitude) &&
    isValidCoordinate(profileLocation.latitude) &&
    isValidCoordinate(profileLocation.longitude)
  ) {
    locationLabel = formatApproximateDistance(
      haversineDistanceKm(
        { latitude: viewerLocation.latitude, longitude: viewerLocation.longitude },
        { latitude: profileLocation.latitude, longitude: profileLocation.longitude },
      ),
      "fine",
    );
  }

  return {
    activityStatus: formatRelativeActivity(
      resolveActivityReference(
        otherUserId,
        sessionActivity,
        profileLocation?.updated_at,
        profile?.updated_at,
      ),
    ),
    avatarUrl: resolveCloudinaryMediaUrl(profile?.avatar_url, "image"),
    id: otherUserId,
    isVerified: Boolean(profile?.is_profile_verified),
    locationLabel,
    username: profile?.username?.trim() || "Bliss member",
  };
}

async function getViewerLocation(userId: string) {
  const locations = await querySupabaseRest<UserLocationRow[]>(
    "user_locations",
    new URLSearchParams({
      limit: "1",
      select: "user_id,latitude,longitude,updated_at",
      user_id: `eq.${userId}`,
    }),
  );

  return locations[0] ?? null;
}

async function getParticipantRowsForUser(userId: string) {
  return querySupabaseRest<ChatParticipantRow[]>(
    "chat_participants",
    new URLSearchParams({
      order: "joined_at.asc",
      select: "chat_id,user_id,joined_at",
      user_id: `eq.${userId}`,
    }),
  );
}

async function getChatParticipants(chatIds: string[]) {
  if (chatIds.length === 0) {
    return [];
  }

  return querySupabaseRest<ChatParticipantRow[]>(
    "chat_participants",
    new URLSearchParams({
      chat_id: buildInFilter(chatIds),
      order: "joined_at.asc",
      select: "chat_id,user_id,joined_at",
    }),
  );
}

async function getProfiles(userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  return querySupabaseRest<ProfileRow[]>(
    "profiles",
    new URLSearchParams({
      order: "updated_at.desc",
      select: "id,user_id,username,avatar_url,is_profile_verified,updated_at",
      user_id: buildInFilter(userIds),
    }),
  );
}

async function getLocations(userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  return querySupabaseRest<UserLocationRow[]>(
    "user_locations",
    new URLSearchParams({
      order: "updated_at.desc",
      select: "user_id,latitude,longitude,updated_at",
      user_id: buildInFilter(userIds),
    }),
  );
}

async function getLatestMessageRows(chatIds: string[]) {
  if (chatIds.length === 0) {
    return [];
  }

  return querySupabaseRest<MessageRow[]>(
    "messages",
    new URLSearchParams({
      chat_id: buildInFilter(chatIds),
      order: "created_at.desc",
      select: "id,chat_id,sender_id,content,media_url,created_at,status",
    }),
  );
}

async function getUnreadMessageRows(chatIds: string[], userId: string) {
  if (chatIds.length === 0) {
    return [];
  }

  return querySupabaseRest<Array<Pick<MessageRow, "chat_id" | "id">>>(
    "messages",
    new URLSearchParams({
      chat_id: buildInFilter(chatIds),
      select: "id,chat_id",
      sender_id: `neq.${userId}`,
      status: "neq.read",
    }),
  );
}

async function getConversationMessages(chatId: string) {
  return querySupabaseRest<MessageRow[]>(
    "messages",
    new URLSearchParams({
      chat_id: `eq.${chatId}`,
      limit: "200",
      order: "created_at.asc",
      select: "id,chat_id,sender_id,content,media_url,created_at,status",
    }),
  );
}

async function ensureChatAccess(userId: string, chatId: string) {
  const participantRows = await querySupabaseRest<ChatParticipantRow[]>(
    "chat_participants",
    new URLSearchParams({
      chat_id: `eq.${chatId}`,
      order: "joined_at.asc",
      select: "chat_id,user_id,joined_at",
    }),
  );

  const viewerParticipant = participantRows.find((row) => row.user_id === userId) ?? null;

  if (!viewerParticipant) {
    return null;
  }

  const otherParticipant = participantRows.find((row) => row.user_id !== userId) ?? null;

  if (!otherParticipant) {
    return null;
  }

  return {
    otherParticipant,
    participantRows,
    viewerParticipant,
  };
}

function buildThread(options: {
  chatId: string;
  fallbackUpdatedAt?: string | null;
  lastMessage: ChatMessage | null;
  participant: ChatParticipantSummary;
  unreadCount: number;
}) {
  const { chatId, fallbackUpdatedAt, lastMessage, participant, unreadCount } = options;

  return {
    id: chatId,
    lastMessage,
    participant,
    participantId: participant.id,
    unreadCount,
    updatedAt: lastMessage?.createdAt ?? fallbackUpdatedAt ?? new Date(0).toISOString(),
  } satisfies ChatThread;
}

export async function markChatAsRead(userId: string, chatId: string) {
  await requestSupabaseRest<unknown>("messages", {
    body: {
      read_at: new Date().toISOString(),
      status: "read",
    },
    headers: {
      Prefer: "return=minimal",
    },
    method: "PATCH",
    searchParams: new URLSearchParams({
      chat_id: `eq.${chatId}`,
      sender_id: `neq.${userId}`,
      status: "neq.read",
    }),
  });
}

export async function getMessagesPageData(userId: string): Promise<MessagesPageData> {
  const viewerParticipantRows = await getParticipantRowsForUser(userId);
  const chatIds = Array.from(new Set(viewerParticipantRows.map((row) => row.chat_id)));

  if (chatIds.length === 0) {
    return {
      threads: [],
    };
  }

  const [allParticipants, viewerLocation, latestMessageRows, unreadRows] = await Promise.all([
    getChatParticipants(chatIds),
    getViewerLocation(userId),
    getLatestMessageRows(chatIds),
    getUnreadMessageRows(chatIds, userId),
  ]);

  const otherParticipantRows = allParticipants.filter((row) => row.user_id !== userId);
  const otherUserIds = Array.from(new Set(otherParticipantRows.map((row) => row.user_id)));
  const [profiles, locations, sessionActivity] = await Promise.all([
    getProfiles(otherUserIds),
    getLocations(otherUserIds),
    getLatestSessionActivity(otherUserIds),
  ]);

  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const locationMap = new Map(locations.map((location) => [location.user_id, location]));
  const latestMessageMap = new Map<string, ChatMessage>();

  for (const messageRow of latestMessageRows) {
    if (!latestMessageMap.has(messageRow.chat_id)) {
      latestMessageMap.set(messageRow.chat_id, mapMessage(messageRow, userId));
    }
  }

  const unreadCountMap = unreadRows.reduce((counts, row) => {
    counts.set(row.chat_id, (counts.get(row.chat_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  const threadMap = new Map<string, ChatThread>();

  for (const membership of viewerParticipantRows) {
    const otherParticipant = otherParticipantRows.find((row) => row.chat_id === membership.chat_id);

    if (!otherParticipant) {
      continue;
    }

    const participant = buildParticipantSummary({
      otherUserId: otherParticipant.user_id,
      profile: profileMap.get(otherParticipant.user_id) ?? null,
      profileLocation: locationMap.get(otherParticipant.user_id) ?? null,
      sessionActivity,
      viewerLocation,
    });

    threadMap.set(
      membership.chat_id,
      buildThread({
        chatId: membership.chat_id,
        fallbackUpdatedAt: otherParticipant.joined_at ?? membership.joined_at,
        lastMessage: latestMessageMap.get(membership.chat_id) ?? null,
        participant,
        unreadCount: unreadCountMap.get(membership.chat_id) ?? 0,
      }),
    );
  }

  return {
    threads: Array.from(threadMap.values()).sort(
      (left, right) => parseDateValue(right.updatedAt) - parseDateValue(left.updatedAt),
    ),
  };
}

export async function getConversationForUser(
  userId: string,
  chatId: string,
  options?: { markRead?: boolean },
): Promise<ChatConversation | null> {
  const access = await ensureChatAccess(userId, chatId);

  if (!access) {
    return null;
  }

  if (options?.markRead) {
    await markChatAsRead(userId, chatId);
  }

  const [viewerLocation, profiles, locations, sessionActivity, messageRows] = await Promise.all([
    getViewerLocation(userId),
    getProfiles([access.otherParticipant.user_id]),
    getLocations([access.otherParticipant.user_id]),
    getLatestSessionActivity([access.otherParticipant.user_id]),
    getConversationMessages(chatId),
  ]);

  const profile = profiles[0] ?? null;
  const location = locations[0] ?? null;
  const messages = messageRows.map((row) => mapMessage(row, userId));
  const unreadCount = options?.markRead
    ? 0
    : messages.filter((message) => !message.isMine && !message.isRead).length;

  return {
    messages,
    thread: buildThread({
      chatId,
      fallbackUpdatedAt: access.otherParticipant.joined_at ?? access.viewerParticipant.joined_at,
      lastMessage: messages[messages.length - 1] ?? null,
      participant: buildParticipantSummary({
        otherUserId: access.otherParticipant.user_id,
        profile,
        profileLocation: location,
        sessionActivity,
        viewerLocation,
      }),
      unreadCount,
    }),
  };
}

export async function sendMessageForUser(userId: string, chatId: string, content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Message cannot be empty.");
  }

  if (trimmedContent.length > 2000) {
    throw new Error("Message is too long.");
  }

  const access = await ensureChatAccess(userId, chatId);

  if (!access) {
    throw new Error("Chat not found.");
  }

  const insertedRows = await requestSupabaseRest<MessageRow[]>("messages", {
    body: {
      chat_id: chatId,
      content: trimmedContent,
      sender_id: userId,
    },
    headers: {
      Prefer: "return=representation",
    },
    method: "POST",
  });
  const insertedRow = insertedRows[0] ?? null;

  if (!insertedRow) {
    throw new Error("Message could not be sent.");
  }

  const conversation = await getConversationForUser(userId, chatId);

  if (!conversation) {
    throw new Error("Chat not found.");
  }

  // Send notification to recipient
  if (conversation.thread) {
    const recipientId = conversation.thread.participantId;
    const recipientUsername = conversation.thread.participant?.username;
    
    // Get sender's profile for notification
    const senderProfiles = await getProfiles([userId]);
    const senderProfile = senderProfiles[0];
    const senderUsername = senderProfile?.username?.trim() || "Someone";

    if (recipientId && recipientUsername) {
      await notifyNewMessage(
        recipientId,
        senderUsername,
        userId,
        chatId,
        trimmedContent
      );
    }
  }

  return {
    message: mapMessage(insertedRow, userId),
    thread: conversation.thread,
  };
}

export async function getMessageNotificationEvents(
  userId: string,
  since: string,
): Promise<MessageNotificationEvent[]> {
  const sinceDate = new Date(since);

  if (Number.isNaN(sinceDate.getTime())) {
    throw new Error("Invalid notification cursor.");
  }

  const notificationRowsPromise = querySupabaseRest<NotificationRow[]>(
    "notifications",
    new URLSearchParams({
      created_at: `gt.${sinceDate.toISOString()}`,
      limit: "20",
      order: "created_at.asc",
      select: "id,content,created_at",
      user_id: `eq.${userId}`,
    }),
  );

  const participantRows = await getParticipantRowsForUser(userId);
  const chatIds = Array.from(new Set(participantRows.map((row) => row.chat_id)));

  const messageRowsPromise = chatIds.length > 0
    ? querySupabaseRest<MessageRow[]>(
        "messages",
        new URLSearchParams({
          chat_id: buildInFilter(chatIds),
          created_at: `gt.${sinceDate.toISOString()}`,
          limit: "30",
          order: "created_at.asc",
          select: "id,chat_id,sender_id,content,media_url,created_at,status",
          sender_id: `neq.${userId}`,
        }),
      )
    : Promise.resolve([]);

  const [notificationRows, messageRows] = await Promise.all([
    notificationRowsPromise,
    messageRowsPromise,
  ]);

  const senderIds = Array.from(new Set(messageRows.map((row) => row.sender_id)));
  const senderProfiles = await getProfiles(senderIds);
  const profileMap = new Map(senderProfiles.map((profile) => [profile.user_id, profile]));

  const notificationEvents = notificationRows
    .filter((row) => row.created_at)
    .map((row) => ({
      createdAt: row.created_at as string,
      id: `notification:${row.id}`,
      message: row.content?.trim() || "You have a new notification.",
      title: "New notification",
      type: "notification" as const,
    }));

  const messageEvents = messageRows
    .filter((row) => row.created_at)
    .map((row) => {
      const senderName = profileMap.get(row.sender_id)?.username?.trim() || "Someone";

      return {
        chatId: row.chat_id,
        createdAt: row.created_at as string,
        id: `message:${row.id}`,
        message: formatMessagePreview(row),
        title: `New message from ${senderName}`,
        type: "message" as const,
      };
    });

  return [...notificationEvents, ...messageEvents].sort(
    (left, right) => parseDateValue(left.createdAt) - parseDateValue(right.createdAt),
  );
}

export async function createChatThread(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new Error("Cannot chat with yourself.");
  }

  // 1. Check if chat already exists
  const userChats = await querySupabaseRest<Pick<ChatParticipantRow, "chat_id">[]>(
    "chat_participants",
    new URLSearchParams({
      select: "chat_id",
      user_id: `eq.${userId}`,
    }),
  );

  const userChatIds = userChats.map((r) => r.chat_id);

  if (userChatIds.length > 0) {
    const existing = await querySupabaseRest<Pick<ChatParticipantRow, "chat_id">[]>(
      "chat_participants",
      new URLSearchParams({
        chat_id: buildInFilter(userChatIds),
        limit: "1",
        select: "chat_id",
        user_id: `eq.${targetUserId}`,
      }),
    );

    if (existing.length > 0 && existing[0]) {
      return { chatId: existing[0].chat_id, isNew: false };
    }
  }

  // 2. Check eligibility (distance/blocks)
  const canOpen = await requestSupabaseRest<boolean>("rpc/can_open_chat_between_users", {
    body: { p_target_user_id: targetUserId, p_user_id: userId },
    method: "POST",
  });

  if (!canOpen) {
    throw new Error("You cannot start a chat with this user (they may be out of range or blocked).");
  }

  // 3. Create new chat & add participants
  const newChat = await requestSupabaseRest<{ id: string }[]>("chats", {
    body: {},
    headers: { Prefer: "return=representation" },
    method: "POST",
  });

  const chatId = newChat[0]?.id;
  if (!chatId) throw new Error("Failed to create chat thread.");

  await requestSupabaseRest("chat_participants", {
    body: [
      { chat_id: chatId, user_id: userId },
      { chat_id: chatId, user_id: targetUserId },
    ],
    method: "POST",
  });

  return { chatId, isNew: true };
}
