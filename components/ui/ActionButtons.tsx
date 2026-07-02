"use client";

import React from "react";
import uiStyles from "./ui.module.css";

interface ActionButtonsProps {
  onAuthTrigger?: () => void;
  isDisabled?: boolean;
  isLiked?: boolean;
  onGridClick: () => void;
  onLikeClick?: () => void;
  onMessageClick?: () => void;
}

export function ActionButtons({
  onAuthTrigger,
  isDisabled,
  isLiked,
  onGridClick,
  onLikeClick,
  onMessageClick,
}: ActionButtonsProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLikeClick) {
      onLikeClick();
      return;
    }

    onAuthTrigger?.();
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMessageClick) {
      onMessageClick();
      return;
    }

    onAuthTrigger?.();
  };

  const isLikeDisabled = isDisabled || !onLikeClick;
  const isMessageDisabled = isDisabled || !onMessageClick;

  const handleGrid = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGridClick();
  };

  return (
    <div className={uiStyles["action-buttons-container"]}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLikeDisabled}
        className={`${uiStyles["action-button"]} ${isLiked ? uiStyles["action-button--active"] : ""}`}
        title={isLiked ? "Unlike" : "Like"}
      >
        {isLiked ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Message Button */}
      <button 
        onClick={handleMessage}
        disabled={isMessageDisabled}
        className={`${uiStyles["action-button"]} ${isMessageDisabled ? uiStyles["action-button--disabled"] : ""}`}
        title="Send Message"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Close Button */}
      <button 
        onClick={handleGrid}
        className={uiStyles["action-button"]}
        title="Close"
      >
        <span className="sr-only">Close</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
