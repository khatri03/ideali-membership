import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import { fetchCustomFormListItems, fetchCustomFormPreview } from "../../lib/customForms";
import {
  getMembershipQuestionsInfo,
  invalidateMembershipWizardQuestionsCache,
  saveMembershipQuestionsStep,
} from "../../lib/membershipWizard";
import {
  MEMBERSHIP_QUESTIONS_NEXT_STEP_NUMBER,
  MEMBERSHIP_QUESTIONS_STEP_NUMBER,
} from "./MembershipQuestionsStepPage.fields";
import { normalizeMembershipQuestionsCustomFormUniqueIds } from "./MembershipQuestionsStepPage.schema";
import type { MembershipQuestionsStepState } from "./MembershipQuestionsStepPage.types";

async function persistMembershipQuestionsStepWithFeedback({
  customFormUniqueIds,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  setCustomFormDropdownOpen,
  onSuccess,
}: {
  customFormUniqueIds: string[] | null;
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
  const [customForms, setCustomForms] = useState<MembershipQuestionsStepState["customForms"]>([]);
  const [selectedCustomFormUniqueIds, setSelectedCustomFormUniqueIds] = useState<string[]>([]);
  const [isCustomFormDropdownOpen, setCustomFormDropdownOpen] = useState(false);
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
        setSelectedCustomFormUniqueIds(normalizeMembershipQuestionsCustomFormUniqueIds(info.customFormUniqueIds));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setCustomForms([]);
        setSelectedCustomFormUniqueIds([]);
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
          customFormUniqueIds: null,
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
  }, [currentMembershipTypeUniqueId, isSaving, navigate, selectedCustomFormUniqueIds, setFooterActions]);

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

  return {
    customForms,
    selectedCustomFormUniqueIds,
    isCustomFormDropdownOpen,
    previewCustomFormUniqueId,
    previewCustomFormName,
    previewCustomFormLoading,
    previewCustomFormError,
    previewCustomFormFields,
    previewCustomFormLayoutColumn,
    error,
    isLoading,
    isSaving,
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

        return arrayMove(current, oldIndex, newIndex);
      });
      setError("");
    },
    setCustomFormDropdownOpen,
    openCustomFormPreview,
    closeCustomFormPreview,
  };
}
