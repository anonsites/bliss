"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { ChatConversation, ChatMessage, ChatThread } from "@/features/messages/models";

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "20px",
  },
  card: {
    background: "rgba(11, 16, 26, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "20px",
    minHeight: "560px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    margin: 0,
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  threadButton: {
    width: "100%",
    textAlign: "left" as const,
    borderRadius: "18px",
    padding: "14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f8fafc",
    cursor: "pointer",
  },
  threadButtonActive: {
    background: "rgba(94,234,212,0.12)",
    borderColor: "rgba(94,234,212,0.24)",
  },
  threadMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
  },
  threadName: {
    fontWeight: 700,
    fontSize: "15px",
    margin: 0,
  },
  threadPreview: {
    color: "#9fb0c6",
    fontSize: "13px",
    marginTop: "8px",
  },
  threadBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(94,234,212,0.12)",
    color: "#99f6e4",
    fontSize: "12px",
  },
  conversation: {
    display: "grid",
    gap: "16px",
  },
  conversationHeader: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: "10px",
  },
  conversationTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
  },
  messageList: {
    display: "grid",
    gap: "10px",
    overflowY: "auto" as const,
    maxHeight: "520px",
    paddingRight: "4px",
  },
  messageBubble: {
    borderRadius: "18px",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    maxWidth: "100%",
    wordBreak: "break-word" as const,
  },
  ownBubble: {
    background: "rgba(94,234,212,0.14)",
    justifySelf: "end" as const,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "6px",
    fontSize: "12px",
    color: "#9fb0c6",
  },
  placeholder: {
    padding: "28px",
    borderRadius: "18px",
    border: "1px dashed rgba(255,255,255,0.16)",
    color: "#8ea2b8",
    background: "rgba(255,255,255,0.02)",
  },
  composer: {
    display: "grid",
    gap: "10px",
    marginTop: "12px",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "#f8fafc",
    padding: "12px 14px",
    fontSize: "14px",
    resize: "vertical" as const,
  },
  button: {
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(94,234,212,0.16)",
    color: "#f8fafc",
    padding: "12px 16px",
    cursor: "pointer",
    width: "fit-content",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  error: {
    color: "#fecaca",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.22)",
    borderRadius: "14px",
    padding: "12px 14px",
  },
};

interface Props {
  initialThreads: ChatThread[];
}

export function AdminMessagesClient({ initialThreads }: Props) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialThreads[0]?.id ?? null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedChatId) ?? null,
    [threads, selectedChatId],
  );

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/admin/messages?chatId=${encodeURIComponent(selectedChatId)}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.conversation) {
          throw new Error(payload.error ?? "Unable to load conversation.");
        }

        setConversation(payload.conversation);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load conversation.");
        setConversation(null);
      })
      .finally(() => setIsLoading(false));
  }, [selectedChatId]);

  const handleSelectThread = (thread: ChatThread) => {
    setSelectedChatId(thread.id);
  };

  const handleRefreshConversation = async () => {
    if (!selectedChatId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/messages?chatId=${encodeURIComponent(selectedChatId)}`);
      const payload = await response.json();

      if (!payload.conversation) {
        throw new Error(payload.error ?? "Unable to refresh conversation.");
      }

      setConversation(payload.conversation);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh conversation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Chat list</h2>
            <p style={{ color: "#9fb0c6", margin: 0 }}>Select a conversation to inspect.</p>
          </div>
        </div>

        <div style={styles.list}>
          {threads.map((thread) => {
            const isActive = thread.id === selectedChatId;

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => handleSelectThread(thread)}
                style={{
                  ...styles.threadButton,
                  ...(isActive ? styles.threadButtonActive : {}),
                }}
              >
                <div style={styles.threadMeta}>
                  <p style={styles.threadName}>{thread.participant.username}</p>
                  {thread.unreadCount > 0 ? (
                    <span style={styles.threadBadge}>{thread.unreadCount}</span>
                  ) : null}
                </div>
                <p style={styles.threadPreview}>
                  {thread.lastMessage ? `${thread.lastMessage.senderId === thread.participantId ? "Other:" : "You:"} ${thread.lastMessage.content}` : "No messages yet."}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.conversation}>
          <div style={styles.conversationHeader}>
            <h2 style={styles.conversationTitle}>Conversation</h2>
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}

          {isLoading ? (
            <div style={styles.placeholder}>Loading conversation…</div>
          ) : conversation ? (
            <>
              <div style={styles.messageList}>
                {conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      ...styles.messageBubble,
                      ...(message.isMine ? styles.ownBubble : {}),
                    }}
                  >
                    <div>{message.content}</div>
                    <div style={styles.metaRow}>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                      <span>{message.isRead ? "Read" : "Sent"}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.composer}>
                <button
                  type="button"
                  onClick={handleRefreshConversation}
                  style={{
                    ...styles.button,
                    ...(isLoading ? styles.buttonDisabled : {}),
                  }}
                  disabled={isLoading}
                >
                  Refresh conversation
                </button>
              </div>
            </>
          ) : (
            <div style={styles.placeholder}>Select a chat to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
}
