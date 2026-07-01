"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./mobile-top-nav.module.css";

const DEFAULT_SCROLL_THRESHOLD = 36;

type MobileTopNavProps = {
  ariaLabel?: string;
  href?: string;
  label?: string;
  scrollThreshold?: number;
};

export function MobileTopNav({
  ariaLabel = "BLISS home",
  href = "/",
  label = "BLISS",
  scrollThreshold = DEFAULT_SCROLL_THRESHOLD,
}: MobileTopNavProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const syncVisibility = () => {
      setIsVisible(window.scrollY > scrollThreshold);
    };

    syncVisibility();
    window.addEventListener("scroll", syncVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncVisibility);
    };
  }, [scrollThreshold]);

  return (
    <div className={`${styles.root} ${isVisible ? styles["root--visible"] : ""}`}>
      <Link aria-label={ariaLabel} className={styles.card} href={href}>
        <Image
          alt={`${label} icon`}
          className={styles.icon}
          height={32}
          src="/images/bliss_icon.png"
          width={32}
        />
        <span className={`${styles.title} font-rosemary`}>{label}</span>
      </Link>
    </div>
  );
}
