import { forwardRef, type InputHTMLAttributes } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MEMBERSHIP_ADVANCE_SETTINGS_CONTENT } from "./MembershipAdvanceSettingsStepPage.fields";
import { useMembershipAdvanceSettingsStep } from "./MembershipAdvanceSettingsStepPage.hooks";
import type { MembershipTypeUpgradePathDraft } from "../../../types/membership";

const DateTimeInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    readOnly
    inputMode="none"
    className={[
      "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition",
      "focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
      className ?? "",
    ].join(" ")}
    {...props}
  />
));

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.9]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[2.2]">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

function MembershipAdvanceSettingsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-[1.5rem] border border-slate-200 bg-slate-100 p-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-4 w-52 animate-pulse rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function MembershipAdvanceSettingsError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function MembershipUpgradePathSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-[1.5rem] border border-slate-200 bg-slate-100 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getChargeRuleLabel(value: MembershipTypeUpgradePathDraft["chargeRule"]) {
  switch (value) {
    case "FullPrice":
      return "Full price";
    case "PriceDifference":
      return "Price difference";
    case "FixedAmount":
      return "Fixed amount";
    case "Free":
      return "Free";
    case "ManualReview":
      return "Manual review";
    default:
      return value;
  }
}

function formatAmount(value: string) {
  if (!value.trim()) {
    return "Not set";
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function MembershipAdvanceSettingsStepPage() {
  const {
    registrationWindowEnabled,
    registrationStartDateUtc,
    registrationEndDateUtc,
    requiresApproval,
    error,
    validationError,
    isLoading,
    isSaving,
    isUpgradePathLoading,
    upgradePaths,
    membershipTypeOptions,
    upgradePathError,
    upgradePathValidationError,
    isUpgradePathModalOpen,
    upgradePathDraft,
    editingUpgradePathId,
    pendingUpgradePathRemoval,
    reload,
    setRegistrationWindowEnabled,
    setRegistrationStartDateUtc,
    setRegistrationEndDateUtc,
    setRequiresApproval,
    openUpgradePathModal,
    closeUpgradePathModal,
    updateUpgradePathDraft,
    submitUpgradePathDraft,
    requestUpgradePathRemoval,
    confirmUpgradePathRemoval,
    cancelUpgradePathRemoval,
  } = useMembershipAdvanceSettingsStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipAdvanceSettingsError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.description}
        </p>
      </div>

      <div className="mt-8 max-w-5xl space-y-4">
        {isLoading ? (
          <MembershipAdvanceSettingsSkeleton />
        ) : (
          <>
            <div className="w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm md:w-[34rem] lg:w-[38rem]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                  {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.approvalLabel}
                </p>
                <button
                  type="button"
                  onClick={() => setRequiresApproval(!requiresApproval)}
                  data-wizard-focus="true"
                  className={[
                    "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                    requiresApproval ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-slate-200",
                  ].join(" ")}
                  aria-pressed={requiresApproval}
                  aria-label={requiresApproval ? "Disable approval requirement" : "Enable approval requirement"}
                >
                  <span
                    className={[
                      "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                      requiresApproval ? "translate-x-7" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>
            </div>

            <div className="w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm md:w-[34rem] lg:w-[38rem]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Registration Window
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    If provided, subscriptions will only be available within this date range.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRegistrationWindowEnabled(!registrationWindowEnabled)}
                  className={[
                    "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                    registrationWindowEnabled ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-slate-200",
                  ].join(" ")}
                  aria-pressed={registrationWindowEnabled}
                  aria-label={registrationWindowEnabled ? "Disable registration window" : "Enable registration window"}
                >
                  <span
                    className={[
                      "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                      registrationWindowEnabled ? "translate-x-7" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>

              <fieldset
                disabled={isSaving || !registrationWindowEnabled}
                className={[
                  "mt-4 flex flex-col gap-3 md:flex-row md:justify-start md:gap-4",
                  !registrationWindowEnabled ? "opacity-60" : "",
                ].join(" ")}
              >
                <label className="block w-full space-y-2 md:w-[15.5rem] lg:w-[17rem]">
                  <span className="block text-sm font-semibold text-slate-800">
                    {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.startLabel}
                  </span>
                  <DatePicker
                    selected={registrationStartDateUtc}
                    onChange={(value: Date | null) => setRegistrationStartDateUtc(value)}
                    showTimeSelect
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="MMM d, yyyy h:mm aa"
                    placeholderText="Select start date and time"
                    customInput={<DateTimeInput />}
                  />
                </label>

                <label className="block w-full space-y-2 md:w-[15.5rem] lg:w-[17rem]">
                  <span className="block text-sm font-semibold text-slate-800">
                    {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.endLabel}
                  </span>
                  <DatePicker
                    selected={registrationEndDateUtc}
                    onChange={(value: Date | null) => setRegistrationEndDateUtc(value)}
                    minDate={registrationStartDateUtc ?? undefined}
                    showTimeSelect
                    showMonthDropdown
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="MMM d, yyyy h:mm aa"
                    placeholderText="Select end date and time"
                    customInput={<DateTimeInput />}
                  />
                </label>
              </fieldset>
            </div>

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsTitle}
                  </p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openUpgradePathModal()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-900"
                  aria-label="Add upgrade path"
                  title="Add upgrade path"
                >
                  <PlusIcon />
                </button>
              </div>

              {upgradePathError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {upgradePathError}
                </div>
              ) : null}

              <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Configured paths</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Review or update the explicit upgrade mappings configured for this membership.
                      </p>
                    </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {upgradePaths.length}
                  </span>
                </div>

                {isUpgradePathLoading ? (
                  <div className="mt-4">
                    <MembershipUpgradePathSkeleton />
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-[920px] w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <th className="px-4 py-3">Target membership</th>
                          <th className="px-4 py-3">Charge rule</th>
                          <th className="px-4 py-3">Fixed amount</th>
                          <th className="px-4 py-3">Approval</th>
                          <th className="px-4 py-3">Active</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {upgradePaths.map((path) => (
                          <tr key={path.id} className="align-top">
                            <td className="px-4 py-4">
                              <p className="font-semibold text-slate-900">
                                {path.toMembershipTypeName || "Unnamed target"}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-slate-700">{getChargeRuleLabel(path.chargeRule)}</td>
                            <td className="px-4 py-4 text-slate-700">
                              {path.chargeRule === "FixedAmount" ? formatAmount(path.fixedUpgradeAmount) : "—"}
                            </td>
                            <td className="px-4 py-4 text-slate-700">
                              {path.requiresApproval ? "Yes" : "No"}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={[
                                  "inline-flex h-8 w-8 items-center justify-center rounded-full border",
                                  path.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-300",
                                ].join(" ")}
                                aria-label={path.isActive ? "Active" : "Inactive"}
                                title={path.isActive ? "Active" : "Inactive"}
                              >
                                {path.isActive ? <CheckIcon /> : <span className="text-sm leading-none">—</span>}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openUpgradePathModal(path.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
                                  aria-label={`Edit upgrade path to ${path.toMembershipTypeName || "target membership"}`}
                                  title="Edit"
                                >
                                  <PencilIcon />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestUpgradePathRemoval(path.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300 bg-white text-rose-700 transition hover:border-rose-400 hover:bg-rose-50"
                                  aria-label={`Remove upgrade path to ${path.toMembershipTypeName || "target membership"}`}
                                  title="Remove"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {isUpgradePathModalOpen && upgradePathDraft ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                  <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                          {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsTitle}
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                          {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsFormTitle}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {editingUpgradePathId
                            ? "Update the mapping and save it to the draft list."
                            : "Add a new draft mapping to the list."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeUpgradePathModal}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close upgrade path modal"
                      >
                        <span className="text-xl leading-none">×</span>
                      </button>
                    </div>

                    <div className="space-y-5 px-6 py-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                            <span>{MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsTargetLabel}</span>
                            <span className="text-rose-600" aria-label="Required" title="Required">
                              *
                            </span>
                          </span>
                          <select
                            value={upgradePathDraft.toMembershipTypeUniqueId}
                            onChange={(event) =>
                              updateUpgradePathDraft((current) => {
                                const selectedOption = membershipTypeOptions.find(
                                  (item) => item.value === event.target.value,
                                );
                                return {
                                  ...current,
                                  toMembershipTypeUniqueId: event.target.value,
                                  toMembershipTypeName: selectedOption?.text || "",
                                };
                              })
                            }
                            disabled={membershipTypeOptions.length === 0}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value="">Select membership type</option>
                            {membershipTypeOptions.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.text}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                            <span>{MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsChargeRuleLabel}</span>
                            <span className="text-rose-600" aria-label="Required" title="Required">
                              *
                            </span>
                          </span>
                          <select
                            value={upgradePathDraft.chargeRule}
                            onChange={(event) =>
                              updateUpgradePathDraft((current) => ({
                                ...current,
                                chargeRule: event.target.value as MembershipTypeUpgradePathDraft["chargeRule"],
                                fixedUpgradeAmount:
                                  event.target.value === "FixedAmount" ? current.fixedUpgradeAmount : "",
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                          >
                            <option value="FullPrice">Full price</option>
                            <option value="PriceDifference">Price difference</option>
                            <option value="FixedAmount">Fixed amount</option>
                            <option value="Free">Free</option>
                            <option value="ManualReview">Manual review</option>
                          </select>
                        </label>

                        <label className="block space-y-2">
                          <span className="block text-sm font-semibold text-slate-800">
                            {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsFixedAmountLabel}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={upgradePathDraft.fixedUpgradeAmount}
                            onChange={(event) =>
                              updateUpgradePathDraft((current) => ({
                                ...current,
                                fixedUpgradeAmount: event.target.value,
                              }))
                            }
                            disabled={upgradePathDraft.chargeRule !== "FixedAmount"}
                            placeholder="0.00"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsApprovalLabel}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateUpgradePathDraft((current) => ({
                                ...current,
                                requiresApproval: !current.requiresApproval,
                              }))
                            }
                            className={[
                              "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                              upgradePathDraft.requiresApproval
                                ? "border-cyan-500 bg-cyan-500"
                                : "border-slate-300 bg-slate-200",
                            ].join(" ")}
                            aria-pressed={upgradePathDraft.requiresApproval}
                            aria-label={
                              upgradePathDraft.requiresApproval
                                ? "Disable approval requirement for upgrade path"
                                : "Enable approval requirement for upgrade path"
                            }
                          >
                            <span
                              className={[
                                "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                                upgradePathDraft.requiresApproval ? "translate-x-7" : "translate-x-1",
                              ].join(" ")}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.upgradePathsActiveLabel}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateUpgradePathDraft((current) => ({
                                ...current,
                                isActive: !current.isActive,
                              }))
                            }
                            className={[
                              "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                              upgradePathDraft.isActive
                                ? "border-cyan-500 bg-cyan-500"
                                : "border-slate-300 bg-slate-200",
                            ].join(" ")}
                            aria-pressed={upgradePathDraft.isActive}
                            aria-label={upgradePathDraft.isActive ? "Disable upgrade path" : "Enable upgrade path"}
                          >
                            <span
                              className={[
                                "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                                upgradePathDraft.isActive ? "translate-x-7" : "translate-x-1",
                              ].join(" ")}
                            />
                          </button>
                        </div>
                      </div>

                      {upgradePathValidationError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {upgradePathValidationError}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                      <button
                        type="button"
                        onClick={() => submitUpgradePathDraft(false)}
                        className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
                      >
                        {editingUpgradePathId ? "Save & Close" : "Add & Close"}
                      </button>
                      <button
                        type="button"
                        onClick={() => submitUpgradePathDraft(true)}
                        className="rounded-full border border-cyan-200 bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                      >
                        {editingUpgradePathId ? "Save & Continue" : "Add & Continue"}
                      </button>
                      <button
                        type="button"
                        onClick={closeUpgradePathModal}
                        className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {pendingUpgradePathRemoval ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                  <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Remove upgrade path?</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      This will remove the draft mapping for{" "}
                      <span className="font-semibold">{pendingUpgradePathRemoval.label}</span>.
                    </p>
                    <div className="mt-6 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={cancelUpgradePathRemoval}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={confirmUpgradePathRemoval}
                        className="rounded-full border border-rose-200 bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {validationError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {validationError}
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
