import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { formatUtcToLocalDateTime } from "../../../lib/dateTime";
import { buildMembershipMemberDetailPath } from "../../../routes";
import type { MembershipMemberListItem, MembershipMemberSortBy } from "../../../types/membership";
import type { MembersFilterOption } from "./MembersFilters";

function formatExpiry(value: string | null) {
  return formatUtcToLocalDateTime(value);
}

function getMembershipStatusStyles(value: string) {
  switch (value) {
    case "PendingApproval":
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Expired":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "InActive":
    case "NearExpiry":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

type MembersTableProps = {
  members: MembershipMemberListItem[];
  membershipStatusOptions: MembersFilterOption[];
  sortBy?: MembershipMemberSortBy;
  sortOrder?: "asc" | "desc";
  onSort: (sortBy: MembershipMemberSortBy) => void;
  onClearSort: () => void;
};

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function MemberDetailMenu({ member }: { member: MembershipMemberListItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      setIsOpen(true);
      return;
    }

    const gap = 8;
    const menuWidth = 192;
    const menuHeight = 48;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + gap && spaceAbove > menuHeight + gap;

    setMenuPosition({
      top: openUpward ? Math.max(gap, rect.top - menuHeight - gap) : rect.bottom + gap,
      left: Math.max(gap, Math.min(rect.left, window.innerWidth - menuWidth - gap)),
    });
    setIsOpen(true);
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={openMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open detail actions for ${member.memberFullName}`}
        title="Detail"
      >
        <DotsIcon />
      </button>

      {isOpen && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[1200] w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              {member.uniqueId ? (
                <Link
                  to={buildMembershipMemberDetailPath(member.uniqueId)}
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Detail
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-300"
                  title="Member ID unavailable from the current API response"
                >
                  Detail unavailable
                </button>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function MembersTable({
  members,
  membershipStatusOptions,
  sortBy,
  sortOrder,
  onSort,
  onClearSort,
}: MembersTableProps) {
  const membershipStatusLabelMap = new Map(
    membershipStatusOptions.map((item) => [item.value, item.label] as const),
  );

  function renderSortIcon(columnSortBy: MembershipMemberSortBy) {
    if (sortBy !== columnSortBy) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }

    return sortOrder === "desc" ? (
      <ArrowDown size={14} className="text-cyan-700" />
    ) : (
      <ArrowUp size={14} className="text-cyan-700" />
    );
  }

  function getSortTooltip(columnSortBy: MembershipMemberSortBy, label: string) {
    if (sortBy !== columnSortBy) {
      return `Sort by ${label}`;
    }

    if (sortOrder === "asc") {
      return `Sort by ${label} descending`;
    }

    return `Clear sort by ${label}`;
  }

  return (
    <div className="space-y-3">
      {sortBy ? (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClearSort}
            title="Clear current sort"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-cyan-100"
          >
            <X size={14} />
            Clear Sort
          </button>
        </div>
      ) : null}

      <div className="max-h-[38rem] overflow-auto rounded-[1.75rem] border border-cyan-100 bg-white/95 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)]">
        <table aria-label="Registered members" className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 backdrop-blur">
            <tr className="border-b border-cyan-100 bg-cyan-50/80">
              <th
                scope="col"
                className="h-12 border-b border-r border-cyan-200 px-3 text-left sm:px-4"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                  Actions
                </span>
              </th>
              <th
                scope="col"
                aria-sort={sortBy === "memberFullName" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
                className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4"
              >
                <button
                  type="button"
                  onClick={() => onSort("memberFullName")}
                  title={getSortTooltip("memberFullName", "Member")}
                  className="inline-flex w-full items-center justify-start gap-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                >
                  Member
                  {renderSortIcon("memberFullName")}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortBy === "activeMembershipName" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
                className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4"
              >
                <button
                  type="button"
                  onClick={() => onSort("activeMembershipName")}
                  title={getSortTooltip("activeMembershipName", "Active Membership")}
                  className="inline-flex w-full items-center justify-start gap-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                >
                  Active Membership
                  {renderSortIcon("activeMembershipName")}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortBy === "membershipStatus" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
                className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4"
              >
                <button
                  type="button"
                  onClick={() => onSort("membershipStatus")}
                  title={getSortTooltip("membershipStatus", "Membership Status")}
                  className="inline-flex w-full items-center justify-start gap-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                >
                  Membership Status
                  {renderSortIcon("membershipStatus")}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortBy === "email" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
                className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4"
              >
                <button
                  type="button"
                  onClick={() => onSort("email")}
                  title={getSortTooltip("email", "Email")}
                  className="inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                >
                  Email
                  {renderSortIcon("email")}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortBy === "membershipExpiryUtc" ? (sortOrder === "desc" ? "descending" : "ascending") : "none"}
                className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4"
              >
                <button
                  type="button"
                  onClick={() => onSort("membershipExpiryUtc")}
                  title={getSortTooltip("membershipExpiryUtc", "Membership Expiry")}
                  className="inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                >
                  Membership Expiry
                  {renderSortIcon("membershipExpiryUtc")}
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {members.map((member, index) => (
              <tr
                key={member.uniqueId || `${member.memberFullName}-${member.email}-${index}`}
                className={cn(
                  "border-b border-slate-200/70 hover:bg-cyan-50/40",
                  index % 2 === 0 ? "bg-white" : "bg-slate-50/45",
                )}
              >
                <td className="border-r border-slate-200/70 px-3 py-3 text-sm text-slate-700 sm:px-4">
                  <MemberDetailMenu member={member} />
                </td>
                <td className="border-r border-slate-200/70 px-3 py-3 text-sm text-slate-700 sm:px-4">
                  <div className="font-medium text-slate-900">
                    {member.uniqueId ? (
                      <Link
                        to={buildMembershipMemberDetailPath(member.uniqueId)}
                        className="inline-flex items-center gap-2 text-left font-semibold text-cyan-700 underline decoration-cyan-200 underline-offset-4 transition hover:text-cyan-800 hover:decoration-cyan-400"
                      >
                        {member.memberFullName}
                      </Link>
                    ) : (
                      member.memberFullName
                    )}
                  </div>
                </td>
                <td className="border-r border-slate-200/70 px-3 py-3 text-sm text-slate-700 sm:px-4">
                  {member.activeMembershipName}
                </td>
                <td className="border-r border-slate-200/70 px-3 py-3 text-sm text-slate-700 sm:px-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                      getMembershipStatusStyles(member.membershipStatus),
                    )}
                  >
                    {membershipStatusLabelMap.get(member.membershipStatus) ?? member.membershipStatus}
                  </span>
                </td>
                <td className="border-r border-slate-200/70 px-3 py-3 text-sm text-slate-700 sm:px-4">
                  {member.email}
                </td>
                <td className="px-3 py-3 text-center text-sm text-slate-900 sm:px-4">
                  {formatExpiry(member.membershipExpiryUtc)}
                </td>
              </tr>
            ))}

            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No registered members found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
