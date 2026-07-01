import Image from "next/image";
import type { ChatThread } from "@/features/messages/models";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import styles from "./messages.module.css";

interface ChatListProps {
  chats: ChatThread[];
  selectedChatId: string | null;
  onSelect: (chat: ChatThread) => void;
}

function formatThreadTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return "";
  }

  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "B";
}

export function ChatList({ chats, selectedChatId, onSelect }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className={styles.chatEmptyState}>
        <svg
          aria-hidden="true"
          fill="none"
          height="32"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="32"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 className="mt-5 text-xl font-bold text-white">No messages yet</h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
          Wait a minute!
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.chatList} flex flex-col gap-3`}>
      {chats.map((chat) => {
        const isSelected = selectedChatId === chat.id;
        const isOnline = chat.participant.activityStatus?.trim().toLowerCase() === "online";

        return (
          <button
            key={chat.id}
            onClick={() => onSelect(chat)}
            className={`${styles.chatListItem} border border-white/10 rounded-xl overflow-hidden ${isSelected ? styles.chatListItemActive : ""}`}
            type="button"
          >
            <div className={styles.chatListItemAvatar}>
              {chat.participant.avatarUrl ? (
                <Image
                  src={chat.participant.avatarUrl}
                  alt={chat.participant.username}
                  fill
                />
              ) : (
                <div className={styles.chatListItemFallback}>
                  {getInitials(chat.participant.username)}
                </div>
              )}
              {isOnline && (
                <span
                  className={styles.chatListItemAvatarOnline}
                  aria-label="Online"
                  title="Online"
                />
              )}
            </div>

            <div className={styles.chatListItemBody}>
              <div className={styles.chatListItemTop}>
                <div className={styles.chatListItemNameRow}>
                  <span className={styles.chatListItemName}>{chat.participant.username}</span>
                  {chat.participant.isVerified ? (
                    <VerifiedBadge className="h-3.5 w-3.5" />
                  ) : null}
                </div>
                <span className={styles.chatListItemTime}>{formatThreadTime(chat.updatedAt)}</span>
              </div>

              <div className={styles.chatListItemBottom}>
                <p
                  className={`${styles.chatListItemPreview} ${
                    chat.unreadCount > 0 ? styles.chatListItemPreviewUnread : ""
                  }`}
                >
                  {chat.lastMessage ? `${chat.lastMessage.isMine ? "You: " : ""}${chat.lastMessage.content}` : "No messages yet"}
                </p>
                {chat.unreadCount > 0 ? (
                  <span className={styles.unreadBadge}>
                    {chat.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
