"use client";

import Image from "next/image";
import { type ReactNode, type SVGProps, useEffect, useId } from "react";
import uiStyles from "./ui.module.css";

interface DownloadModalProps {
  isIOS: boolean;
  isInstalling: boolean;
  neverShowAgain: boolean;
  onClose: () => void;
  onInstall: () => Promise<void>;
  onNeverShowAgainChange: (checked: boolean) => void;
}

function AppleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M15.18 12.14c.02 2.18 1.91 2.91 1.93 2.92-.02.05-.3 1.04-1 2.06-.6.88-1.23 1.75-2.21 1.77-.96.02-1.27-.57-2.38-.57s-1.46.55-2.34.59c-.95.04-1.67-.95-2.28-1.82-1.24-1.79-2.19-5.05-.92-7.28.64-1.11 1.77-1.82 2.99-1.84.93-.02 1.82.63 2.38.63.55 0 1.59-.78 2.67-.67.45.02 1.72.18 2.53 1.37-.07.04-1.49.87-1.47 2.84Zm-1.49-5.42c.5-.61.84-1.45.74-2.29-.72.03-1.59.48-2.1 1.08-.46.53-.87 1.38-.76 2.19.81.06 1.62-.41 2.12-.98Z" />
    </svg>
  );
}

function AndroidIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.0206l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.41 13.8528 8.1466 12 8.1466c-1.8528 0-3.5902.2633-5.1365.7025l-2.0224-3.503a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1859.416 14.3997.416 18.1344h23.168c0-3.7347-2.2729-6.9485-5.7035-8.8136" />
    </svg>
  );
}

function PlatformBadge({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className={uiStyles["download-modal__platform"]}>
      <div className={uiStyles["download-modal__platform-icon"]}>{children}</div>
      <span className={uiStyles["download-modal__platform-label"]}>{label}</span>
    </div>
  );
}

export function DownloadModal({
  isIOS,
  isInstalling,
  neverShowAgain,
  onClose,
  onInstall,
  onNeverShowAgainChange,
}: DownloadModalProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={`${uiStyles["modal-overlay"]} ${uiStyles["modal-overlay--download"]}`} onClick={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`${uiStyles["modal-content"]} ${uiStyles["download-modal"]}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close install dialog"
          className={uiStyles["download-modal__close"]}
          onClick={onClose}
          type="button"
        >
          &times;
        </button>

        <div className={uiStyles["download-modal__header"]}>
          <div className={uiStyles["download-modal__brand-row"]}>
            <PlatformBadge label="iOS">
              <AppleIcon className={uiStyles["download-modal__platform-icon"]} />
            </PlatformBadge>

            <div aria-hidden="true">
              <div className={uiStyles["download-modal__logo-ring"]} />
              <Image
                alt="Bliss logo"
                className={uiStyles["download-modal__logo"]}
                height={76}
                src="/images/bliss_icon.png"
                width={76}
              />
            </div>

            <PlatformBadge label="Android">
              <AndroidIcon className={uiStyles["download-modal__platform-icon"]} />
            </PlatformBadge>
          </div>

          <div className={uiStyles["download-modal__copy"]}>
            <p className={uiStyles["download-modal__eyebrow"]}>Install Bliss</p>
            <h2 id={titleId}>
              {isIOS ? "Get iOS app" : "Get Android app"}
            </h2>
          </div>
        </div>

        <div className={uiStyles["download-modal__body"]}>
          <section className={uiStyles["download-modal__hint"]}>
            {isIOS ? (
              <ol className={uiStyles["download-modal__steps"]}>
                <li>Tap the Share button in Safari.</li>
                <li>Select Add to Home Screen.</li>
                <li>Confirm to save Bliss on your device.</li>
              </ol>
            ) : (
              <ul className={uiStyles["download-modal__steps"]}>
                <li>We are launching on Google playstore soon.</li>
              </ul>
            )}
          </section>

          <label className={uiStyles["download-modal__toggle"]}>
            <input
              checked={neverShowAgain}
              onChange={(event) => onNeverShowAgainChange(event.target.checked)}
              type="checkbox"
            />
            <span>Don&apos;t remind me again!</span>
          </label>

          <div className={uiStyles["download-modal__actions"]}>
            {isIOS ? (
              <button className={uiStyles["download-modal__primary"]} onClick={onClose} type="button">
                Got it
              </button>
            ) : (
              <button
                className={uiStyles["download-modal__primary"]}
                disabled={isInstalling}
                onClick={() => {
                  void onInstall();
                }}
                type="button"
              >
                {isInstalling ? "Opening install prompt..." : "Install Bliss"}
              </button>
            )}

            <button className={uiStyles["download-modal__secondary"]} onClick={onClose} type="button">
              Not now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
