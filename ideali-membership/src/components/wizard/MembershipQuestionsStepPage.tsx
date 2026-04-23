import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import { useMembershipQuestionsStep } from "./MembershipQuestionsStepPage.hook";

function MembershipQuestionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function MembershipQuestionsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <div className="space-y-2">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function MembershipQuestionsEmpty() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
      <p className="text-base font-semibold text-slate-900">{MEMBERSHIP_QUESTIONS_CONTENT.emptyStateTitle}</p>
      <p className="mt-2 leading-6">{MEMBERSHIP_QUESTIONS_CONTENT.emptyStateDescription}</p>
    </div>
  );
}

export function MembershipQuestionsStepPage() {
  const {
    customForms,
    selectedCustomFormUniqueId,
    error,
    isLoading,
    isSaving,
    reload,
    selectCustomForm,
  } = useMembershipQuestionsStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipQuestionsError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_QUESTIONS_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {MEMBERSHIP_QUESTIONS_CONTENT.description}
        </p>
        <p className="text-sm text-slate-500">{MEMBERSHIP_QUESTIONS_CONTENT.helper}</p>
      </div>

      <div className="mt-8 max-w-3xl space-y-4">
        {isLoading ? (
          <MembershipQuestionsSkeleton />
        ) : (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Custom Form</span>
              <select
                value={selectedCustomFormUniqueId}
                onChange={(event) => selectCustomForm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">No custom form selected</option>
                {customForms.map((form) => (
                  <option key={form.value} value={form.value}>
                    {form.text}
                  </option>
                ))}
              </select>
            </label>

            {customForms.length === 0 ? <MembershipQuestionsEmpty /> : null}

            {selectedCustomFormUniqueId ? (
              <div className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                Custom form selected. Use Skip if you want to continue without attaching one.
              </div>
            ) : null}

            {isSaving ? <p className="text-sm font-medium text-cyan-700">Saving questions...</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
