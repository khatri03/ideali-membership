import { MultiSelectInput } from "../../../components/inputs/MultiSelectInput/MultiSelectInput";

export type MembersFilterOption = {
  label: string;
  value: string;
};

type MembersFiltersProps = {
  draftMembershipStatuses: string[];
  draftMembershipTypeUniqueIds: string[];
  draftSearchTerm: string;
  hasPendingFilterChanges: boolean;
  isMembersFetching: boolean;
  isMembershipTypesLoading: boolean;
  isMembershipStatusesLoading: boolean;
  membershipStatusOptions: MembersFilterOption[];
  selectedMembershipStatuses: string[];
  membershipTypeOptions: MembersFilterOption[];
  selectedMembershipTypeUniqueIds: string[];
  selectedSearchTerm: string;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDraftMembershipStatusesChange: (value: string[]) => void;
  onDraftMembershipTypeUniqueIdsChange: (value: string[]) => void;
  onDraftSearchTermChange: (value: string) => void;
};

export function MembersFilters({
  membershipStatusOptions,
  draftMembershipStatuses,
  draftMembershipTypeUniqueIds,
  draftSearchTerm,
  hasPendingFilterChanges,
  isMembersFetching,
  isMembershipTypesLoading,
  isMembershipStatusesLoading,
  selectedMembershipStatuses,
  membershipTypeOptions,
  selectedMembershipTypeUniqueIds,
  selectedSearchTerm,
  onApplyFilters,
  onClearFilters,
  onDraftMembershipStatusesChange,
  onDraftMembershipTypeUniqueIdsChange,
  onDraftSearchTermChange,
}: MembersFiltersProps) {
  return (
    <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <form
        aria-label="Filters"
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (isMembersFetching || !hasPendingFilterChanges) {
            return;
          }
          onApplyFilters();
        }}
      >
        <span aria-hidden="true" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Filters
        </span>
        <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
          <div className="space-y-2">
            <label
              htmlFor="member-search"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            >
              Search
            </label>
            <input
              id="member-search"
              value={draftSearchTerm}
              onChange={(event) => onDraftSearchTermChange(event.target.value)}
              placeholder="Name, email, or phone"
              type="search"
              disabled={isMembersFetching}
              className="h-13 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="membership-type-filter"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            >
              Membership Types
            </label>
            <MultiSelectInput
              value={draftMembershipTypeUniqueIds}
              onChange={onDraftMembershipTypeUniqueIdsChange}
              options={membershipTypeOptions}
              placeholder="All membership types"
              isDisabled={isMembershipTypesLoading || isMembersFetching}
              className="w-full"
              inputId="membership-type-filter"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="membership-status-filter"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            >
              Membership Status
            </label>
            <MultiSelectInput
              value={draftMembershipStatuses}
              onChange={onDraftMembershipStatusesChange}
              options={membershipStatusOptions}
              placeholder="All membership statuses"
              isDisabled={isMembershipStatusesLoading || isMembersFetching}
              className="w-full"
              inputId="membership-status-filter"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="submit"
            disabled={!hasPendingFilterChanges || isMembersFetching}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isMembersFetching ? (
              <>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Applying…
              </>
            ) : (
              "Apply filter"
            )}
          </button>
          {selectedMembershipStatuses.length > 0 ||
          selectedMembershipTypeUniqueIds.length > 0 ||
          selectedSearchTerm.length > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={isMembersFetching}
              className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
