import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../../app/routes";
import { MEMBERSHIP_QUESTIONS_NEXT_STEP_NUMBER, MEMBERSHIP_QUESTIONS_STEP_NUMBER } from "./MembershipQuestionsStepPage.fields";
import { persistMembershipQuestionsStepWithFeedback } from "./MembershipQuestionsStepPage.persist";
import type { MembershipCustomQuestionDraft } from "../../../../types/membership";

type BuildMembershipQuestionsFooterActionsArgs = {
  currentMembershipTypeUniqueId: string;
  customQuestions: MembershipCustomQuestionDraft[];
  isSaving: boolean;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  selectedCustomFormUniqueIds: string[];
  setCustomFormDropdownOpen: (isOpen: boolean) => void;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
};

export function buildMembershipQuestionsFooterActions({
  currentMembershipTypeUniqueId,
  customQuestions,
  isSaving,
  navigate,
  selectedCustomFormUniqueIds,
  setCustomFormDropdownOpen,
  setError,
  setIsSaving,
}: BuildMembershipQuestionsFooterActionsArgs) {
  return {
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
          APP_ROUTES.membershipWizardDiscountCoupons,
          currentMembershipTypeUniqueId,
          MEMBERSHIP_QUESTIONS_STEP_NUMBER - 1,
        ),
        { replace: true },
      ),
    onSkip: () =>
      void persistMembershipQuestionsStepWithFeedback({
        customFormUniqueIds: null,
        customQuestions: null,
        stepNumber: MEMBERSHIP_QUESTIONS_STEP_NUMBER,
        membershipTypeUniqueId: currentMembershipTypeUniqueId,
        setError,
        setIsSaving,
        setCustomFormDropdownOpen,
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
        customFormUniqueIds: selectedCustomFormUniqueIds,
        customQuestions,
        stepNumber: MEMBERSHIP_QUESTIONS_STEP_NUMBER,
        membershipTypeUniqueId: currentMembershipTypeUniqueId,
        setError,
        setIsSaving,
        setCustomFormDropdownOpen,
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
        customFormUniqueIds: selectedCustomFormUniqueIds,
        customQuestions,
        stepNumber: MEMBERSHIP_QUESTIONS_STEP_NUMBER,
        membershipTypeUniqueId: currentMembershipTypeUniqueId,
        setError,
        setIsSaving,
        setCustomFormDropdownOpen,
        onSuccess: async () => {
          navigate(APP_ROUTES.membershipTypes, { replace: true });
        },
      }),
  };
}

