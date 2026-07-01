import Link from "next/link";
import styles from "./radar.module.css";

interface RadarWishlistSwitchProps {
  className?: string;
  currentPage: "radar" | "wishlist";
  fixed?: boolean;
  showLabel?: boolean;
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  );
}

export function RadarWishlistSwitch({
  className = "",
  currentPage,
  fixed = true,
  showLabel = true,
}: RadarWishlistSwitchProps) {
  const target =
    currentPage === "radar"
      ? {
          href: "/radar/wishlist",
          icon: <WishlistIcon />,
          label: "Wishlist",
        }
      : {
          href: "/radar",
          icon: <CloseIcon />,
          label: "Radar",
        };

  return (
    <Link
      aria-label={`Open ${target.label}`}
      className={`${styles.wishlistSwitch} inline-flex items-center justify-center ${showLabel ? 'gap-2 px-5 py-3 text-sm font-bold' : 'h-11 w-11'} rounded-full border border-white/20 bg-white/5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all active:scale-90 ${fixed !== false ? 'fixed z-40' : ''} ${className}`}
      href={target.href}
    >
      {target.icon}
      {showLabel ? <span>{target.label}</span> : null}
    </Link>
  );
}
