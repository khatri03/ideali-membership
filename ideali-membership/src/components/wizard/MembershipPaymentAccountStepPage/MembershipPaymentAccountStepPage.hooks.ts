import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getOrganizerPaymentAccountSelectionItems,
  getMembershipPaymentAccountInfo,
  getMembershipPaymentMethods,
  invalidateMembershipWizardPaymentAccountCache,
  invalidateOrganizerPaymentAccountSelectionCache,
  invalidateOrganizerPaymentMethodsCache,
  saveMembershipPaymentAccountStep,
} from "../../../lib/membershipWizard";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import {
  MEMBERSHIP_PAYMENT_ACCOUNT_NEXT_STEP_NUMBER,
  MEMBERSHIP_PAYMENT_ACCOUNT_STEP_NUMBER,
} from "./MembershipPaymentAccountStepPage.fields";
import {
  getMembershipPaymentAccountError,
  normalizeMembershipPaymentAccountUniqueId,
} from "./MembershipPaymentAccountStepPage.schema";
import type { MembershipPaymentAccountStepState } from "./MembershipPaymentAccountStepPage.types";

async function persistMembershipPaymentAccountStepWithFeedback({
  paymentAccountUniqueId,
  paymentMethods,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setValidationError,
  setIsSaving,
  onSuccess,
}: {
  paymentAccountUniqueId: string | null;
  paymentMethods: number[];
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setValidationError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  const nextError = getMembershipPaymentAccountError(paymentAccountUniqueId);
  if (nextError) {
    setValidationError(nextError);
    return;
  }

  if (!paymentMethods.length) {
    setValidationError("Atleast one payment method is required.");
    return;
  }

  setError("");
  setValidationError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipPaymentAccountStep(
      normalizeMembershipPaymentAccountUniqueId(paymentAccountUniqueId),
      paymentMethods,
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save payment account.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipPaymentAccountStep(): MembershipPaymentAccountStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [paymentAccounts, setPaymentAccounts] = useState<MembershipPaymentAccountStepState["paymentAccounts"]>([]);
  const [selectedPaymentAccountUniqueId, setSelectedPaymentAccountUniqueId] = useState("");
  const [savedPaymentAccountUniqueId, setSavedPaymentAccountUniqueId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<MembershipPaymentAccountStepState["paymentMethods"]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMethodsLoading, setIsMethodsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMembershipPaymentAccount() {
      setIsLoading(true);
      setError("");
      setValidationError("");

      try {
        const [accountOptions, info] = await Promise.all([
          getOrganizerPaymentAccountSelectionItems(),
          getMembershipPaymentAccountInfo(currentMembershipTypeUniqueId),
        ]);

        if (!isMounted) {
          return;
        }

        setPaymentAccounts(accountOptions);
        setSelectedPaymentAccountUniqueId(info.paymentAccountUniqueId);
        setSavedPaymentAccountUniqueId(info.paymentAccountUniqueId);
        setSavedPaymentMethods(info.paymentMethods ?? []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setPaymentAccounts([]);
        setSelectedPaymentAccountUniqueId("");
        setSavedPaymentAccountUniqueId("");
        setSavedPaymentMethods([]);
        setPaymentMethods([]);
        setSelectedPaymentMethods([]);
        setValidationError("");
        setError(loadError instanceof Error ? loadError.message : "Unable to load payment account.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipPaymentAccount();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useEffect(() => {
    if (!selectedPaymentAccountUniqueId) {
      setPaymentMethods([]);
      setSelectedPaymentMethods([]);
      setIsMethodsLoading(false);
      setValidationError("");
      return;
    }

    let isMounted = true;

    async function loadPaymentMethods() {
      setIsMethodsLoading(true);

      try {
        const methods = await getMembershipPaymentMethods(selectedPaymentAccountUniqueId);
        if (!isMounted) {
          return;
        }

        setPaymentMethods(methods);

        const availableMethodIds = methods.map((method) => method.value);
        const restoredSelections =
          selectedPaymentAccountUniqueId === savedPaymentAccountUniqueId && savedPaymentMethods.length > 0
            ? savedPaymentMethods.filter((methodId) => availableMethodIds.includes(methodId))
            : [];

        setSelectedPaymentMethods(restoredSelections);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setPaymentMethods([]);
        setSelectedPaymentMethods([]);
        setValidationError("");
        setError(loadError instanceof Error ? loadError.message : "Unable to load payment methods.");
      } finally {
        if (isMounted) {
          setIsMethodsLoading(false);
        }
      }
    }

    void loadPaymentMethods();

    return () => {
      isMounted = false;
    };
  }, [savedPaymentAccountUniqueId, savedPaymentMethods, selectedPaymentAccountUniqueId]);

  useLayoutEffect(() => {
    setFooterActions({
      showBack: true,
      showSkip: false,
      showSaveNext: true,
      showSaveExit: true,
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardBanner,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_PAYMENT_ACCOUNT_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSaveNext: () =>
        void persistMembershipPaymentAccountStepWithFeedback({
          paymentAccountUniqueId: selectedPaymentAccountUniqueId,
          paymentMethods: selectedPaymentMethods,
          stepNumber: MEMBERSHIP_PAYMENT_ACCOUNT_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardPricing,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_PAYMENT_ACCOUNT_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipPaymentAccountStepWithFeedback({
          paymentAccountUniqueId: selectedPaymentAccountUniqueId,
          paymentMethods: selectedPaymentMethods,
          stepNumber: MEMBERSHIP_PAYMENT_ACCOUNT_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, isSaving, navigate, selectedPaymentAccountUniqueId, selectedPaymentMethods, setFooterActions]);

  return {
    paymentAccounts,
    selectedPaymentAccountUniqueId,
    paymentMethods,
    selectedPaymentMethods,
    error,
    validationError,
    isLoading,
    isMethodsLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardPaymentAccountCache(currentMembershipTypeUniqueId);
        invalidateOrganizerPaymentAccountSelectionCache();
        if (selectedPaymentAccountUniqueId) {
          invalidateOrganizerPaymentMethodsCache(selectedPaymentAccountUniqueId);
        }
      }
      setValidationError("");
      setReloadTick((current) => current + 1);
    },
    selectPaymentAccount: (paymentAccountUniqueId: string) => {
      setSelectedPaymentAccountUniqueId(paymentAccountUniqueId);
      setValidationError("");
    },
    togglePaymentMethod: (paymentMethodId: number) => {
      setValidationError("");
      setSelectedPaymentMethods((current) =>
        current.includes(paymentMethodId)
          ? current.filter((methodId) => methodId !== paymentMethodId)
          : [...current, paymentMethodId],
      );
    },
  };
}

