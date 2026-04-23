import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import { fetchCustomFormListItems } from "../../lib/customForms";
import {
  getMembershipQuestionsInfo,
  invalidateMembershipWizardQuestionsCache,
  saveMembershipQuestionsStep,
} from "../../lib/membershipWizard";
import {
  MEMBERSHIP_QUESTIONS_NEXT_STEP_NUMBER,
  MEMBERSHIP_QUESTIONS_STEP_NUMBER,
} from "./MembershipQuestionsStepPage.fields";
import { normalizeMembershipQuestionsCustomFormUniqueId } from "./MembershipQuestionsStepPage.schema";
import type { MembershipQuestionsStepState } from "./MembershipQuestionsStepPage.types";

async function persistMembershipQuestionsStepWithFeedback({
  customFormUniqueId,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  customFormUniqueId: string | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipQuestionsStep(
      customFormUniqueId ? normalizeMembershipQuestionsCustomFormUniqueId(customFormUniqueId) : null,
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership questions.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipQuestionsStep(): MembershipQuestionsStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [customForms, setCustomForms] = useState<MembershipQuestionsStepState["customForms"]>([]);
  const [selectedCustomFormUniqueId, setSelectedCustomFormUniqueId] = useState("");
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

    async function loadQuestionsStep() {
      setIsLoading(true);
      setError("");

      try {
        const [formList, info] = await Promise.all([
          fetchCustomFormListItems(),
          getMembershipQuestionsInfo(currentMembershipTypeUniqueId),
        ]);

        if (!isMounted) {
          return;
        }

        setCustomForms(formList);
        setSelectedCustomFormUniqueId(info.customFormUniqueId);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setCustomForms([]);
        setSelectedCustomFormUniqueId("");
        setError(loadError instanceof Error ? loadError.message : "Unable to load membership questions.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadQuestionsStep();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useLayoutEffect(() => {
    setFooterActions({
      showBack: true,
      showSkip: true,
      showSaveNext: true,
      showSaveExit: true,
      skipLabel: "Skip",
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardPricing,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_QUESTIONS_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSkip: () =>
        void persistMembershipQuestionsStepWithFeedback({
          customFormUniqueId: null,
          stepNumber: MEMBERSHIP_QUESTIONS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardThankYouEmail,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_QUESTIONS_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveNext: () =>
        void persistMembershipQuestionsStepWithFeedback({
          customFormUniqueId: selectedCustomFormUniqueId || null,
          stepNumber: MEMBERSHIP_QUESTIONS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardThankYouEmail,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_QUESTIONS_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipQuestionsStepWithFeedback({
          customFormUniqueId: selectedCustomFormUniqueId || null,
          stepNumber: MEMBERSHIP_QUESTIONS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, isSaving, navigate, selectedCustomFormUniqueId, setFooterActions]);

  return {
    customForms,
    selectedCustomFormUniqueId,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardQuestionsCache(currentMembershipTypeUniqueId);
      }

      setReloadTick((current) => current + 1);
    },
    selectCustomForm: (customFormUniqueId: string) => {
      setSelectedCustomFormUniqueId(customFormUniqueId);
      setError("");
    },
  };
}
