"use client";

import type { ReactNode } from "react";

interface NotificationAlertProps {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function NotificationAlert({
  title = "Note",
  children,
  onClose,
  className = "",
}: NotificationAlertProps) {
  return (
    <div className={`toast-card toast-card--info ${className}`.trim()} role="status">
      <div className="toast-card__content">
        <div className="toast-card__icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>

        <div className="toast-card__body">
          {title && <h3 className="toast-card__title">{title}</h3>}
          <div className="toast-card__message">{children}</div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="toast-card__close"
            aria-label="Close notification"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
