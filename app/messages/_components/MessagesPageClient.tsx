"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { AppPaneLayout } from "@/components/layout";
import { ErrorAlert } from "@/components/alerts/ErrorAlert";
import {
  ConversationPlaceholderIcon,
  DetailPanePlaceholder,
} from "@/components/ui/PlaceholderIcons";
import type { ChatConversation, ChatMessage, ChatThread } from "@/features/messages/models";
import { ChatList } from "./ChatList";
import { ChatView } from "./ChatView";
import styles from "./messages.module.css";

type MessagesPageClientProps = {
  initialChatId?: string | null;
  initialThreads: ChatThread[];
};

type ConversationResponse = {
  conversation?: ChatConversation;
  error?: string; 
};

type SendMessageResponse = {
  error?: string;
  message?: ChatMessage;
  thread?: ChatThread;
};

function upsertThread(threads: ChatThread[], nextThread: ChatThread) {
  return [nextThread, ...threads.filter((thread) => thread.id !== nextThread.id)];
}

export function MessagesPageClient({ initialChatId, initialThreads }: MessagesPageClientProps) {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const [threads, setThreads] = useState(initialThreads);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId ?? null);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const selectedThread = threads.find((thread) => thread.id === selectedChatId) ?? null;
  const selectedChatIdRef = useRef(selectedChatId);

  // Keep the ref in sync with state to ensure real-time callbacks have the latest active ID
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  // Persistent real-time subscription for incoming chat messages.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`messages-realtime-${user.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            content: string;
            created_at: string;
            sender_id: string;
            chat_id: string;
            media_url?: string | null;
          };

          const isMine = row.sender_id === user.id;
          if (isMine) return;

          const newMessage: ChatMessage = {
            id: row.id,
            content: row.content,
            createdAt: row.created_at,
            senderId: row.sender_id,
            mediaUrl: row.media_url ?? null,
            isMine: false,
            isRead: false,
          };

          const currentActiveId = selectedChatIdRef.current;

          if (row.chat_id === currentActiveId) {
            setActiveConversation((current) => {
              if (!current || current.thread.id !== row.chat_id) return current;
              if (current.messages.some((message) => message.id === newMessage.id)) {
                return current;
              }

              return {
                ...current,
                messages: [...current.messages, newMessage],
              };
            });
          }

          setThreads((current) => {
            const thread = current.find((item) => item.id === row.chat_id);
            if (!thread) return current;

            const updatedThread: ChatThread = {
              ...thread,
              lastMessage: newMessage,
              updatedAt: newMessage.createdAt,
              unreadCount:
                currentActiveId !== row.chat_id ? thread.unreadCount + 1 : thread.unreadCount,
            };

            return upsertThread(current, updatedThread);
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Messages real-time channel connected.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  useEffect(() => {
    if (!initialChatId) {
      return;
    }

    const matchingThread = threads.find((thread) => thread.id === initialChatId);
    if (!matchingThread) {
      return;
    }

    if (selectedChatId === initialChatId && activeConversation?.thread.id === initialChatId) {
      return;
    }

    void handleChatSelect(matchingThread);
  }, [activeConversation?.thread.id, initialChatId, selectedChatId, threads]);

  const handleChatSelect = async (chat: ChatThread) => {
    if (selectedChatId === chat.id && activeConversation?.thread.id === chat.id) {
      return;
    }

    try {
      setPageError(null);
      setSendError(null);
      setSelectedChatId(chat.id);
      setActiveConversation(null);
      setIsOpeningConversation(true);

      const response = await fetch(`/api/messages/${chat.id}`, {
        method: "GET",
      });
      const payload = (await response.json()) as ConversationResponse;

      if (!response.ok || !payload.conversation) {
        setPageError(payload.error ?? "Unable to open that conversation.");
        setActiveConversation(null);
        return;
      }

      setActiveConversation(payload.conversation);
      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.id === payload.conversation?.thread.id ? payload.conversation.thread : thread,
        ),
      );
    } catch {
      setPageError("Unable to open that conversation right now.");
    } finally {
      setIsOpeningConversation(false);
    }
  };

  const handleBack = () => {
    setSelectedChatId(null);
    setActiveConversation(null);
    setPageError(null);
    setSendError(null);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChatId) {
      return false;
    }

    try {
      setSendError(null);
      setIsSendingMessage(true);

      const response = await fetch(`/api/messages/${selectedChatId}`, {
        body: JSON.stringify({ content }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as SendMessageResponse;

      if (!response.ok || !payload.message || !payload.thread) {
        setSendError(payload.error ?? "Unable to send your message.");
        return false;
      }

      const nextMessage = payload.message;
      const nextThread = payload.thread;

      setActiveConversation((currentConversation) => {
        if (!currentConversation || currentConversation.thread.id !== selectedChatId) {
          return currentConversation;
        }

        return {
          messages: [...currentConversation.messages, nextMessage],
          thread: nextThread,
        };
      });
      setThreads((currentThreads) => upsertThread(currentThreads, nextThread));
      return true;
    } catch {
      setSendError("Unable to send your message right now.");
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

  const secondaryPane = (
    <>
      <header className={styles.messagesHeader}>
        <h1 className={styles.messagesTitle}>Messages</h1>
      </header>

      {pageError ? (
        <div className={styles.messagesNotice}>
          <ErrorAlert onClose={() => setPageError(null)}>{pageError}</ErrorAlert>
        </div>
      ) : null}

      <div className={styles.messagesListViewport}>
        <ChatList chats={threads} selectedChatId={selectedChatId} onSelect={handleChatSelect} />
      </div>
    </>
  );

  const detailPane = selectedThread ? (
    <ChatView
      chat={activeConversation?.thread ?? selectedThread}
      error={sendError ?? pageError}
      isLoading={isOpeningConversation}
      isSending={isSendingMessage}
      messages={
        activeConversation?.thread.id === selectedThread.id ? activeConversation.messages : []
      }
      onBack={handleBack}
      onDismissError={() => {
        setPageError(null);
        setSendError(null);
      }}
      onSendMessage={handleSendMessage}
    />
  ) : (
    <DetailPanePlaceholder
      description="Open a thread to read and reply here."
      icon={<ConversationPlaceholderIcon />}
      title="Select a conversation to view"
      tone="sky"
    />
  );

  return (
    <AppPaneLayout
      detail={detailPane}
      detailActive={Boolean(selectedThread)}
      detailClassName="overflow-hidden"
      secondary={secondaryPane}
      secondaryClassName="overflow-hidden"
    />
  );
}
