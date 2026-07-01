import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ErrorAlert } from "@/components/alerts/ErrorAlert";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import type { ChatMessage, ChatThread } from "@/features/messages/models";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import styles from "./messages.module.css";

interface ChatViewProps {
  chat: ChatThread;
  composerDisabled?: boolean;
  composerPlaceholder?: string;
  emptyStateMessage?: string;
  error?: string | null;
  isLoading?: boolean;
  isSending?: boolean;
  messages: ChatMessage[];
  onBack: () => void;
  onDismissError?: () => void;
  onSendMessage?: (content: string) => Promise<boolean> | boolean;
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "B";
}

export function ChatView({
  chat,
  composerDisabled = false,
  composerPlaceholder,
  emptyStateMessage = "No messages yet. Start the conversation.",
  error,
  isLoading = false,
  isSending = false,
  messages,
  onBack,
  onDismissError,
  onSendMessage,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewportHeight = () => {
      const nextHeight = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(`${nextHeight}px`);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
    };
  }, []);

  // Auto-scroll to bottom whenever messages change or loading completes
  useEffect(() => {
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({
        behavior: messages.length <= 1 ? "auto" : "smooth",
      });
    }
  }, [messages, isLoading]);

  return (
    <div
      className={`${styles.chatView} flex flex-col overflow-hidden`}
      style={{ minHeight: viewportHeight ?? "100svh", height: viewportHeight ?? "100svh", maxHeight: viewportHeight ?? "100svh" }}
    >
      <header className={`${styles.chatViewHeader} z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 flex-shrink-0`}>
        <button
          className={`${styles.chatViewBackButton} lg:hidden`}
          onClick={onBack}
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={styles.chatViewIdentity}>
          <div className={styles.chatViewAvatar}>
            {chat.participant.avatarUrl ? (
              <Image
                src={chat.participant.avatarUrl}
                alt={chat.participant.username}
                fill
              />
            ) : (
              <div className={styles.chatViewAvatarFallback}>
                {getInitials(chat.participant.username)}
              </div>
            )}
          </div>

          <div className={styles.chatViewMeta}>
            <div className={styles.chatViewNameRow}>
              <span className={styles.chatViewName}>{chat.participant.username}</span>
              {chat.participant.isVerified ? (
                <VerifiedBadge />
              ) : null}
            </div>
            <span className={styles.chatViewStatus}>
              <span className={`${styles.chatViewStatusText} flex items-center gap-1 inline-flex ${chat.participant.activityStatus?.trim().toLowerCase() === "online" ? "text-emerald-400" : ""}`}>
                {chat.participant.activityStatus?.trim().toLowerCase() === "online" && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {chat.participant.activityStatus}
              </span>
              <span className="mx-4 text-slate-400">|</span>
              <span>{chat.participant.locationLabel}</span>
            </span>
          </div>
        </div>
      </header>
      {/* Main chat body, should grow to fill available space and be scrollable */}
      <div className={`${styles.chatViewBody} flex-1 overflow-y-auto min-h-0`}>
        {error ? (
          <ErrorAlert className="mb-4" onClose={onDismissError}>
            {error}
          </ErrorAlert>
        ) : null}

        <div className={`${styles.chatViewStream} pb-2`}>
          {isLoading ? (
            <div className={styles.chatViewBodyState}>Loading Messages...</div>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <div className={`${styles.chatViewBodyState} flex items-center justify-center h-full`}>{emptyStateMessage}</div>
          )}
          <div ref={messagesEndRef} className="h-px w-full" />
        </div>
      </div>
      {/* Chat input dock, fixed at the bottom */}
      <div className={`${styles.chatComposerDock} flex-shrink-0`}>
        <ChatInput
          disabled={composerDisabled || !onSendMessage || isLoading}
          isSending={isSending}
          onSubmit={onSendMessage}
          placeholder={composerPlaceholder ?? (composerDisabled ? "Messaging is unavailable here." : "Message...")}
        />
      </div>
    </div>
  );
}
