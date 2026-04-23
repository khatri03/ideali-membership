import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import { getMembershipTenureInfo, saveMembershipTenureStep } from "../../lib/membershipWizard";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import {
  MEMBERSHIP_TENURE_NEXT_STEP_NUMBER,
  MEMBERSHIP_TENURE_STEP_NUMBER,
} from "./MembershipTenureStepPage.fields";
import { getMembershipTenureError, normalizeMembershipTenure } from "./MembershipTenureStepPage.schema";
import type { MembershipTenureStepState } from "./MembershipTenureStepPage.types";

async function persistMembershipTenureStepWithFeedback({
  tenure,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  tenure: number | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  const nextError = getMembershipTenureError(tenure);
  if (nextError) {
    setError(nextError);
    return;
  }

  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipTenureStep(normalizeMembershipTenure(tenure), stepNumber, membershipTypeUniqueId);
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership tenure.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipTenureStep(): MembershipTenureStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [selectedTenure, setSelectedTenure] = useState<number | null>(null);
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

    async function loadMembershipTenure() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipTenureInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setSelectedTenure(info.tenure);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSelectedTenure(null);
        setError(loadError instanceof Error ? loadError.message : "Unable to load membership tenure.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipTenure();

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
        void persistMembershipTenureStepWithFeedback({
          tenure: selectedTenure,
          stepNumber: MEMBERSHIP_TENURE_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardColor,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_TENURE_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipTenureStepWithFeedback({
          tenure: selectedTenure,
          stepNumber: MEMBERSHIP_TENURE_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, isSaving, navigate, selectedTenure, setFooterActions]);

  return {
    selectedTenure,
    error,
    isLoading,
    isSaving,
    reload: () => setReloadTick((current) => current + 1),
    selectTenure: (value: number) => setSelectedTenure(value),
  };
}
