import { forwardRef, type InputHTMLAttributes } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MEMBERSHIP_ADVANCE_SETTINGS_CONTENT } from "./MembershipAdvanceSettingsStepPage.fields";
import { useMembershipAdvanceSettingsStep } from "./MembershipAdvanceSettingsStepPage.hook";

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
    reload,
    setRegistrationWindowEnabled,
    setRegistrationStartDateUtc,
    setRegistrationEndDateUtc,
    setRequiresApproval,
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
            <div className="inline-flex w-full flex-col items-stretch gap-4 md:w-fit">
              <div className="w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Registration Window
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRegistrationWindowEnabled(!registrationWindowEnabled)}
                  className={[
                    "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                    registrationWindowEnabled
                      ? "border-cyan-500 bg-cyan-500"
                      : "border-slate-300 bg-slate-200",
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
                <label className="block w-full space-y-2 md:w-[18rem] lg:w-[20rem]">
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

                <label className="block w-full space-y-2 md:w-[18rem] lg:w-[20rem]">
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

              <div className="w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                  {MEMBERSHIP_ADVANCE_SETTINGS_CONTENT.approvalLabel}
                </p>
                <button
                  type="button"
                  onClick={() => setRequiresApproval(!requiresApproval)}
                  className={[
                    "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                    requiresApproval
                      ? "border-cyan-500 bg-cyan-500"
                      : "border-slate-300 bg-slate-200",
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
            </div>

            {validationError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {validationError}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
