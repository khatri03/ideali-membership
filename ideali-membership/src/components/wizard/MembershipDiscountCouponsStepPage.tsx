import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipTypeDiscountsEnabled,
  updateMembershipTypeDiscountsEnabled,
} from "../../lib/membershipWizard";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import {
  MEMBERSHIP_DISCOUNT_COUPONS_CONTENT,
  MEMBERSHIP_DISCOUNT_COUPONS_NEXT_STEP_NUMBER,
  MEMBERSHIP_DISCOUNT_COUPONS_STEP_NUMBER,
} from "./MembershipDiscountCouponsStepPage.fields";

export function MembershipDiscountCouponsStepPage() {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [discountsEnabled, setDiscountsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadDiscountsState() {
      setIsLoading(true);
      setError("");

      try {
        const enabled = await getMembershipTypeDiscountsEnabled(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setDiscountsEnabled(enabled);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load discount state.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDiscountsState();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId]);

  async function handleToggleDiscounts() {
    if (!currentMembershipTypeUniqueId || isLoading || isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const nextValue = !discountsEnabled;
      await updateMembershipTypeDiscountsEnabled(currentMembershipTypeUniqueId, nextValue);
      setDiscountsEnabled(nextValue);
    } finally {
      setIsUpdating(false);
    }
  }

  useLayoutEffect(() => {
    setFooterActions({
      showBack: true,
      showSkip: false,
      showSaveNext: true,
      showSaveExit: true,
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving: false,
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardPricing,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_DISCOUNT_COUPONS_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSaveNext: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardQuestions,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_DISCOUNT_COUPONS_NEXT_STEP_NUMBER,
          ),
          { replace: true },
        ),
      onSaveExit: () => navigate(APP_ROUTES.membershipTypes, { replace: true }),
    });
  }, [currentMembershipTypeUniqueId, navigate, setFooterActions]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {MEMBERSHIP_DISCOUNT_COUPONS_CONTENT.title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {MEMBERSHIP_DISCOUNT_COUPONS_CONTENT.description}
        </p>
      </div>

      <div className="mt-8 max-w-3xl rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-slate-800">Discount coupons</span>
            <p className="text-xs text-slate-500">Make membership discounts available for this plan.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={discountsEnabled}
              aria-label="Toggle membership discounts"
              onClick={() => void handleToggleDiscounts()}
              disabled={isLoading || isUpdating}
              className={[
                "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                discountsEnabled
                  ? "border-cyan-500 bg-cyan-500"
                  : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
                  discountsEnabled ? "translate-x-7" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
