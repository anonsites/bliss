import type { ChatMessage } from "@/features/messages/models";
import styles from "./messages.module.css";

function formatMessageTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return "";
  }

  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusTicks({ isRead }: { isRead: boolean }) {
  return (
    <span
      aria-label={isRead ? "Read" : "Sent"}
      className={`${styles.messageStatus} ${isRead ? styles.messageStatusRead : ""}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg
        className={styles.messageStatusTickOverlap}
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={`${styles.messageRow} ${message.isMine ? styles.messageRowMine : styles.messageRowTheirs}`}
    >
      <div
        className={`${styles.messageBubble} ${
          message.isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs
        }`}
      >
        <p className={styles.messageContent}>{message.content}</p>
        <div className={styles.messageMeta}>
          <span className={styles.messageTime}>{formatMessageTime(message.createdAt)}</span>
          {message.isMine && (
            <StatusTicks isRead={message.isRead} />
          )}
        </div>
      </div>
    </div>
  );
}
