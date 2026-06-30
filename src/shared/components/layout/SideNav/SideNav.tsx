import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, useLocation } from "react-router-dom";
import { APP_ROUTES, buildMembershipMembersPath, buildMembershipPollsPath } from "../../../../routes";
import {
  MEMBERSHIP_PENDING_APPROVAL_COUNT_QUERY_KEY,
  fetchPendingApprovalCount,
} from "../../../../lib/membershipMembers";

interface SideNavProps {
  onNavigate: () => void;
}

interface MembershipNavItem {
  label: string;
  to: string;
  comingSoon?: boolean;
}

const STALE_TIME_1_MIN_MS = 60 * 1000;

function isMembershipNavItemActive(item: MembershipNavItem, locationPathname: string, locationSearch: string) {
  const itemPath = item.to.split("?")[0];

  if (item.label === "Pending Approvals") {
    if (locationPathname !== APP_ROUTES.membershipMembers) {
      return false;
    }

    const searchParams = new URLSearchParams(locationSearch);
    return searchParams.getAll("membershipStatuses").some((value) => value === "PendingApproval");
  }

  if (item.label === "Members") {
    if (locationPathname !== APP_ROUTES.membershipMembers) {
      return false;
    }

    const searchParams = new URLSearchParams(locationSearch);
    const isPendingApprovalsShortcut = searchParams
      .getAll("membershipStatuses")
      .some((value) => value === "PendingApproval");

    return !isPendingApprovalsShortcut;
  }

  if (item.label === "Invoices") {
    return locationPathname.startsWith(APP_ROUTES.membershipInvoices);
  }

  if (item.label === "Polls") {
    return locationPathname.startsWith(buildMembershipPollsPath());
  }

  return locationPathname === itemPath;
}

const membershipItems: MembershipNavItem[] = [
  { label: "Dashboard", to: APP_ROUTES.membershipDashboard },
  { label: "Types", to: APP_ROUTES.membershipTypes },
  { label: "Members", to: APP_ROUTES.membershipMembers },
  {
    label: "Pending Approvals",
    to: buildMembershipMembersPath({ membershipStatuses: ["PendingApproval"] }),
  },
  { label: "Invoices", to: APP_ROUTES.membershipInvoices },
  { label: "Polls", to: buildMembershipPollsPath() },
];

export function SideNav({ onNavigate }: SideNavProps) {
  const location = useLocation();
  const isMembershipRoute = location.pathname.startsWith(APP_ROUTES.membership);
  const [isMembershipExpanded, setIsMembershipExpanded] = useState(isMembershipRoute);
  const pendingApprovalCountQuery = useQuery({
    queryKey: MEMBERSHIP_PENDING_APPROVAL_COUNT_QUERY_KEY,
    queryFn: () => fetchPendingApprovalCount(),
    staleTime: STALE_TIME_1_MIN_MS,
  });
  const pendingApprovalCount = pendingApprovalCountQuery.data ?? 0;

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
                  onClick={onNavigate}
                  className={() =>
                    [
                      "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                      isMembershipNavItemActive(item, location.pathname, location.search)
                        ? "bg-cyan-500/10 text-cyan-800"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")
                  }
                >
                  {() => {
                    const isActive = isMembershipNavItemActive(item, location.pathname, location.search);
                    const isPendingApprovalsItem = item.label === "Pending Approvals";

                    return (
                      <>
                        <span>{item.label}</span>
                        {isPendingApprovalsItem && pendingApprovalCount > 0 ? (
                          <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            {pendingApprovalCount}
                          </span>
                        ) : null}
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
                    );
                  }}
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

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <NavLink
            to={APP_ROUTES.dndPlayground}
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
                <span>Dnd Playground</span>
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
