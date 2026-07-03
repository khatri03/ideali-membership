import { MultiSelectInput } from "../components/inputs/MultiSelectInput/MultiSelectInput";
import type { MembershipTypeFilterOption } from "./MembershipTypesPage.helpers";

type MembershipTypesFiltersProps = {
  draftSearchTerm: string;
  draftStatuses: string[];
  draftPaymentMerchants: string[];
  draftTenures: string[];
  hasPendingFilterChanges: boolean;
  isLoading: boolean;
  selectedSearchTerm: string;
  selectedStatuses: string[];
  selectedPaymentMerchants: string[];
  selectedTenures: string[];
  statusOptions: MembershipTypeFilterOption[];
  paymentMerchantOptions: MembershipTypeFilterOption[];
  tenureOptions: MembershipTypeFilterOption[];
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDraftSearchTermChange: (value: string) => void;
  onDraftStatusesChange: (value: string[]) => void;
  onDraftPaymentMerchantsChange: (value: string[]) => void;
  onDraftTenuresChange: (value: string[]) => void;
};

function normalizeValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort();
}

export function MembershipTypesFilters({
  draftSearchTerm,
  draftStatuses,
  draftPaymentMerchants,
  draftTenures,
  hasPendingFilterChanges,
  isLoading,
  selectedSearchTerm,
  selectedStatuses,
  selectedPaymentMerchants,
  selectedTenures,
  statusOptions,
  paymentMerchantOptions,
  tenureOptions,
  onApplyFilters,
  onClearFilters,
  onDraftSearchTermChange,
  onDraftStatusesChange,
  onDraftPaymentMerchantsChange,
  onDraftTenuresChange,
}: MembershipTypesFiltersProps) {
  const normalizedSelectedStatuses = normalizeValues(selectedStatuses);
  const normalizedSelectedPaymentMerchants = normalizeValues(selectedPaymentMerchants);
  const normalizedSelectedTenures = normalizeValues(selectedTenures);

  return (
    <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <form
        aria-label="Filters"
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (isLoading || !hasPendingFilterChanges) {
            return;
          }

          onApplyFilters();
        }}
      >
        <span aria-hidden="true" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Filters
        </span>

        <div className="grid gap-4 lg:grid-cols-4 lg:items-end">
          <div className="space-y-2">
            <label htmlFor="membership-type-search" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Membership Name
            </label>
            <input
              id="membership-type-search"
              value={draftSearchTerm}
              onChange={(event) => onDraftSearchTermChange(event.target.value)}
              placeholder="Search membership type"
              type="search"
              disabled={isLoading}
              className="h-13 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="membership-type-status-filter" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Status
            </label>
            <MultiSelectInput
              value={draftStatuses}
              onChange={onDraftStatusesChange}
              options={statusOptions}
              placeholder="All statuses"
              isDisabled={isLoading}
              className="w-full"
              inputId="membership-type-status-filter"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="membership-type-merchant-filter"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            >
              Payment Merchant
            </label>
            <MultiSelectInput
              value={draftPaymentMerchants}
              onChange={onDraftPaymentMerchantsChange}
              options={paymentMerchantOptions}
              placeholder="All payment merchants"
              isDisabled={isLoading}
              className="w-full"
              inputId="membership-type-merchant-filter"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="membership-type-tenure-filter" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Tenure
            </label>
            <MultiSelectInput
              value={draftTenures}
              onChange={onDraftTenuresChange}
              options={tenureOptions}
              placeholder="All tenures"
              isDisabled={isLoading}
              className="w-full"
              inputId="membership-type-tenure-filter"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="submit"
            disabled={!hasPendingFilterChanges || isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isLoading ? "Applying..." : "Apply filter"}
          </button>

          {selectedSearchTerm.trim().length > 0 ||
          normalizedSelectedStatuses.length > 0 ||
          normalizedSelectedPaymentMerchants.length > 0 ||
          normalizedSelectedTenures.length > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={isLoading}
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
