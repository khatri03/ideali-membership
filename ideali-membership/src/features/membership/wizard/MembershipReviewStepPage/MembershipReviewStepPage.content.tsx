import type { ReactNode } from "react";
import type { MembershipReviewInfo } from "../../../../types/membership";
import {
  CheckPill,
  NoPill,
  ReviewGridRow,
  ReviewLiveStatusConfirmModal,
  SummaryCard,
  ToggleSwitch,
} from "./MembershipReviewStepPage.parts";

export function MembershipReviewContent({
  reviewInfo,
  availableForSignUp,
  isLoading,
  error,
  isSaving,
  isConfirmOpen,
  onToggleAvailableForSignUp,
  onRetry,
  onCancelConfirm,
  onConfirmSave,
}: {
  reviewInfo: MembershipReviewInfo | null;
  availableForSignUp: boolean;
  isLoading: boolean;
  error: string;
  isSaving: boolean;
  isConfirmOpen: boolean;
  onToggleAvailableForSignUp: () => void;
  onRetry: () => void;
  onCancelConfirm: () => void;
  onConfirmSave: () => void;
}) {
  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-400/50 text-[10px] font-bold">
              !
            </div>
            <div className="space-y-2">
              <p>{error}</p>
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
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Review
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Review Membership Setup</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Review the configuration before saving and exiting.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div>
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="grid grid-cols-1 border-b border-slate-200 last:border-b-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
                  <div className="bg-slate-50 px-5 py-3 lg:px-5 lg:py-4">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="px-5 pb-4 pt-2 lg:px-5 lg:py-4">
                    <div className="h-5 w-[min(22rem,92%)] animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : reviewInfo ? (
          <SummaryCard title="Review Membership Setup">
            <div className="w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <div>
                <ReviewGridRow label="Are we live?">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            reviewInfo.setupState === "Published"
                              ? "bg-emerald-50 text-emerald-700"
                              : reviewInfo.setupState === "Ready For Review" || reviewInfo.setupState === "ReadyForReview"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {reviewInfo.setupState}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Toggle the membership live state.</p>
                    </div>
                    <ToggleSwitch
                      checked={availableForSignUp}
                      onChange={onToggleAvailableForSignUp}
                      disabled={isSaving}
                      focusTarget
                    />
                  </div>
                </ReviewGridRow>

                <ReviewGridRow label="Membership Title">
                  <div className="text-sm text-slate-900">{reviewInfo.name}</div>
                </ReviewGridRow>

                <ReviewGridRow label="Color">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-8 w-8 shrink-0 rounded-full border border-slate-200 shadow-sm"
                      style={{ backgroundColor: reviewInfo.color || "#e2e8f0" }}
                      aria-hidden="true"
                    />
                    {reviewInfo.color ? null : <span className="text-sm font-medium text-slate-600">No</span>}
                  </div>
                </ReviewGridRow>

                <ReviewGridRow label="Payment Account">
                  {reviewInfo.paymentAccount ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{reviewInfo.paymentAccount.name}</span>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {reviewInfo.paymentAccount.merchant || "No merchant"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {reviewInfo.paymentAccount.currency || "No currency"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-slate-500">No</span>
                  )}
                </ReviewGridRow>

                <ReviewGridRow label="Pricing">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-900">
                    <span className="font-semibold">Free</span>
                  </div>
                </ReviewGridRow>

                <ReviewGridRow label="Discount Coupons">
                  {reviewInfo.discountsEnabled ? <CheckPill /> : <NoPill />}
                </ReviewGridRow>

                <ReviewGridRow label="Questions">
                  {reviewInfo.hasQuestions ? <CheckPill /> : <NoPill />}
                </ReviewGridRow>

                <ReviewGridRow label="Requires Approval">
                  {reviewInfo.requiresApproval ? <CheckPill /> : <NoPill />}
                </ReviewGridRow>

                <ReviewGridRow label="Registration Window">
                  {reviewInfo.registrationStartDateUtc || reviewInfo.registrationEndDateUtc ? <CheckPill /> : <NoPill />}
                </ReviewGridRow>

                {reviewInfo.donationCampaignUniqueId && reviewInfo.donationCampaignName ? (
                  <ReviewGridRow label="Donation Campaign">
                    <span className="text-sm font-semibold text-slate-900">{reviewInfo.donationCampaignName}</span>
                  </ReviewGridRow>
                ) : null}
              </div>
            </div>
          </SummaryCard>
        ) : null}
      </div>

      {isConfirmOpen ? (
        <ReviewLiveStatusConfirmModal
          isLive={availableForSignUp}
          onCancel={onCancelConfirm}
          onConfirm={onConfirmSave}
        />
      ) : null}

      {isSaving ? <p className="mt-4 text-sm font-medium text-cyan-700">Saving review...</p> : null}
    </section>
  );
}
