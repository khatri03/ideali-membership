import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../routes";

interface SideNavProps {
  onNavigate: () => void;
}

interface MembershipNavItem {
  label: string;
  to: string;
  comingSoon?: boolean;
}

const membershipItems: MembershipNavItem[] = [
  { label: "Dashboard", to: APP_ROUTES.membershipDashboard },
  { label: "Types", to: APP_ROUTES.membershipTypes },
  { label: "Members", to: APP_ROUTES.membershipMembers, comingSoon: true },
  { label: "Pending Approvals", to: APP_ROUTES.membershipPendingApprovals, comingSoon: true },
];

export function SideNav({ onNavigate }: SideNavProps) {
  const location = useLocation();
  const isMembershipRoute = location.pathname.startsWith(APP_ROUTES.membership);
  const [isMembershipExpanded, setIsMembershipExpanded] = useState(isMembershipRoute);

  useEffect(() => {
    if (isMembershipRoute) {
      setIsMembershipExpanded(true);
    }
  }, [isMembershipRoute]);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 p-5 shadow-xl lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] lg:shadow-none">
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-700 uppercase">
          Navigation
        </p>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
        >
          Close
        </button>
      </div>

      <nav className="mt-6 space-y-3 lg:mt-0">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2">
          <button
            type="button"
            onClick={() => setIsMembershipExpanded((current) => !current)}
            className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-white"
            aria-expanded={isMembershipExpanded}
            aria-controls="membership-nav-group"
          >
            <span>Membership</span>
            <span
              className={[
                "text-slate-500 transition-transform",
                isMembershipExpanded ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden="true"
            >
              v
            </span>
          </button>

          {isMembershipExpanded ? (
            <div
              id="membership-nav-group"
              className="mt-2 space-y-2"
            >
              {membershipItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === APP_ROUTES.membershipDashboard}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                      isActive
                        ? "bg-cyan-500/10 text-cyan-800"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.label}</span>
                      {item.comingSoon ? (
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Soon
                        </span>
                      ) : null}
                      {isActive ? (
                        <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          Active
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <NavLink
            to={APP_ROUTES.customForms}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                isActive
                  ? "bg-cyan-500/10 text-cyan-800"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span>Custom Forms</span>
                {isActive ? (
                  <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    Active
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      <div className="mt-8 rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Quick note</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Keep membership actions grouped together so the structure stays easy to scan.
        </p>
      </div>
    </aside>
  );
}
