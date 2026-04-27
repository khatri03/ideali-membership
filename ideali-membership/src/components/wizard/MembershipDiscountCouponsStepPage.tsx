import { useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
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

      <div className="mt-8 rounded-3xl border border-dashed border-cyan-200 bg-cyan-50/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Coming next</p>
        <p className="mt-3 text-base leading-7 text-slate-700">
          {MEMBERSHIP_DISCOUNT_COUPONS_CONTENT.helper}
        </p>
      </div>
    </section>
  );
}
