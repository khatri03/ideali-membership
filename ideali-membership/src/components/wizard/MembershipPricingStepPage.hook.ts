import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipPricingInfo,
  invalidateMembershipWizardPricingCache,
  saveMembershipPricingStep,
} from "../../lib/membershipWizard";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import {
  MEMBERSHIP_PRICING_NEXT_STEP_NUMBER,
  MEMBERSHIP_PRICING_STEP_NUMBER,
} from "./MembershipPricingStepPage.fields";
import { getMembershipPricingError, normalizeMembershipPricing } from "./MembershipPricingStepPage.schema";
import type { MembershipPricingStepState } from "./MembershipPricingStepPage.types";

async function persistMembershipPricingStepWithFeedback({
  pricing,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  pricing: number | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  const nextError = getMembershipPricingError(pricing);
  if (nextError) {
    setError(nextError);
    return;
  }

  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipPricingStep(normalizeMembershipPricing(pricing), stepNumber, membershipTypeUniqueId);
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save pricing.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipPricingStep(): MembershipPricingStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [selectedPricing, setSelectedPricing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMembershipPricing() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipPricingInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setSelectedPricing(info.pricing);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSelectedPricing(null);
        setError(loadError instanceof Error ? loadError.message : "Unable to load pricing.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipPricing();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useLayoutEffect(() => {
    setFooterActions({
      showBack: true,
      showSkip: false,
      showSaveNext: true,
      showSaveExit: true,
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onSaveNext: () =>
        void persistMembershipPricingStepWithFeedback({
          pricing: selectedPricing,
          stepNumber: MEMBERSHIP_PRICING_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardCustomForms,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_PRICING_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipPricingStepWithFeedback({
          pricing: selectedPricing,
          stepNumber: MEMBERSHIP_PRICING_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, isSaving, navigate, selectedPricing, setFooterActions]);

  return {
    selectedPricing,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardPricingCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    selectPricing: (value: number) => setSelectedPricing(value),
  };
}
