import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import { fetchCustomFormControls, fetchCustomFormListItems } from "../../../../services/customForms";
import {
  getMembershipQuestionsInfo,
  invalidateMembershipWizardQuestionsCache,
} from "../../../../services/membershipWizard";
import {
  MEMBERSHIP_QUESTIONS_STEP_NUMBER,
} from "./MembershipQuestionsStepPage.fields";
import type { CustomFormControl } from "../../../../types/customForms";
import type {
  MembershipCustomQuestionDraft,
} from "../../../../types/membership";
import type { MembershipQuestionsStepState } from "./MembershipQuestionsStepPage.types";
import {
  normalizeQuestionsStepCustomFormUniqueIds,
  toSentenceCase,
} from "./MembershipQuestionsStepPage.helpers";
import { loadMembershipQuestionsPreview } from "./MembershipQuestionsStepPage.preview";
import { buildMembershipQuestionsStepActions } from "./MembershipQuestionsStepPage.actions";
import { buildMembershipQuestionsFooterActions } from "./MembershipQuestionsStepPage.footer";

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
  const [previewCustomFormLayoutColumn, setPreviewCustomFormLayoutColumn] = useState(1);
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
        setSelectedCustomFormUniqueIds(normalizeQuestionsStepCustomFormUniqueIds(info.customFormUniqueIds) ?? []);
        setCustomQuestions((info.customQuestions || []).map((question) => ({
          ...question,
          placeHolder: question.placeHolder ?? null,
          tooltip: question.tooltip ?? null,
          requiredMessage:
            question.requiredMessage?.trim() || `${toSentenceCase(question.label)} is required.`,
          acceptedFileTypes: [...(question.acceptedFileTypes || [])],
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
    setFooterActions(
      buildMembershipQuestionsFooterActions({
        currentMembershipTypeUniqueId,
        customQuestions,
        isSaving,
        navigate,
        selectedCustomFormUniqueIds,
        setCustomFormDropdownOpen,
        setError,
        setIsSaving,
      }),
    );
  }, [currentMembershipTypeUniqueId, customQuestions, isSaving, navigate, selectedCustomFormUniqueIds, setFooterActions]);

  useEffect(() => {
    console.log("[MembershipQuestions] custom form order state", selectedCustomFormUniqueIds);
  }, [selectedCustomFormUniqueIds]);

  const closeCustomFormPreview = () => {
    setPreviewCustomFormUniqueId("");
    setPreviewCustomFormName("");
    setPreviewCustomFormLoading(false);
    setPreviewCustomFormError("");
    setPreviewCustomFormFields([]);
    setPreviewCustomFormLayoutColumn(1);
  };

  const openCustomFormPreview = async (customFormUniqueId: string) => {
    setPreviewCustomFormUniqueId(customFormUniqueId);
    setPreviewCustomFormLoading(true);
    setPreviewCustomFormError("");
    setPreviewCustomFormFields([]);

    try {
      const preview = await loadMembershipQuestionsPreview(customForms, customFormUniqueId);
      setPreviewCustomFormName(preview.previewName);
      setPreviewCustomFormLayoutColumn(preview.previewLayoutColumn);
      setPreviewCustomFormFields(preview.previewFields);
    } catch (previewError) {
      setPreviewCustomFormError(previewError instanceof Error ? previewError.message : "Unable to load custom form preview.");
    } finally {
      setPreviewCustomFormLoading(false);
    }
  };

  const {
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
  } = buildMembershipQuestionsStepActions({
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
  });

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


