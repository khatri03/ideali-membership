import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import { fetchCustomFormControls, fetchCustomFormListItems, fetchCustomFormPreview } from "../../../lib/customForms";
import {
  getMembershipQuestionsInfo,
  invalidateMembershipWizardQuestionsCache,
  saveMembershipQuestionsStep,
} from "../../../lib/membershipWizard";
import {
  MEMBERSHIP_QUESTIONS_NEXT_STEP_NUMBER,
  MEMBERSHIP_QUESTIONS_STEP_NUMBER,
} from "./MembershipQuestionsStepPage.fields";
import { normalizeMembershipQuestionsCustomFormUniqueIds } from "./MembershipQuestionsStepPage.schema";
import type { CustomFormControl } from "../../../types/customForms";
import type {
  MembershipCustomQuestionDraft,
  MembershipCustomQuestionOptionDraft,
} from "../../../types/membership";
import type { MembershipQuestionsStepState } from "./MembershipQuestionsStepPage.types";

function createCustomQuestionOptionDraft(index: number): MembershipCustomQuestionOptionDraft {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `question-option-${Date.now()}-${index}`,
    displayText: `Option ${index + 1}`,
    value: `option-${index + 1}`,
    isDefault: index === 0,
  };
}

function createCustomQuestionDraft(control: CustomFormControl): MembershipCustomQuestionDraft {
  const hasOptions = control.hasOptions;
  const options = hasOptions ? [createCustomQuestionOptionDraft(0)] : [];

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `custom-question-${Date.now()}`,
    controlId: control.id,
    controlName: control.name,
    controlType: control.controlType,
    iconClass: control.iconClass,
    label: control.defaultLabel,
    placeHolder: control.canHavePlaceHolder ? control.defaultLabel : null,
    tooltip: null,
    required: false,
    minLength: null,
    maxLength: null,
    defaultValue: control.hasOptions ? (options[0]?.value ?? null) : null,
    displayOrder: 0,
    options,
  };
}

function cloneCustomQuestionDraft(question: MembershipCustomQuestionDraft): MembershipCustomQuestionDraft {
  return {
    ...question,
    options: question.options.map((option) => ({ ...option })),
  };
}

function sanitizeCustomQuestionDraft(draft: MembershipCustomQuestionDraft): MembershipCustomQuestionDraft {
  const options = draft.options.map((option, index) => ({
    ...option,
    id: option.id || globalThis.crypto?.randomUUID?.() || `question-option-${Date.now()}-${index}`,
    displayText: option.displayText.trim(),
    value: option.value.trim(),
    isDefault: option.isDefault,
  }));

  return {
    ...draft,
    id: draft.id || globalThis.crypto?.randomUUID?.() || `custom-question-${Date.now()}`,
    controlName: draft.controlName.trim(),
    controlType: draft.controlType.trim(),
    iconClass: draft.iconClass.trim(),
    label: draft.label.trim(),
    placeHolder: draft.placeHolder?.trim() || null,
    tooltip: draft.tooltip?.trim() || null,
    minLength: draft.minLength?.trim() || null,
    maxLength: draft.maxLength?.trim() || null,
    defaultValue: draft.defaultValue?.trim() || null,
    options,
  };
}

