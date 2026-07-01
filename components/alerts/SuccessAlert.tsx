"use client";

import type { ReactNode } from "react";

interface SuccessAlertProps {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function SuccessAlert({
  title = "Success",
  children,
  onClose,
  className = "",
}: SuccessAlertProps) {
  return (
    <div className={`toast-card toast-card--success ${className}`.trim()} role="status">
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
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
            aria-label="Close alert"
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
