import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../Footer/Footer";
import { SideNav } from "../SideNav/SideNav";
import { TopBar } from "../TopBar/TopBar";
import { APP_ROUTES } from "../../../routes";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isCustomFormCreateRoute = location.pathname.startsWith(APP_ROUTES.customFormsCreate);
  const [isNavVisible, setIsNavVisible] = useState(!isCustomFormCreateRoute);

  useEffect(() => {
    if (isCustomFormCreateRoute) {
      setIsNavVisible(false);
    }
  }, [isCustomFormCreateRoute]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900">
      <TopBar
        isNavVisible={isNavVisible}
        onNavToggle={() => setIsNavVisible((current) => !current)}
      />

      <div className="flex w-full flex-1 gap-6 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        {isNavVisible ? (
          <SideNav
            onNavigate={() => {
              if (window.innerWidth < 1024 || isCustomFormCreateRoute) {
                setIsNavVisible(false);
              }
            }}
          />
        ) : null}

        <main className="min-w-0 flex-1 space-y-6">
          {children ?? <Outlet />}
        </main>
      </div>

      <Footer />
    </div>
  );
}

