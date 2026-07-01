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
    <nav className="app-mobile-nav" aria-label="Primary" style={{ transform: 'translateY(8px)' }}>
      <div className="app-mobile-nav__card" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {navItems.map((item) => (
          <button
            aria-current={item.label === activeTab ? "page" : undefined}
            aria-label={item.label}
            className={
              item.label === activeTab
                ? "app-mobile-nav__button app-mobile-nav__button--active"
                : "app-mobile-nav__button"
            }
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', flex: '1'
            }}
            key={item.label}
            onClick={() => onTabChange(item.label)}
            type="button"
          >
            <span className="app-mobile-nav__icon">
              {item.icon}
              {item.hasBadge && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#ff2e63] border border-black shadow-[0_0_10px_rgba(255,46,99,0.5)]" />
              )}
            </span>
            {item.label === activeTab && (
              <span style={{ position: 'absolute', bottom: '0px', width: '24px', height: '2px', backgroundColor: '#27d6c5', borderRadius: '1px' }} />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
