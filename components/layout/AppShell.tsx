"use client";

import { type ReactNode, createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppMobileNav } from "./AppMobileNav";
import { SideNav, type SideNavTab } from "./SideNav";

const AppShellContext = createContext<{
  setIsNavHidden: (hidden: boolean) => void;
}>({
  setIsNavHidden: () => {},
});

export const useAppShell = () => useContext(AppShellContext);

const tabRoutes: Record<SideNavTab, string> = {
  Drops: "/drops",
  Messages: "/messages",
  Profile: "/profile",
  Radar: "/radar",
};

type AppShellProps = {
  activeTab: SideNavTab;
  children: ReactNode;
  secondary?: ReactNode;
  detail?: ReactNode;
};

type AppPaneLayoutProps = {
  detail: ReactNode;
  detailActive: boolean;
  detailClassName?: string;
  secondary: ReactNode;
  secondaryClassName?: string;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AppShell({ activeTab, children, secondary, detail }: AppShellProps) {
  const router = useRouter();
  const [isNavHidden, setIsNavHidden] = useState(false);

  const handleTabChange = (tab: SideNavTab) => {
    if (tab === activeTab) {
      return;
    }

    router.push(tabRoutes[tab]);
  };

  const hasPanes = secondary && detail;

  return (
    <AppShellContext.Provider value={{ setIsNavHidden }}>
      <div className={joinClasses("app-shell", (hasPanes) ? "app-shell--3-column" : false)}>
        <SideNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        {hasPanes && (
          <>
            <div className="app-shell__secondary">{secondary}</div>
            <div className="app-shell__detail">{detail}</div>
          </>
        )}
        {!hasPanes && (
          <div className="app-shell__body">
            <div className="app-shell__content">{children}</div>
          </div>
        )}
        {!isNavHidden && <AppMobileNav activeTab={activeTab} onTabChange={handleTabChange} />}
      </div>
    </AppShellContext.Provider>
  );
}

export function AppPaneLayout({
  detail,
  detailActive,
  detailClassName,
  secondary,
  secondaryClassName,
}: AppPaneLayoutProps) {
  const { setIsNavHidden } = useAppShell();

  useEffect(() => {
    setIsNavHidden(detailActive);
    // Reset visibility when the component unmounts
    return () => setIsNavHidden(false);
  }, [detailActive, setIsNavHidden]);

  return (
    <div className="flex min-h-[calc(100dvh-92px-env(safe-area-inset-bottom))] w-full lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(400px,1.18fr)_minmax(320px,0.82fr)] xl:grid-cols-[minmax(440px,1.24fr)_minmax(340px,0.86fr)]">
      <section
        className={joinClasses(
          detailActive ? "hidden lg:flex" : "flex",
          "flex-1 min-h-0 min-w-0 flex-col lg:border-r lg:border-white/8 lg:bg-[linear-gradient(180deg,rgba(14,17,24,0.94),rgba(8,10,14,0.98))]",
          secondaryClassName,
        )}
      >
        {secondary}
      </section>

      <section
        className={joinClasses(
          detailActive ? "fixed inset-0 z-50 flex lg:static lg:z-auto" : "hidden lg:flex",
          "flex-1 min-h-0 min-w-0 flex-col lg:bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(5,7,10,1))]",
          detailClassName,
        )}
      >
        {detail}
      </section>
    </div>
  );
}
