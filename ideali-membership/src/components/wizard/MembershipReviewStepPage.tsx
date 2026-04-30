import { useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipReviewInfo,
  saveMembershipReviewStep,
} from "../../lib/membershipWizard";
import type { MembershipReviewInfo } from "../../types/membership";
import { defaultWizardFooterActions, useWizardFooterActions } from "./WizardFooterActionsContext";
import { MEMBERSHIP_REVIEW_CONTENT, MEMBERSHIP_REVIEW_STEP_NUMBER } from "./MembershipReviewStepPage.fields";

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
    </svg>
  );
}

function CircleCheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M10 1.75a8.25 8.25 0 1 0 8.25 8.25A8.26 8.26 0 0 0 10 1.75Zm3.68 6.62-4.18 4.75a.9.9 0 0 1-.67.3.87.87 0 0 1-.63-.26L6.3 10.58l1.3-1.3 1.17 1.17 3.57-4.06Z" />
    </svg>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={[
        "relative inline-flex h-8 w-14 items-center rounded-full border transition",
        checked ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-slate-200",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-7" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function ReviewLoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm lg:w-1/2">
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
  );
}

function ReviewError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TableSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function CheckPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CheckIcon className="h-4 w-4" />
      </span>
      Yes
    </span>
  );
}

function NoPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-white">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="currentColor">
          <path d="M5.7 4.3 4.3 5.7 8.6 10l-4.3 4.3 1.4 1.4L10 11.4l4.3 4.3 1.4-1.4-4.3-4.3 4.3-4.3-1.4-1.4-4.3 4.3z" />
        </svg>
      </span>
      No
    </span>
  );
}

