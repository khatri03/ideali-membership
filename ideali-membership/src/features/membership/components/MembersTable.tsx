import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatUtcToLocalDateTime } from "../../../lib/dateTime";
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
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 backdrop-blur">
            <tr className="border-b border-cyan-100 bg-cyan-50/80">
              <th className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4">
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
              <th className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4">
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
              <th className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4">
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
              <th className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4">
                <button
                  type="button"
                  onClick={() => onSort("email")}
                  title={getSortTooltip("email", "Email")}
                  className="inline-flex w-full items-center justify-start gap-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                >
                  Email
                  {renderSortIcon("email")}
                </button>
              </th>
              <th className="h-12 border-b border-r border-cyan-200 px-3 sm:px-4">
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
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900">
                      {member.memberFullName}
                    </div>
                    {member.uniqueId ? (
                      <div className="text-xs text-slate-500">{member.uniqueId}</div>
                    ) : null}
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
