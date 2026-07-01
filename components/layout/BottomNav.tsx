import type { ReactNode } from "react";

type BottomNavItem<T extends string> = {
  label: T;
  icon: ReactNode;
};

interface BottomNavProps<T extends string> {
  activeItem: T;
  items: BottomNavItem<T>[];
  onChange: (item: T) => void;
}

export function BottomNav<T extends string>({
  activeItem,
  items,
  onChange,
}: BottomNavProps<T>) {
  return (
    <nav className="app-bottom-nav" aria-label="Primary">
      <div className="app-bottom-nav__card" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {items.map((item) => (
          <button
            aria-label={item.label}
            className={item.label === activeItem ? "app-bottom-nav__button app-bottom-nav__button--active" : "app-bottom-nav__button"}
            key={item.label}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', flex: '1'
            }}
            onClick={() => onChange(item.label)}
            type="button"
          >
            {item.icon}
            {item.label === activeItem && (
              <span style={{ position: 'absolute', bottom: '0px', width: '24px', height: '2px', backgroundColor: '#27d6c5', borderRadius: '1px' }} />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

export const Icons = {
  Radar: (
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
  ),
  Drops: (
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
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  ),
  Messages: (
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
      <line x1="22" x2="11" y1="2" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Profile: (
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};
