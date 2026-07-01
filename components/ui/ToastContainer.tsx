"use client";

import { useToast, type Toast } from "@/lib/toast-context";
import { ErrorAlert } from "@/components/alerts/ErrorAlert";
import { SuccessAlert } from "@/components/alerts/SuccessAlert";
import { NotificationAlert } from "@/components/alerts/NotificationAlert";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          {toast.type === "error" && (
            <ErrorAlert title={toast.title} onClose={() => removeToast(toast.id)}>
              {toast.message}
            </ErrorAlert>
          )}
          {toast.type === "success" && (
            <SuccessAlert title={toast.title} onClose={() => removeToast(toast.id)}>
              {toast.message}
            </SuccessAlert>
          )}
          {toast.type === "info" && (
            <NotificationAlert title={toast.title} onClose={() => removeToast(toast.id)}>
              {toast.message}
            </NotificationAlert>
          )}
        </div>
      ))}
    </div>
  );
}
