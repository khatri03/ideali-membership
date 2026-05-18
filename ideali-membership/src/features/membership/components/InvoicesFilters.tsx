import { MultiSelectInput } from "../../../components/inputs/MultiSelectInput/MultiSelectInput";
import type { MembersFilterOption } from "./MembersFilters";
import type { MembershipInvoiceStatus } from "../types/invoice";

type InvoicesFiltersProps = {
  draftSearchTerm: string;
  draftMembershipTypeUniqueIds: string[];
  draftStatusFilters: MembershipInvoiceStatus[];
  hasPendingFilterChanges: boolean;
  isMembershipTypesLoading: boolean;
  isInvoicesFetching: boolean;
  selectedSearchTerm: string;
  selectedMembershipTypeUniqueIds: string[];
  selectedStatusFilters: MembershipInvoiceStatus[];
  defaultStatusFilters: MembershipInvoiceStatus[];
  membershipTypeOptions: MembersFilterOption[];
  statusOptions: Array<{ label: string; value: MembershipInvoiceStatus }>;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDraftSearchTermChange: (value: string) => void;
  onDraftMembershipTypeUniqueIdsChange: (value: string[]) => void;
  onDraftStatusFiltersChange: (value: string[]) => void;
};

export function InvoicesFilters({
  draftSearchTerm,
  draftMembershipTypeUniqueIds,
  draftStatusFilters,
  hasPendingFilterChanges,
  isMembershipTypesLoading,
  isInvoicesFetching,
  selectedSearchTerm,
  selectedMembershipTypeUniqueIds,
  selectedStatusFilters,
  defaultStatusFilters,
  membershipTypeOptions,
  statusOptions,
  onApplyFilters,
  onClearFilters,
  onDraftSearchTermChange,
  onDraftMembershipTypeUniqueIdsChange,
  onDraftStatusFiltersChange,
}: InvoicesFiltersProps) {
  const normalizedSelectedMembershipTypes = [...selectedMembershipTypeUniqueIds].sort().join(",");
  const normalizedSelectedStatuses = [...selectedStatusFilters].sort().join(",");
  const normalizedDefaultStatuses = [...defaultStatusFilters].sort().join(",");

  return (
    <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <form
        aria-label="Filters"
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (isInvoicesFetching || !hasPendingFilterChanges) {
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
            <label htmlFor="invoice-search" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search
            </label>
            <input
              id="invoice-search"
              value={draftSearchTerm}
              onChange={(event) => onDraftSearchTermChange(event.target.value)}
              placeholder="Invoice number, member, membership, or email"
              type="search"
              disabled={isInvoicesFetching}
              className="h-13 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="invoice-membership-type-filter"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            >
              Membership Types
            </label>
            <MultiSelectInput
              value={draftMembershipTypeUniqueIds}
              onChange={onDraftMembershipTypeUniqueIdsChange}
              options={membershipTypeOptions}
              placeholder="All membership types"
              isDisabled={isMembershipTypesLoading || isInvoicesFetching}
              className="w-full"
              inputId="invoice-membership-type-filter"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="invoice-status-filter" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Invoice Status
            </label>
            <MultiSelectInput
              value={draftStatusFilters}
              onChange={onDraftStatusFiltersChange}
              options={statusOptions}
              placeholder="Select invoice statuses"
              isDisabled={isInvoicesFetching}
              className="w-full"
              inputId="invoice-status-filter"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="submit"
            disabled={!hasPendingFilterChanges || isInvoicesFetching}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isInvoicesFetching ? "Applying..." : "Apply filter"}
          </button>

          {selectedSearchTerm.length > 0 ||
          normalizedSelectedMembershipTypes.length > 0 ||
          normalizedSelectedStatuses !== normalizedDefaultStatuses ? (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={isInvoicesFetching}
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
