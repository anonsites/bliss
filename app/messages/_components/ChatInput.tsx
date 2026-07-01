"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./messages.module.css";

interface ChatInputProps {
  disabled?: boolean;
  isSending?: boolean;
  onSubmit?: (content: string) => Promise<boolean> | boolean;
  placeholder?: string;
}

export function ChatInput({
  disabled = false,
  isSending = false,
  onSubmit,
  placeholder = "Message...",
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden";
  }, [value]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled || !onSubmit) {
      return;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return;
    }

    const wasSent = await onSubmit(trimmedValue);

    if (wasSent) {
      setValue("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (disabled || isSending || !value.trim()) {
      return;
    }

    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      className={styles.composer}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <button
        aria-label="Add media"
        className={styles.composerAttachButton}
        disabled
        type="button"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <textarea
        className={styles.composerInput}
        disabled={disabled || isSending}
        onKeyDown={handleKeyDown}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={value}
      />

      <button
        aria-label="Send"
        className={styles.composerSendButton}
        disabled={disabled || isSending || !value.trim()}
        type="submit"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}
