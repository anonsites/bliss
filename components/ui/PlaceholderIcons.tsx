"use client";

import type { ReactNode } from "react";

type DetailPanePlaceholderTone = "cyan" | "emerald" | "rose" | "sky";

type DetailPanePlaceholderProps = {
  description: string;
  icon: ReactNode;
  title: string;
  tone?: DetailPanePlaceholderTone;
};

const toneClasses: Record<
  DetailPanePlaceholderTone,
  {
    glow: string;
    iconShell: string;
    iconText: string;
  }
> = {
  cyan: {
    glow: "bg-cyan-400/18",
    iconShell: "border-cyan-300/18 bg-cyan-400/10",
    iconText: "text-cyan-200",
  },
  emerald: {
    glow: "bg-emerald-400/18",
    iconShell: "border-emerald-300/18 bg-emerald-400/10",
    iconText: "text-emerald-200",
  },
  rose: {
    glow: "bg-rose-400/18",
    iconShell: "border-rose-300/18 bg-rose-400/10",
    iconText: "text-rose-200",
  },
  sky: {
    glow: "bg-sky-400/18",
    iconShell: "border-sky-300/18 bg-sky-400/10",
    iconText: "text-sky-200",
  },
};

function DetailPaneIconShell({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: DetailPanePlaceholderTone;
}) {
  const styles = toneClasses[tone];

  return (
    <div className="relative mx-auto mb-8 grid h-28 w-28 place-items-center">
      <div className={`absolute inset-0 rounded-full blur-3xl ${styles.glow}`} />
      <div className={`relative grid h-full w-full place-items-center ${styles.iconText}`}>
        {children}
      </div>
    </div>
  );
}

export function DetailPanePlaceholder({
  description,
  icon,
  title,
  tone = "cyan",
}: DetailPanePlaceholderProps) {
  return (
    <div className="flex h-full flex-1 items-center justify-center p-6 text-center lg:p-10">
      <div className="flex max-w-sm flex-col items-center">
        <DetailPaneIconShell tone={tone}>{icon}</DetailPaneIconShell>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>
      </div>
    </div>
  );
}

export function ProfilePlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="52"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="52"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function DropPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="52"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="52"
    >
      <rect height="20" rx="3" width="14" x="5" y="2" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ConversationPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="52"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="52"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function SettingsPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="52"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="52"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2l-.31.31a2 2 0 0 0 0 2.83l.31.31a2 2 0 0 1 0 2.83l-.31.31a2 2 0 0 0 0 2.83l.31.31a2 2 0 0 0 2.83 0l.31-.31a2 2 0 0 1 2.83 0l.31.31a2 2 0 0 0 2.83 0l.31-.31a2 2 0 0 0 0-2.83l-.31-.31a2 2 0 0 1 0-2.83l.31-.31a2 2 0 0 0 0-2.83l-.31-.31a2 2 0 0 0-2.83 0l-.31.31a2 2 0 0 1-2.83 0l-.31-.31a2 2 0 0 0-2.83 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function WishlistPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={className ? undefined : "52"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width={className ? undefined : "52"}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  );
}

// Icon used for the empty state in the Radar/Explore grids.
// Also use in the Nearby section on the home page.

export function LocationPlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