async function persistMembershipQuestionsStepWithFeedback({
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
      customFormUniqueIds ? normalizeMembershipQuestionsCustomFormUniqueIds(customFormUniqueIds) : null,
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

export function useMembershipQuestionsStep(): MembershipQuestionsStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [customFormControls, setCustomFormControls] = useState<CustomFormControl[]>([]);
  const [customForms, setCustomForms] = useState<MembershipQuestionsStepState["customForms"]>([]);
  const [selectedCustomFormUniqueIds, setSelectedCustomFormUniqueIds] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<MembershipCustomQuestionDraft[]>([]);
  const [isCustomFormDropdownOpen, setCustomFormDropdownOpen] = useState(false);
  const [isCustomQuestionModalOpen, setIsCustomQuestionModalOpen] = useState(false);
  const [customQuestionDraft, setCustomQuestionDraft] = useState<MembershipCustomQuestionDraft | null>(null);
  const [previewCustomFormUniqueId, setPreviewCustomFormUniqueId] = useState("");
  const [previewCustomFormName, setPreviewCustomFormName] = useState("");
  const [previewCustomFormLoading, setPreviewCustomFormLoading] = useState(false);
  const [previewCustomFormError, setPreviewCustomFormError] = useState("");
  const [previewCustomFormFields, setPreviewCustomFormFields] = useState<
    MembershipQuestionsStepState["previewCustomFormFields"]
  >([]);
  const [previewCustomFormLayoutColumn, setPreviewCustomFormLayoutColumn] = useState(2);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [editingCustomQuestionId, setEditingCustomQuestionId] = useState<string | null>(null);
  const [pendingCustomQuestionRemoval, setPendingCustomQuestionRemoval] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [pendingSelectedCustomFormRemoval, setPendingSelectedCustomFormRemoval] = useState<{
    id: string;
    label: string;
  } | null>(null);

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
        const [formList, info, formControls] = await Promise.all([
          fetchCustomFormListItems(),
          getMembershipQuestionsInfo(currentMembershipTypeUniqueId),
          fetchCustomFormControls(),
        ]);

        if (!isMounted) {
          return;
        }

        setCustomFormControls(formControls);
        setCustomForms(formList);
        setSelectedCustomFormUniqueIds(normalizeMembershipQuestionsCustomFormUniqueIds(info.customFormUniqueIds));
        setCustomQuestions((info.customQuestions || []).map((question) => ({
          ...question,
          placeHolder: question.placeHolder ?? null,
          tooltip: question.tooltip ?? null,
          minLength: question.minLength ?? null,
          maxLength: question.maxLength ?? null,
          defaultValue: question.defaultValue ?? null,
          options: (question.options || []).map((option) => ({
            ...option,
            id: option.id || globalThis.crypto?.randomUUID?.() || `question-option-${Date.now()}`,
          })),
        })));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setCustomFormControls([]);
        setCustomForms([]);
        setSelectedCustomFormUniqueIds([]);
        setCustomQuestions([]);
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
    });
  }, [currentMembershipTypeUniqueId, customQuestions, isSaving, navigate, selectedCustomFormUniqueIds, setFooterActions]);

  useEffect(() => {
    console.log("[MembershipQuestions] custom form order state", selectedCustomFormUniqueIds);
  }, [selectedCustomFormUniqueIds]);

  const openCustomFormPreview = async (customFormUniqueId: string) => {
    const formItem = customForms.find((form) => form.value === customFormUniqueId);
    if (!formItem) {
      setPreviewCustomFormError("Custom form not found.");
      return;
    }

    setPreviewCustomFormUniqueId(customFormUniqueId);
    setPreviewCustomFormName(formItem.text);
    setPreviewCustomFormLoading(true);
    setPreviewCustomFormError("");
    setPreviewCustomFormFields([]);

    try {
      const preview = await fetchCustomFormPreview(customFormUniqueId);
      setPreviewCustomFormName(preview.headerText || preview.name || formItem.text);
      setPreviewCustomFormLayoutColumn(preview.layoutColumn || 2);
      setPreviewCustomFormFields(
        (preview.fields || []).map((field) => ({
          id: field.id,
          displayOrder: field.displayOrder,
          controlLabel: field.controlLabel,
          placeHolder: field.placeHolder,
          tooltip: field.tooltip,
          isMandatory: field.isMandatory,
          defaultValue: field.defaultValue,
          controlType: field.formControl?.controlType || "",
          iconClass: field.formControl?.iconClass || "",
          options: (field.options || []).map((option) => ({
            id: option.id,
            displayText: option.displayText,
            value: option.value,
          })),
        })),
      );
    } catch (previewError) {
      setPreviewCustomFormError(previewError instanceof Error ? previewError.message : "Unable to load custom form preview.");
    } finally {
      setPreviewCustomFormLoading(false);
    }
  };

  const closeCustomFormPreview = () => {
    setPreviewCustomFormUniqueId("");
    setPreviewCustomFormName("");
    setPreviewCustomFormLoading(false);
    setPreviewCustomFormError("");
    setPreviewCustomFormFields([]);
    setPreviewCustomFormLayoutColumn(2);
  };

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
    if (!pendingCustomQuestionRemoval) {
      return;
    }

    setCustomQuestions((current) =>
      current
        .filter((question) => question.id !== pendingCustomQuestionRemoval.id)
        .map((question, index) => ({
          ...question,
          displayOrder: index + 1,
        })),
    );
    setPendingCustomQuestionRemoval(null);
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
    if (!pendingSelectedCustomFormRemoval) {
      return;
    }

    setSelectedCustomFormUniqueIds((current) =>
      current.filter((uniqueId) => uniqueId !== pendingSelectedCustomFormRemoval.id),
    );

    if (previewCustomFormUniqueId === pendingSelectedCustomFormRemoval.id) {
      closeCustomFormPreview();
    }

    setPendingSelectedCustomFormRemoval(null);
    setError("");
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
    customFormControls,
    customForms,
    selectedCustomFormUniqueIds,
    customQuestions,
    isCustomFormDropdownOpen,
    isCustomQuestionModalOpen,
    customQuestionDraft,
    editingCustomQuestionId,
    previewCustomFormUniqueId,
    previewCustomFormName,
    previewCustomFormLoading,
    previewCustomFormError,
    previewCustomFormFields,
    previewCustomFormLayoutColumn,
    error,
    isLoading,
    isSaving,
    pendingCustomQuestionRemoval,
    pendingSelectedCustomFormRemoval,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardQuestionsCache(currentMembershipTypeUniqueId);
      }

      setReloadTick((current) => current + 1);
    },
    toggleCustomForm: (customFormUniqueId: string) => {
      setSelectedCustomFormUniqueIds((current) => (
        current.includes(customFormUniqueId)
          ? current.filter((value) => value !== customFormUniqueId)
          : [...current, customFormUniqueId]
      ));
      setError("");
    },
    reorderSelectedCustomFormUniqueIds: (activeCustomFormUniqueId: string, overCustomFormUniqueId: string) => {
      setSelectedCustomFormUniqueIds((current) => {
        const oldIndex = current.indexOf(activeCustomFormUniqueId);
        const newIndex = current.indexOf(overCustomFormUniqueId);

        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
          return current;
        }

        const nextOrder = arrayMove(current, oldIndex, newIndex);
        return nextOrder;
      });
      setError("");
    },
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
    setCustomFormDropdownOpen,
    openCustomFormPreview,
    closeCustomFormPreview,
  };
}


