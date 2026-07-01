"use client";

import Image from "next/image";
import { Icons } from "./BottomNav";
import { useNotifications } from "@/hooks/useNotifications";

export type SideNavTab = "Radar" | "Drops" | "Messages" | "Profile";

interface SideNavProps {
  activeTab: SideNavTab;
  onTabChange: (tab: SideNavTab) => void;
}

type NavItem = {
  label: SideNavTab;
  icon: React.ReactNode;
  badge?: boolean; // Add optional badge property
};

export function SideNav({ activeTab, onTabChange }: SideNavProps) {
  const { hasUnreadMessages, hasUnreadNotifications } = useNotifications();

  const navItems: NavItem[] = [
    { label: "Radar", icon: Icons.Radar },
    { label: "Drops", icon: Icons.Drops },
    { label: "Messages", icon: Icons.Messages, badge: hasUnreadMessages },
    { label: "Profile", icon: Icons.Profile, badge: hasUnreadNotifications },
  ];

  return (
    <aside className="side-nav">
      <div className="side-nav__header">
        <div className="side-nav__logo">
          <Image
            alt="Bliss"
            height={48}
            src="/images/bliss_icon.png"
            width={48}
          />
        </div>
      </div>

      <nav className="side-nav__menu">
        {navItems.map((item) => (
          <button
            aria-current={activeTab === item.label ? "page" : undefined}
            key={item.label}
            className={`side-nav__item ${activeTab === item.label ? "side-nav__item--active" : ""}`}
            onClick={() => onTabChange(item.label)}
            type="button"
            title={item.label}
          >
            <span className="side-nav__icon relative">
              {item.icon} {item.badge && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#ff2e63] shadow-[0_0_10px_rgba(255,46,99,0.5)]" />
              )}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
