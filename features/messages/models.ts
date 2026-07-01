export interface ChatParticipantSummary {
  activityStatus: string;
  avatarUrl: string | null;
  id: string;
  isVerified: boolean;
  locationLabel: string;
  username: string;
}

export interface ChatMessage {
  content: string;
  createdAt: string;
  id: string;
  isMine: boolean;
  isRead: boolean;
  mediaUrl: string | null;
  senderId: string;
}

export interface ChatThread {
  id: string;
  lastMessage: ChatMessage | null;
  participant: ChatParticipantSummary;
  participantId: string;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatConversation {
  messages: ChatMessage[];
  thread: ChatThread;
}

export interface MessagesPageData {
  threads: ChatThread[];
}
