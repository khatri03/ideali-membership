import { normalizeQuestionsStepCustomFormUniqueIds, sanitizeCustomQuestionDraft } from "./MembershipQuestionsStepPage.helpers";
import { saveMembershipQuestionsStep } from "../../../lib/membershipWizard";
import type { MembershipCustomQuestionDraft } from "../../../types/membership";

export async function persistMembershipQuestionsStepWithFeedback({
  customFormUniqueIds,
  customQuestions,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  setCustomFormDropdownOpen,
  onSuccess,
}: {
  customFormUniqueIds: string[] | null;
  customQuestions: MembershipCustomQuestionDraft[] | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  setCustomFormDropdownOpen: (isOpen: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipQuestionsStep(
      normalizeQuestionsStepCustomFormUniqueIds(customFormUniqueIds),
      customQuestions ? customQuestions.map(sanitizeCustomQuestionDraft) : null,
      stepNumber,
      membershipTypeUniqueId,
    );
    setCustomFormDropdownOpen(false);
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership questions.");
  } finally {
    setIsSaving(false);
  }
}
