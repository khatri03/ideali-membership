import { arrayMove } from "@dnd-kit/sortable";
import type { Dispatch, SetStateAction } from "react";
import { cloneCustomQuestionDraft, createCustomQuestionDraft, sanitizeCustomQuestionDraft } from "./MembershipQuestionsStepPage.helpers";
import type { CustomFormControl } from "../../../types/customForms";
import type { MembershipCustomQuestionDraft } from "../../../types/membership";
import type { MembershipQuestionsStepState } from "./MembershipQuestionsStepPage.types";

type BuildMembershipQuestionsStepActionsArgs = {
  customQuestions: MembershipCustomQuestionDraft[];
  customForms: MembershipQuestionsStepState["customForms"];
  customFormControls: CustomFormControl[];
  editingCustomQuestionId: string | null;
  previewCustomFormUniqueId: string;
  setError: (value: string) => void;
  setCustomQuestions: Dispatch<SetStateAction<MembershipCustomQuestionDraft[]>>;
  setCustomQuestionDraft: Dispatch<SetStateAction<MembershipCustomQuestionDraft | null>>;
  setIsCustomQuestionModalOpen: Dispatch<SetStateAction<boolean>>;
  setEditingCustomQuestionId: Dispatch<SetStateAction<string | null>>;
  setPendingCustomQuestionRemoval: Dispatch<SetStateAction<{ id: string; label: string } | null>>;
  setPendingSelectedCustomFormRemoval: Dispatch<SetStateAction<{ id: string; label: string } | null>>;
  setSelectedCustomFormUniqueIds: Dispatch<SetStateAction<string[]>>;
  closeCustomFormPreview: () => void;
};