function StatusRow({
  label,
  enabled,
  noLabel = "No",
}: {
  label: string;
  enabled: boolean;
  noLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
      </div>
      {enabled ? <CheckPill /> : <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">{noLabel}</span>}
    </div>
  );
}

function formatCurrencyAmount(amount: number, isFree: boolean, currencyCode?: string | null) {
  if (isFree || amount === 0) {
    return "Free";
  }

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrencySymbol(currencyCode?: string | null) {
  switch (currencyCode?.trim().toUpperCase()) {
    case "USD":
      return "$";
    case "CAD":
      return "C$";
    default:
      return "";
  }
}

function formatTenureLabel(review: MembershipReviewInfo) {
  const tenureMap: Record<number, string> = {
    1: "Monthly",
    2: "Annual",
    3: "Lifetime",
    4: "Custom",
  };

  return review.tenure ? tenureMap[review.tenure] ?? "No" : "No";
}

function formatTenureSelectionLabel(review: MembershipReviewInfo) {
  if (review.tenure === 2) {
    return "Every Year";
  }

  return null;
}

function formatSetupStateLabel(setupState: string) {
  const normalized = setupState.trim();
  if (!normalized) {
    return "Draft";
  }

  return normalized
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function formatRenewalDueLabel(review: MembershipReviewInfo) {
  if (review.tenure === 2 && review.annualExpiryMonth && review.annualExpiryDay) {
    const date = new Date(Date.UTC(2000, review.annualExpiryMonth - 1, review.annualExpiryDay));
    return `Renewal due on ${new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }).format(date)}`;
  }

  if (review.tenure === 4 && review.customExpiryDays) {
    return `${review.customExpiryDays} Days`;
  }

  return null;
}

function ReviewField({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">{label}</p>
      <p className="mt-3 text-base font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function ReviewColorCard({ color }: { color: string | null }) {
  return (
    <SummaryCard title="Color">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 shadow-sm"
          style={{ backgroundColor: color || "#e2e8f0" }}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-slate-800">Selected Color</p>
          <p className="text-xs text-slate-500">{color || "No"}</p>
        </div>
      </div>
    </SummaryCard>
  );
}

function ReviewPaymentAccountCard({ reviewInfo }: { reviewInfo: MembershipReviewInfo }) {
  return (
    <SummaryCard title="Payment Account">
      {reviewInfo.paymentAccount ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-lg font-semibold tracking-tight text-slate-900">{reviewInfo.paymentAccount.name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              {reviewInfo.paymentAccount.merchant || "No merchant"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {reviewInfo.paymentAccount.currency || "No currency"}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
          No
        </div>
      )}
    </SummaryCard>
  );
}

function ReviewPricingCard({ reviewInfo }: { reviewInfo: MembershipReviewInfo }) {
  return (
    <SummaryCard title="Pricing">
      <ReviewField
        label="Amount | Renewal Due"
        value={`${formatCurrencySymbol(reviewInfo.paymentAccount?.currency)}${formatCurrencyAmount(
          reviewInfo.membershipCharges,
          reviewInfo.isFree,
        )} | ${formatTenureLabel(reviewInfo)}${formatRenewalDueLabel(reviewInfo) ? ` | ${formatRenewalDueLabel(reviewInfo)}` : ""}`}
        helper="Free when the amount is 0"
      />
    </SummaryCard>
  );
}

function ReviewOptionCard({
  title,
  enabled,
}: {
  title: string;
  enabled: boolean;
}) {
  return (
    <SummaryCard title={title}>
      <StatusRow label={title} enabled={enabled} />
    </SummaryCard>
  );
}

function ReviewAccessCard({
  availableForSignUp,
  onToggle,
  disabled,
}: {
  availableForSignUp: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <SummaryCard title="Are we live?">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Available for subscription</p>
          <p className="text-xs text-slate-500">Toggle the membership live state.</p>
        </div>
        <ToggleSwitch checked={availableForSignUp} onChange={onToggle} disabled={disabled} />
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        {availableForSignUp ? (
          <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
            <CircleCheckIcon />
            Live for subscription
          </span>
        ) : null}
      </div>
    </SummaryCard>
  );
}

function ReviewTableValue({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function ReviewGridRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 border-b border-slate-200 last:border-b-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 lg:px-5 lg:py-4">{label}</div>
      <div className="px-5 pb-4 pt-2 lg:px-5 lg:py-4">{children}</div>
    </div>
  );
}

function ReviewLiveStatusConfirmModal({
  isLive,
  onCancel,
  onConfirm,
}: {
  isLive: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Review membership</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Confirm live status</h3>
        </div>

        <div className="space-y-3 px-6 py-5">
          <p className="text-sm leading-6 text-slate-600">
            You are about to save the review and {isLive ? "publish this membership for signup." : "keep this membership in review."}
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Publish state</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {isLive ? "Published" : "Ready For Review"}
            </p>
          </div>
          <p className="text-sm leading-6 text-slate-600">Please confirm this before saving the membership review.</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-cyan-200 bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Save &amp; Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export function MembershipReviewStepPage() {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [reviewInfo, setReviewInfo] = useState<MembershipReviewInfo | null>(null);
  const [availableForSignUp, setAvailableForSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function saveReviewAndExit() {
    if (!currentMembershipTypeUniqueId) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await saveMembershipReviewStep(
        { availableForSignUp },
        MEMBERSHIP_REVIEW_STEP_NUMBER,
        currentMembershipTypeUniqueId,
      );
      navigate(APP_ROUTES.membershipTypes, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save review settings.");
    } finally {
      setIsSaving(false);
      setIsConfirmOpen(false);
    }
  }

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadReviewInfo() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipReviewInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setReviewInfo(info);
        setAvailableForSignUp(info.availableForSignUp);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setReviewInfo(null);
        setAvailableForSignUp(false);
        setError(loadError instanceof Error ? loadError.message : "Unable to load review data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadReviewInfo();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useLayoutEffect(() => {
    setFooterActions({
      ...defaultWizardFooterActions,
      showBack: true,
      showSkip: false,
      showSaveNext: false,
      showSaveExit: true,
      saveExitLabel: "Save & Exit",
      isSaving,
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardAdvanceSettings,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_REVIEW_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSaveExit: () => {
        setError("");
        setIsConfirmOpen(true);
      },
    });
  }, [availableForSignUp, currentMembershipTypeUniqueId, isSaving, setFooterActions]);

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <ReviewError
          message={error}
          onRetry={() => {
            if (currentMembershipTypeUniqueId) {
              setReloadTick((current) => current + 1);
            }
          }}
        />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
          {MEMBERSHIP_REVIEW_CONTENT.reviewLabel}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_REVIEW_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_REVIEW_CONTENT.description}</p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <ReviewLoadingSkeleton />
        ) : reviewInfo ? (
          <SummaryCard title="Review Membership Setup">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm lg:w-1/2">
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
                              : reviewInfo.setupState === "Ready For Review"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {formatSetupStateLabel(reviewInfo.setupState)}
                        </span>
                        {reviewInfo.publishedAtUtc ? (
                          <span className="text-xs font-medium text-slate-500">
                            Published at {new Intl.DateTimeFormat(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            }).format(new Date(reviewInfo.publishedAtUtc))}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">Toggle the membership live state.</p>
                    </div>
                    <ToggleSwitch
                      checked={availableForSignUp}
                      onChange={() => setAvailableForSignUp((current) => !current)}
                      disabled={isSaving}
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
                      <span className="text-sm font-semibold text-slate-900">
                        {reviewInfo.paymentAccount.name}
                      </span>
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
                  {(() => {
                    const hasCustomPricing = reviewInfo.customExpiryDays !== null || reviewInfo.tenure === 4;
                    const hasAnnualPricing = reviewInfo.tenure === 2 && !hasCustomPricing;
                    const pricingLabel = hasCustomPricing ? "Custom" : formatTenureLabel(reviewInfo);
                    const pricingRenewalLabel = hasAnnualPricing
                      ? formatRenewalDueLabel(reviewInfo)
                      : hasCustomPricing && reviewInfo.customExpiryDays !== null
                        ? `${reviewInfo.customExpiryDays} Days`
                        : null;

                    return (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-900">
                        <span className="font-semibold">
                          {formatCurrencySymbol(reviewInfo.paymentAccount?.currency)}
                          {formatCurrencyAmount(
                            reviewInfo.membershipCharges,
                            reviewInfo.isFree,
                          )}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold">{pricingLabel}</span>
                        {hasAnnualPricing ? (
                          <>
                            <span className="text-slate-300">|</span>
                            <span>Every Year</span>
                          </>
                        ) : null}
                        {pricingRenewalLabel ? (
                          <>
                            <span className="text-slate-300">|</span>
                            <span
                              className={[
                                "rounded-full px-3 py-1 font-semibold",
                                hasAnnualPricing
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-cyan-50 text-cyan-700",
                              ].join(" ")}
                            >
                              {pricingRenewalLabel}
                            </span>
                          </>
                        ) : null}
                      </div>
                    );
                  })()}
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
              </div>
            </div>
          </SummaryCard>
        ) : null}
      </div>

      {isConfirmOpen ? (
        <ReviewLiveStatusConfirmModal
          isLive={availableForSignUp}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => void saveReviewAndExit()}
        />
      ) : null}

      {isSaving ? <p className="mt-4 text-sm font-medium text-cyan-700">Saving review...</p> : null}
    </section>
  );
}
