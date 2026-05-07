function MembershipTitleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export function MembershipTitleError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function MembershipTitleStepPageContent({
  error,
  isLoading,
  title,
  onChangeTitle,
}: {
  error: string;
  isLoading: boolean;
  title: string;
  onChangeTitle: (value: string) => void;
}) {
  return (
    <div className="mt-8 max-w-2xl space-y-3">
      {isLoading ? (
        <MembershipTitleSkeleton />
      ) : (
        <>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              Membership Title
              <span className="text-rose-600" aria-label="Required" title="Required">
                *
              </span>
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => onChangeTitle(event.target.value)}
              placeholder="Enter membership title"
              data-wizard-focus="true"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "membership-title-error" : undefined}
            />
          </label>

          <p className="text-xs text-slate-500">3-80 characters.</p>

          {error ? (
            <p id="membership-title-error" className="text-sm font-medium text-rose-600">
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
