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
import {
  getMembershipPricingError,
  normalizeMembershipPricing,
  normalizeMembershipPricingDay,
  normalizeMembershipPricingMonth,
} from "./MembershipPricingStepPage.schema";
import type { MembershipPricingStepState } from "./MembershipPricingStepPage.types";

async function persistMembershipPricingStepWithFeedback({
  pricing,
  customExpiryMonth,
  customExpiryDay,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  pricing: number | null;
  customExpiryMonth: number | null;
  customExpiryDay: number | null;
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

  const normalizedPricing = normalizeMembershipPricing(pricing);
  const normalizedMonth = normalizeMembershipPricingMonth(customExpiryMonth);
  const normalizedDay = normalizeMembershipPricingDay(customExpiryDay, normalizedMonth);

  if (normalizedPricing === 2) {
    if (!normalizedMonth) {
      setError("Please select a month for the annual pricing option.");
      return;
    }

    if (!normalizedDay) {
      setError("Please select a date for the annual pricing option.");
      return;
    }
  }

  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipPricingStep(
      normalizedPricing,
      normalizedPricing === 2 ? normalizedMonth : null,
      normalizedPricing === 2 ? normalizedDay : null,
      stepNumber,
      membershipTypeUniqueId,
    );
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
  const [selectedCustomExpiryMonth, setSelectedCustomExpiryMonth] = useState<number | null>(null);
  const [selectedCustomExpiryDay, setSelectedCustomExpiryDay] = useState<number | null>(null);
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
        setSelectedCustomExpiryMonth(info.pricing === 2 ? info.customExpiryMonth : null);
        setSelectedCustomExpiryDay(info.pricing === 2 ? info.customExpiryDay : null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSelectedPricing(null);
        setSelectedCustomExpiryMonth(null);
        setSelectedCustomExpiryDay(null);
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
          customExpiryMonth: selectedCustomExpiryMonth,
          customExpiryDay: selectedCustomExpiryDay,
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
          customExpiryMonth: selectedCustomExpiryMonth,
          customExpiryDay: selectedCustomExpiryDay,
          stepNumber: MEMBERSHIP_PRICING_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [
    currentMembershipTypeUniqueId,
    isSaving,
    navigate,
    selectedCustomExpiryDay,
    selectedCustomExpiryMonth,
    selectedPricing,
    setFooterActions,
  ]);

  return {
    selectedPricing,
    selectedCustomExpiryMonth,
    selectedCustomExpiryDay,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardPricingCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    selectPricing: (value: number) => {
      setSelectedPricing(value);
      if (value !== 2) {
        setSelectedCustomExpiryMonth(null);
        setSelectedCustomExpiryDay(null);
      }
    },
    selectCustomExpiryMonth: (value: number | null) => {
      setSelectedCustomExpiryMonth(value);
      setSelectedCustomExpiryDay(null);
    },
    selectCustomExpiryDay: (value: number | null) => setSelectedCustomExpiryDay(value),
  };
}
