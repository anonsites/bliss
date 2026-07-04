"use client";

import { Icons } from "./BottomNav";
import type { SideNavTab } from "./SideNav";
import { useNotifications } from "@/hooks/useNotifications";

type AppMobileNavProps = {
  activeTab: SideNavTab;
  onTabChange: (tab: SideNavTab) => void;
};

type NavItem = {
  label: SideNavTab;
  icon: React.ReactNode;
  hasBadge?: boolean;
};

export function AppMobileNav({ activeTab, onTabChange }: AppMobileNavProps) {
  const { hasUnreadMessages, hasUnreadNotifications } = useNotifications();

  const navItems: NavItem[] = [
    { label: "Radar", icon: Icons.Radar },
    { label: "Drops", icon: Icons.Drops },
    { label: "Messages", icon: Icons.Messages, hasBadge: hasUnreadMessages },
    { label: "Profile", icon: Icons.Profile, hasBadge: hasUnreadNotifications },
  ];

  return (
    <nav className="app-mobile-nav" aria-label="Primary">
      <div className="app-mobile-nav__card">
        {navItems.map((item) => (
          <button
            aria-current={item.label === activeTab ? "page" : undefined}
            aria-label={item.label}
            className={
              item.label === activeTab
                ? "app-mobile-nav__button app-mobile-nav__button--active"
                : "app-mobile-nav__button"
            }
            key={item.label}
            onClick={() => onTabChange(item.label)}
            type="button"
          >
            <span className="app-mobile-nav__icon">
              {item.icon}
              {item.hasBadge && (
                <span className="app-mobile-nav__badge" />
              )}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