export function buildMembershipQuestionsStepActions({
  customQuestions,
  customForms,
  customFormControls,
  editingCustomQuestionId,
  previewCustomFormUniqueId,
  setError,
  setCustomQuestions,
  setCustomQuestionDraft,
  setIsCustomQuestionModalOpen,
  setEditingCustomQuestionId,
  setPendingCustomQuestionRemoval,
  setPendingSelectedCustomFormRemoval,
  setSelectedCustomFormUniqueIds,
  closeCustomFormPreview,
}: BuildMembershipQuestionsStepActionsArgs) {
  const openCustomQuestionModal = (customQuestionId?: string) => {
    if (customQuestionId) {
      const existingQuestion = customQuestions.find((question) => question.id === customQuestionId);

      if (!existingQuestion) {
        return;
      }

      setEditingCustomQuestionId(customQuestionId);
      setCustomQuestionDraft(cloneCustomQuestionDraft(existingQuestion));
      setIsCustomQuestionModalOpen(true);
      return;
    }

    const initialControl = customFormControls[0];
    setEditingCustomQuestionId(null);
    setCustomQuestionDraft(initialControl ? createCustomQuestionDraft(initialControl) : null);
    setIsCustomQuestionModalOpen(true);
  };

  const closeCustomQuestionModal = () => {
    setIsCustomQuestionModalOpen(false);
    setCustomQuestionDraft(null);
    setEditingCustomQuestionId(null);
  };

  const selectCustomQuestionControl = (controlId: number) => {
    const selectedControl = customFormControls.find((control) => control.id === controlId);
    setCustomQuestionDraft(selectedControl ? createCustomQuestionDraft(selectedControl) : null);
  };

  const updateCustomQuestionDraft = (updater: (draft: MembershipCustomQuestionDraft) => MembershipCustomQuestionDraft) => {
    setCustomQuestionDraft((current) => (current ? updater(current) : current));
  };

  const persistCustomQuestionDraft = (draft: MembershipCustomQuestionDraft, keepModalOpen: boolean) => {
    const nextDraft = sanitizeCustomQuestionDraft(draft);

    setCustomQuestions((current) => {
      if (editingCustomQuestionId) {
        return current.map((question) =>
          question.id === editingCustomQuestionId
            ? {
                ...nextDraft,
                id: editingCustomQuestionId,
                displayOrder: question.displayOrder,
              }
            : question,
        );
      }

      return [
        ...current,
        {
          ...nextDraft,
          displayOrder: current.length + 1,
        },
      ];
    });

    if (keepModalOpen) {
      setEditingCustomQuestionId(null);
      const selectedControl = customFormControls.find((control) => control.id === nextDraft.controlId);
      const nextControl = selectedControl ?? customFormControls[0];
      setCustomQuestionDraft(nextControl ? createCustomQuestionDraft(nextControl) : null);
      setIsCustomQuestionModalOpen(true);
    } else {
      setIsCustomQuestionModalOpen(false);
      setCustomQuestionDraft(null);
      setEditingCustomQuestionId(null);
    }

    setError("");
  };

  const addCustomQuestion = (draft: MembershipCustomQuestionDraft) => {
    persistCustomQuestionDraft(draft, false);
  };

  const addCustomQuestionAndContinue = (draft: MembershipCustomQuestionDraft) => {
    persistCustomQuestionDraft(draft, true);
  };

  const requestCustomQuestionRemoval = (customQuestionId: string) => {
    const targetQuestion = customQuestions.find((question) => question.id === customQuestionId);

    if (!targetQuestion) {
      return;
    }

    setPendingCustomQuestionRemoval({
      id: customQuestionId,
      label: targetQuestion.label || targetQuestion.controlName,
    });
  };

  const confirmCustomQuestionRemoval = () => {
    // This closure intentionally reads the latest pending state from React state via setter callbacks.
    setPendingCustomQuestionRemoval((currentPending) => {
      if (!currentPending) {
        return currentPending;
      }

      setCustomQuestions((current) =>
        current
          .filter((question) => question.id !== currentPending.id)
          .map((question, index) => ({
            ...question,
            displayOrder: index + 1,
          })),
      );
      return null;
    });
  };

  const cancelCustomQuestionRemoval = () => {
    setPendingCustomQuestionRemoval(null);
  };

  const requestSelectedCustomFormRemoval = (customFormUniqueId: string) => {
    const targetForm = customForms.find((form) => form.value === customFormUniqueId);

    if (!targetForm) {
      return;
    }

    setPendingSelectedCustomFormRemoval({
      id: customFormUniqueId,
      label: targetForm.text,
    });
  };

  const confirmSelectedCustomFormRemoval = () => {
    setPendingSelectedCustomFormRemoval((currentPending) => {
      if (!currentPending) {
        return currentPending;
      }

      setSelectedCustomFormUniqueIds((current) => current.filter((uniqueId) => uniqueId !== currentPending.id));

      if (previewCustomFormUniqueId === currentPending.id) {
        closeCustomFormPreview();
      }

      setError("");
      return null;
    });
  };

  const cancelSelectedCustomFormRemoval = () => {
    setPendingSelectedCustomFormRemoval(null);
  };

  const reorderCustomQuestions = (activeCustomQuestionId: string, overCustomQuestionId: string) => {
    setCustomQuestions((current) => {
      const oldIndex = current.findIndex((question) => question.id === activeCustomQuestionId);
      const newIndex = current.findIndex((question) => question.id === overCustomQuestionId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex).map((question, index) => ({
        ...question,
        displayOrder: index + 1,
      }));
    });
    setError("");
  };

  return {
    addCustomQuestion,
    addCustomQuestionAndContinue,
    requestCustomQuestionRemoval,
    confirmCustomQuestionRemoval,
    cancelCustomQuestionRemoval,
    requestSelectedCustomFormRemoval,
    confirmSelectedCustomFormRemoval,
    cancelSelectedCustomFormRemoval,
    reorderCustomQuestions,
    openCustomQuestionModal,
    closeCustomQuestionModal,
    updateCustomQuestionDraft,
    selectCustomQuestionControl,
    persistCustomQuestionDraft,
  };
}
