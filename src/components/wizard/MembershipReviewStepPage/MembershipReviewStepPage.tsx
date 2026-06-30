import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipReviewInfo,
  saveMembershipReviewStep,
} from "../../../lib/membershipWizard";
import type { MembershipReviewInfo } from "../../../types/membership";
import { defaultWizardFooterActions, useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import { MEMBERSHIP_REVIEW_CONTENT, MEMBERSHIP_REVIEW_STEP_NUMBER } from "./MembershipReviewStepPage.fields";
import {
  formatCurrencyAmount,
  formatCurrencySymbol,
  formatSetupStateLabel,
} from "./MembershipReviewStepPage.helpers";
import {
  CheckPill,
  NoPill,
  ReviewError,
  ReviewGridRow,
  ReviewLiveStatusConfirmModal,
  ReviewLoadingSkeleton,
  SummaryCard,
  ToggleSwitch,
  formatTenureExpiryCaseLabel,
} from "./MembershipReviewStepPage.parts";

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

  useEffect(() => {
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
                          {formatSetupStateLabel(reviewInfo.setupState)}
                        </span>
                        {reviewInfo.setupState === "Published" && reviewInfo.publishedAtUtc ? (
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
                    const pricingLabel = formatTenureExpiryCaseLabel(reviewInfo);

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
