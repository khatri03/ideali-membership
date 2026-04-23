import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipPaymentAccountInfo,
  invalidateMembershipWizardPaymentAccountCache,
  saveMembershipPaymentAccountStep,
} from "../../lib/membershipWizard";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
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
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  paymentAccountUniqueId: string | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  const nextError = getMembershipPaymentAccountError(paymentAccountUniqueId);
  if (nextError) {
    setError(nextError);
    return;
  }

  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipPaymentAccountStep(
      normalizeMembershipPaymentAccountUniqueId(paymentAccountUniqueId),
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
  const { session } = useAuth();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const paymentAccounts = session?.organizerDetail.paymentAccounts ?? [];
  const [selectedPaymentAccountUniqueId, setSelectedPaymentAccountUniqueId] = useState("");
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

    async function loadMembershipPaymentAccount() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipPaymentAccountInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setSelectedPaymentAccountUniqueId(info.paymentAccountUniqueId);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSelectedPaymentAccountUniqueId("");
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
        void persistMembershipPaymentAccountStepWithFeedback({
          paymentAccountUniqueId: selectedPaymentAccountUniqueId,
          stepNumber: MEMBERSHIP_PAYMENT_ACCOUNT_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardCustomForms,
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
          stepNumber: MEMBERSHIP_PAYMENT_ACCOUNT_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, navigate, selectedPaymentAccountUniqueId, setFooterActions, isSaving]);

  return {
    paymentAccounts,
    selectedPaymentAccountUniqueId,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardPaymentAccountCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    selectPaymentAccount: (paymentAccountUniqueId: string) => {
      setSelectedPaymentAccountUniqueId(paymentAccountUniqueId);
    },
  };
}
