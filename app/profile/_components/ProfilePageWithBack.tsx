"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { CityModal, hasCityValue } from "./CityModal";
import styles from "./profile.module.css";

export function ProfilePageWithBack({ 
  title,
  children,
  initialCity,
}: {
  title: string;
  children: ReactNode;
  initialCity?: string | null;
}) {
  const router = useRouter();
  const [showCityModal, setShowCityModal] = useState(false);

  useEffect(() => {
    const promptedBefore = window.localStorage.getItem("profile_city_prompted");
    const shouldPrompt = window.location.pathname === "/profile" && !hasCityValue(initialCity) && !promptedBefore;

    if (shouldPrompt) {
      const timeoutId = window.setTimeout(() => {
        setShowCityModal(true);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [initialCity]);

  return (
    <div className={styles.profilePageContainer}>
      <header className={`${styles.profilePageHeaderWithBack} sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-white/5`}>
        <button
          onClick={() => router.back()}
          className={styles.profileBackButton}
          aria-label="Go back"
          type="button"
        >
          <svg 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={styles.profilePageTitle}>{title}</h1>
        <div className={styles.profileBackButtonPlaceholder} />
      </header>
      <div className={`${styles.profilePageContent} mx-auto w-full max-w-2xl`}>
        {children}
      </div>

      <CityModal
        isOpen={showCityModal}
        onClose={() => {
          window.localStorage.setItem("profile_city_prompted", "true");
          setShowCityModal(false);
        }}
        onSaved={(city) => {
          window.localStorage.setItem("profile_city_prompted", "true");
          setShowCityModal(false);
        }}
      />
    </div>
  );
}
