import { MEMBERSHIP_BANNER_CONTENT } from "./MembershipBannerStepPage.fields";

function MembershipBannerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="h-[18rem] rounded-[1.75rem] border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="h-[18rem] rounded-[1.75rem] border border-slate-200 bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

export function MembershipBannerError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function MembershipBannerStepPageContent({
  bannerUrl,
  isLoading,
}: {
  bannerUrl: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="mt-8 max-w-5xl space-y-4">
      {isLoading ? (
        <MembershipBannerSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6" tabIndex={-1} data-wizard-focus="true">
            <p className="text-sm font-semibold tracking-[0.15em] text-cyan-700 uppercase">Optional step</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{MEMBERSHIP_BANNER_CONTENT.emptyStateTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {MEMBERSHIP_BANNER_CONTENT.emptyStateDescription}
            </p>
            <p className="mt-5 text-sm text-slate-500">{MEMBERSHIP_BANNER_CONTENT.helper}</p>
          </div>

          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold tracking-[0.15em] text-slate-500 uppercase">
              {MEMBERSHIP_BANNER_CONTENT.currentBannerLabel}
            </p>
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              {bannerUrl ? (
                <div className="space-y-3">
                  <div className="h-36 rounded-[1rem] bg-gradient-to-br from-cyan-100 via-white to-slate-100 ring-1 ring-slate-200" />
                  <p className="break-all text-sm text-slate-700">{bannerUrl}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid h-36 place-items-center rounded-[1rem] border border-dashed border-slate-200 bg-white text-slate-400">
                    <span className="text-sm font-medium">No banner uploaded</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-500">
                    Use Skip for now to continue to Pricing, or save and exit to return later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
