import {
  getMembershipPricingDays,
  MEMBERSHIP_PRICING_CONTENT,
  MEMBERSHIP_PRICING_MONTHS,
  MEMBERSHIP_PRICING_OPTIONS,
} from "./MembershipPricingStepPage.fields";
import { useMembershipPricingStep } from "./MembershipPricingStepPage.hooks";

function MembershipPricingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-[1.5rem] border border-slate-200 bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

function MembershipPricingError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-400/50 text-[10px] font-bold">
          !
        </div>
        <div className="space-y-2">
          <p>{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function MembershipPricingStepPage() {
  const {
    selectedPricing,
    selectedMembershipCharges,
    selectedAnnualExpiryMode,
    selectedCustomExpiryMonth,
    selectedCustomExpiryDay,
    selectedCustomExpiryDays,
    error,
    isLoading,
    isSaving,
    reload,
    selectPricing,
    selectMembershipCharges,
    selectAnnualExpiryMode,
    selectCustomExpiryMonth,
    selectCustomExpiryDay,
    selectCustomExpiryDays,
  } = useMembershipPricingStep();
  const selectedOption = MEMBERSHIP_PRICING_OPTIONS.find((option) => option.value === selectedPricing);
  const isAnnualSelected = selectedPricing === 2;
  const isCustomSelected = selectedPricing === 4;
  const isAnnualCustomSelected = selectedAnnualExpiryMode === "custom";
  const availableDays = getMembershipPricingDays(selectedCustomExpiryMonth);
  const annualPanelClassName = [
    "overflow-hidden transition-all duration-300 ease-out",
    isAnnualSelected ? "max-h-[24rem] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2",
  ].join(" ");
  const customPanelClassName = [
    "overflow-hidden transition-all duration-300 ease-out",
    isCustomSelected ? "max-h-[14rem] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2",
  ].join(" ");

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipPricingError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_PRICING_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_PRICING_CONTENT.description}</p>
      </div>

      <div className="mt-8 max-w-5xl space-y-4">
        {isLoading ? (
          <MembershipPricingSkeleton />
        ) : (
          <>
            <p className="text-sm text-slate-600">{MEMBERSHIP_PRICING_CONTENT.helper}</p>

            <fieldset disabled={isSaving} className="space-y-4">
              <label className="block space-y-2">
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                  <span>{MEMBERSHIP_PRICING_CONTENT.priceLabel}</span>
                  <span className="text-rose-600" aria-label="Required" title="Required">
                    *
                  </span>
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={selectedMembershipCharges}
                  onChange={(event) => selectMembershipCharges(event.target.value)}
                  placeholder="0.00"
                  className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
                <p className="text-sm text-slate-500">{MEMBERSHIP_PRICING_CONTENT.priceHelper}</p>
              </label>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {MEMBERSHIP_PRICING_OPTIONS.map((option) => {
                  const isSelected = selectedPricing === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectPricing(option.value)}
                      className={[
                        "group rounded-[1.5rem] border p-4 text-left transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
                        isSelected
                          ? "border-cyan-300 bg-cyan-50 shadow-sm"
                          : "border-slate-300 bg-white hover:border-cyan-200 hover:bg-cyan-50/60",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition",
                            isSelected
                              ? "border-cyan-500 bg-cyan-500 text-white"
                              : "border-slate-400 bg-white text-transparent group-hover:border-cyan-300",
                          ].join(" ")}
                          aria-hidden="true"
                        />

                        <div className="min-w-0">
                          <p className="text-base font-semibold text-slate-900">{option.label}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={annualPanelClassName}>
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Renewal Due On</p>
                      {isAnnualCustomSelected ? (
                        <p className="mt-1 text-sm text-slate-500">
                          Month and date are required for the custom annual expiry.
                        </p>
                      ) : null}
                    </div>
                    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                      Required
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <label
                      className={[
                        "group flex cursor-pointer items-start gap-3 rounded-[1.5rem] border p-4 text-left transition",
                        "focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2",
                        !isAnnualCustomSelected
                          ? "border-cyan-300 bg-cyan-50 shadow-sm"
                          : "border-slate-300 bg-white hover:border-cyan-200 hover:bg-cyan-50/60",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="annual-expiry-mode"
                        checked={!isAnnualCustomSelected}
                        onChange={() => selectAnnualExpiryMode("renewal")}
                        className="sr-only"
                      />
                      <span
                        className={[
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition",
                          !isAnnualCustomSelected
                            ? "border-cyan-500 bg-cyan-500 text-white"
                            : "border-slate-400 bg-white text-transparent group-hover:border-cyan-300",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      <span className="space-y-1">
                        <span className="block text-base font-semibold text-slate-900">
                          {MEMBERSHIP_PRICING_CONTENT.annualRenewalLabel}
                        </span>
                      </span>
                    </label>

                    <label
                      className={[
                        "group flex cursor-pointer items-start gap-3 rounded-[1.5rem] border p-4 text-left transition",
                        "focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2",
                        isAnnualCustomSelected
                          ? "border-cyan-300 bg-cyan-50 shadow-sm"
                          : "border-slate-300 bg-white hover:border-cyan-200 hover:bg-cyan-50/60",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="annual-expiry-mode"
                        checked={isAnnualCustomSelected}
                        onChange={() => selectAnnualExpiryMode("custom")}
                        className="sr-only"
                      />
                      <span
                        className={[
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition",
                          isAnnualCustomSelected
                            ? "border-cyan-500 bg-cyan-500 text-white"
                            : "border-slate-400 bg-white text-transparent group-hover:border-cyan-300",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      <span className="space-y-1">
                        <span className="block text-base font-semibold text-slate-900">
                          {MEMBERSHIP_PRICING_CONTENT.annualCustomLabel}
                        </span>
                      </span>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                        <span>Month</span>
                        <span className="text-rose-600" aria-label="Required" title="Required">
                          *
                        </span>
                      </span>
                      <select
                        value={selectedCustomExpiryMonth ?? ""}
                        onChange={(event) =>
                          selectCustomExpiryMonth(event.target.value ? Number(event.target.value) : null)
                        }
                        disabled={!isAnnualCustomSelected}
                        required={isAnnualCustomSelected}
                        aria-required={isAnnualCustomSelected}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">Select month</option>
                        {MEMBERSHIP_PRICING_MONTHS.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                        <span>Date</span>
                        <span className="text-rose-600" aria-label="Required" title="Required">
                          *
                        </span>
                      </span>
                      <select
                        value={selectedCustomExpiryDay ?? ""}
                        onChange={(event) =>
                          selectCustomExpiryDay(event.target.value ? Number(event.target.value) : null)
                        }
                        disabled={!isAnnualCustomSelected}
                        required={isAnnualCustomSelected}
                        aria-required={isAnnualCustomSelected}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">
                          {selectedCustomExpiryMonth ? "Select date" : "Select a month first"}
                        </option>
                        {availableDays.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              <div className={customPanelClassName}>
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">Expires In</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={selectedCustomExpiryDays ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        selectCustomExpiryDays(nextValue ? Number(nextValue) : null);
                      }}
                      placeholder="14"
                      className="w-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    />
                    <span className="text-sm font-semibold text-slate-700">Days</span>
                    <span className="text-rose-600 text-base font-semibold" aria-label="Required" title="Required">
                      *
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">{MEMBERSHIP_PRICING_CONTENT.customHelper}</p>
                </div>
              </div>

            </fieldset>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {selectedOption ? selectedOption.description : "Select a tenure option to see its description here."}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

