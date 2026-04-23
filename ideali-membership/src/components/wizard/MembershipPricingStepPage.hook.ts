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
  normalizeMembershipPricingDays,
  normalizeMembershipPricing,
  normalizeMembershipPricingDay,
  normalizeMembershipPricingMonth,
  formatMembershipPricingAmount,
  parseMembershipPricingAmount,
  sanitizeMembershipPricingAmountInput,
} from "./MembershipPricingStepPage.schema";
import type { MembershipPricingStepState } from "./MembershipPricingStepPage.types";

async function persistMembershipPricingStepWithFeedback({
  pricing,
  membershipCharges,
  annualExpiryMode,
  annualExpiryMonth,
  annualExpiryDay,
  customExpiryDays,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  pricing: number | null;
  membershipCharges: string;
  annualExpiryMode: "renewal" | "custom";
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
  customExpiryDays: number | null;
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
  const normalizedCharges = parseMembershipPricingAmount(membershipCharges);
  const normalizedMonth = normalizeMembershipPricingMonth(annualExpiryMonth);
  const normalizedDay = normalizeMembershipPricingDay(annualExpiryDay, normalizedMonth);
  const normalizedDays = normalizeMembershipPricingDays(customExpiryDays);

  if (!normalizedCharges) {
    setError("Please enter a valid membership price greater than 0.");
    return;
  }

  if (normalizedPricing === 2) {
    if (annualExpiryMode === "custom" && (!normalizedMonth || !normalizedDay)) {
      setError("Please select both month and date for annual custom expiry.");
      return;
    }

    if ((normalizedMonth && !normalizedDay) || (!normalizedMonth && normalizedDay)) {
      setError("Please select both month and date for annual custom expiry.");
      return;
    }
  }

  if (normalizedPricing === 4 && !normalizedDays) {
    setError("Please enter a number greater than 0 for the custom pricing option.");
    return;
  }

  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipPricingStep(
      normalizedPricing,
      normalizedCharges,
      normalizedPricing === 2 && annualExpiryMode === "custom" ? normalizedMonth : null,
      normalizedPricing === 2 && annualExpiryMode === "custom" ? normalizedDay : null,
      normalizedPricing === 4 ? normalizedDays : null,
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
  const [selectedMembershipCharges, setSelectedMembershipCharges] = useState("");
  const [selectedAnnualExpiryMode, setSelectedAnnualExpiryMode] = useState<"renewal" | "custom">("renewal");
  const [selectedCustomExpiryMonth, setSelectedCustomExpiryMonth] = useState<number | null>(null);
  const [selectedCustomExpiryDay, setSelectedCustomExpiryDay] = useState<number | null>(null);
  const [selectedCustomExpiryDays, setSelectedCustomExpiryDays] = useState<number | null>(null);
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
        setSelectedMembershipCharges(formatMembershipPricingAmount(info.membershipCharges));
        const hasAnnualCustomExpiry = info.pricing === 2 && (info.annualExpiryMonth ?? info.annualExpiryDay);
        setSelectedAnnualExpiryMode(hasAnnualCustomExpiry ? "custom" : "renewal");
        setSelectedCustomExpiryMonth(info.pricing === 2 ? info.annualExpiryMonth : null);
        setSelectedCustomExpiryDay(info.pricing === 2 ? info.annualExpiryDay : null);
        setSelectedCustomExpiryDays(info.pricing === 4 ? info.customExpiryDays ?? 14 : null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSelectedPricing(null);
        setSelectedMembershipCharges("");
        setSelectedAnnualExpiryMode("renewal");
        setSelectedCustomExpiryMonth(null);
        setSelectedCustomExpiryDay(null);
        setSelectedCustomExpiryDays(null);
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
          membershipCharges: selectedMembershipCharges,
          annualExpiryMode: selectedAnnualExpiryMode,
          annualExpiryMonth: selectedAnnualExpiryMode === "custom" ? selectedCustomExpiryMonth : null,
          annualExpiryDay: selectedAnnualExpiryMode === "custom" ? selectedCustomExpiryDay : null,
          customExpiryDays: selectedCustomExpiryDays,
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
          membershipCharges: selectedMembershipCharges,
          annualExpiryMode: selectedAnnualExpiryMode,
          annualExpiryMonth: selectedAnnualExpiryMode === "custom" ? selectedCustomExpiryMonth : null,
          annualExpiryDay: selectedAnnualExpiryMode === "custom" ? selectedCustomExpiryDay : null,
          customExpiryDays: selectedCustomExpiryDays,
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
    selectedMembershipCharges,
    selectedAnnualExpiryMode,
    selectedCustomExpiryDay,
    selectedCustomExpiryMonth,
    selectedCustomExpiryDays,
    selectedPricing,
    setFooterActions,
  ]);

  return {
    selectedPricing,
    selectedMembershipCharges,
    selectedAnnualExpiryMode,
    selectedCustomExpiryMonth,
    selectedCustomExpiryDay,
    selectedCustomExpiryDays,
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
      if (value === 2) {
        setSelectedAnnualExpiryMode("renewal");
      }
      if (value !== 2) {
        setSelectedCustomExpiryMonth(null);
        setSelectedCustomExpiryDay(null);
      }
      if (value !== 4) {
        setSelectedCustomExpiryDays(null);
      } else {
        setSelectedCustomExpiryDays(14);
      }
    },
    selectMembershipCharges: (value: string) => setSelectedMembershipCharges(sanitizeMembershipPricingAmountInput(value)),
    selectAnnualExpiryMode: (value: "renewal" | "custom") => setSelectedAnnualExpiryMode(value),
    selectCustomExpiryMonth: (value: number | null) => {
      setSelectedCustomExpiryMonth(value);
      setSelectedCustomExpiryDay(null);
    },
    selectCustomExpiryDay: (value: number | null) => setSelectedCustomExpiryDay(value),
    selectCustomExpiryDays: (value: number | null) => setSelectedCustomExpiryDays(value),
  };
}
