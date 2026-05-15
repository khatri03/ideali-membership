import { cn } from "../../../lib/utils";
import type { MembershipMemberListItem } from "../../../types/membership";

function formatExpiry(value: string | null) {
  if (!value) {
    return "No expiry";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

type MembersTableProps = {
  members: MembershipMemberListItem[];
};

export function MembersTable({ members }: MembersTableProps) {
  return (
    <div className="max-h-[38rem] overflow-auto rounded-[1.75rem] border border-cyan-100 bg-white/95 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)]">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 backdrop-blur">
          <tr className="border-b border-cyan-100 bg-cyan-50/80">
            <th className="h-12 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 sm:px-4">
              Member
            </th>
            <th className="h-12 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 sm:px-4">
              Active Membership
            </th>
            <th className="h-12 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 sm:px-4">
              Email
            </th>
            <th className="h-12 px-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 sm:px-4">
              Membership Expiry
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
              <td className="px-3 py-3 text-sm text-slate-700 sm:px-4">
                <div className="space-y-1">
                  <div className="font-medium text-slate-900">
                    {member.memberFullName}
                  </div>
                  {member.uniqueId ? (
                    <div className="text-xs text-slate-500">{member.uniqueId}</div>
                  ) : null}
                </div>
              </td>
              <td className="px-3 py-3 text-sm text-slate-700 sm:px-4">
                {member.activeMembershipName}
              </td>
              <td className="px-3 py-3 text-sm text-slate-700 sm:px-4">
                {member.email}
              </td>
              <td className="px-3 py-3 text-center text-sm font-medium text-slate-900 sm:px-4">
                {formatExpiry(member.membershipExpiryUtc)}
              </td>
            </tr>
          ))}

          {members.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-12 text-center text-slate-500">
                No registered members found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
