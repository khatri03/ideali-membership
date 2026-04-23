import {
  MEMBERSHIP_TENURE_CONTENT,
  MEMBERSHIP_TENURE_OPTIONS,
} from "./MembershipTenureStepPage.fields";
import { useMembershipTenureStep } from "./MembershipTenureStepPage.hook";

function MembershipTenureSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1.75rem] border border-slate-200 bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

function MembershipTenureError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function MembershipTenureStepPage() {
  const { selectedTenure, error, isLoading, isSaving, reload, selectTenure } = useMembershipTenureStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipTenureError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700">
        <span className="h-2 w-2 rounded-full bg-cyan-500" />
        Membership wizard step
      </div>

      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_TENURE_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_TENURE_CONTENT.description}</p>
      </div>

      <div className="mt-8 max-w-5xl space-y-4">
        {isLoading ? (
          <MembershipTenureSkeleton />
        ) : (
          <>
            <p className="text-sm text-slate-600">{MEMBERSHIP_TENURE_CONTENT.helper}</p>

            <fieldset disabled={isSaving} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {MEMBERSHIP_TENURE_OPTIONS.map((option) => {
                  const isSelected = selectedTenure === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectTenure(option.value)}
                      className={[
                        "group rounded-[1.75rem] border p-5 text-left transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
                        isSelected
                          ? "border-cyan-300 bg-cyan-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/60",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-slate-900">{option.label}</p>
                          <p className="text-sm leading-6 text-slate-600">{option.description}</p>
                        </div>

                        <span
                          className={[
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition",
                            isSelected
                              ? "border-cyan-500 bg-cyan-500 text-white"
                              : "border-slate-200 bg-white text-transparent group-hover:border-cyan-300",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}
      </div>
    </section>
  );
}
