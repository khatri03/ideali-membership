import { MultiSelectInput } from "../../../components/inputs/MultiSelectInput/MultiSelectInput";

export type MembersFilterOption = {
  label: string;
  value: string;
};

type MembersFiltersProps = {
  draftMembershipStatuses: string[];
  draftApprovalStatuses: string[];
  draftMembershipTypeUniqueIds: string[];
  draftSearchTerm: string;
  hasPendingFilterChanges: boolean;
  isMembershipTypesLoading: boolean;
  membershipStatusOptions: MembersFilterOption[];
  approvalStatusOptions: MembersFilterOption[];
  selectedMembershipStatuses: string[];
  selectedApprovalStatuses: string[];
  membershipTypeOptions: MembersFilterOption[];
  selectedMembershipTypeUniqueIds: string[];
  selectedSearchTerm: string;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDraftMembershipStatusesChange: (value: string[]) => void;
  onDraftApprovalStatusesChange: (value: string[]) => void;
  onDraftMembershipTypeUniqueIdsChange: (value: string[]) => void;
  onDraftSearchTermChange: (value: string) => void;
  onResetChanges: () => void;
};

export function MembersFilters({
  membershipStatusOptions,
  approvalStatusOptions,
  draftMembershipStatuses,
  draftApprovalStatuses,
  draftMembershipTypeUniqueIds,
  draftSearchTerm,
  hasPendingFilterChanges,
  isMembershipTypesLoading,
  selectedMembershipStatuses,
  selectedApprovalStatuses,
  membershipTypeOptions,
  selectedMembershipTypeUniqueIds,
  selectedSearchTerm,
  onApplyFilters,
  onClearFilters,
  onDraftMembershipStatusesChange,
  onDraftApprovalStatusesChange,
  onDraftMembershipTypeUniqueIdsChange,
  onDraftSearchTermChange,
  onResetChanges,
}: MembersFiltersProps) {
  return (
    <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Filters
        </label>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Membership Status
          </div>
          <MultiSelectInput
            value={draftMembershipStatuses}
            onChange={onDraftMembershipStatusesChange}
            options={membershipStatusOptions}
            placeholder="All membership statuses"
            className="w-full"
            inputId="membership-status-filter"
          />
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Approval Status
          </div>
          <MultiSelectInput
            value={draftApprovalStatuses}
            onChange={onDraftApprovalStatusesChange}
            options={approvalStatusOptions}
            placeholder="All approval statuses"
            className="w-full"
            inputId="approval-status-filter"
          />
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Membership Types
          </div>
          <MultiSelectInput
            value={draftMembershipTypeUniqueIds}
            onChange={onDraftMembershipTypeUniqueIdsChange}
            options={membershipTypeOptions}
            placeholder="All membership types"
            isDisabled={isMembershipTypesLoading}
            className="w-full"
            inputId="membership-type-filter"
          />
        </div>
        <input
          value={draftSearchTerm}
          onChange={(event) => onDraftSearchTermChange(event.target.value)}
          placeholder="Search by name, email, or phone"
          type="search"
          className="h-13 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onApplyFilters}
            disabled={!hasPendingFilterChanges}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            Apply filter
          </button>
          {hasPendingFilterChanges ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              {draftMembershipStatuses.length +
                draftApprovalStatuses.length +
                draftMembershipTypeUniqueIds.length +
                (draftSearchTerm.trim().length > 0 ? 1 : 0)} pending
            </span>
          ) : null}
          {selectedMembershipStatuses.length > 0 ||
          selectedApprovalStatuses.length > 0 ||
          selectedMembershipTypeUniqueIds.length > 0 ||
          selectedSearchTerm.length > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
            >
              Clear filters
            </button>
          ) : null}
          <button
            type="button"
            onClick={onResetChanges}
            disabled={!hasPendingFilterChanges}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset changes
          </button>
        </div>
      </div>
    </div>
  );
}
