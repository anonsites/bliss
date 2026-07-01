"use client";

import React from "react";
import styles from "./radar.module.css";
import { RadarWishlistSwitch } from "./RadarPageButtons";

type RadarMode = "nearby" | "explore";

interface RadarHeaderProps {
  mode: RadarMode;
  searchCity: string;
  feedError: string | null;
  onModeChange: (mode: RadarMode) => void;
  onSearchChange: (city: string) => void;
  onSearchSubmit: (city: string) => void;
}

export function RadarHeader({
  mode,
  searchCity,
  feedError,
  onModeChange,
  onSearchChange,
  onSearchSubmit,
}: RadarHeaderProps) {
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit(searchCity);
  };

  return (
    <header className={styles.radarHeader}>
      <div className={styles.radarHeaderContent}>
        <div className={styles.radarHeaderTop}>
          <div>
            <h1 className={styles.radarTitle}>{mode === "nearby" ? "Radar" : "Explore"}</h1>
          </div>

          <div className={styles.radarHeaderActions}>
            <button
              className={styles.radarModeButton}
              onClick={() => onModeChange(mode === "nearby" ? "explore" : "nearby")}
              title={mode === "nearby" ? "Search cities" : "Back to nearby"}
              type="button"
              aria-label={mode === "nearby" ? "Switch to explore mode" : "Switch to nearby mode"}
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                {mode === "nearby" ? (
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                ) : (
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                )}
              </svg>
            </button>
            <RadarWishlistSwitch currentPage="radar" fixed={false} showLabel={false} />
          </div>
        </div>

        {mode === "explore" && (
          <form className={styles.radarSearchForm} onSubmit={handleFormSubmit}>
            <div className={styles.radarSearchIcon}>
              <svg
                aria-hidden="true"
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              className={styles.radarSearchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search city..."
              type="text"
              value={searchCity}
            />
            <button
              type="submit"
              className={styles.radarSearchButton}
              disabled={!searchCity.trim()}
            >
              Search
            </button>
          </form>
        )}

        {feedError && <div className={styles.radarErrorAlert}>{feedError}</div>}
      </div>
    </header>
  );
}
