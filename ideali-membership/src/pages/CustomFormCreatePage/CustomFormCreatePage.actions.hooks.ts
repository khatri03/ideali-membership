import type { Dispatch, SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";
import { APP_ROUTES } from "../../routes";
import { createCustomForm, updateCustomForm } from "../../lib/customForms";
import type { CustomFormDraft, CustomFormFieldDraft } from "../../types/customForms";

export function useCustomFormCreatePageActions({
  customFormUniqueId,
  draft,
  fields,
  isEditMode,
  isLoadingForm,
  isSavingForm,
  canCreateForm,
  navigate,
  previewColumnCount,
  setFieldLayoutMenu,
  setIsPreviewOpen,
  setIsSavingForm,
  setSaveError,
  setShowCreateValidation,
}: {
  customFormUniqueId?: string;
  draft: CustomFormDraft;
  fields: CustomFormFieldDraft[];
  isEditMode: boolean;
  isLoadingForm: boolean;
  isSavingForm: boolean;
  canCreateForm: boolean;
  navigate: NavigateFunction;
  previewColumnCount: number;
  setFieldLayoutMenu: Dispatch<SetStateAction<{ fieldId: string; x: number; y: number } | null>>;
  setIsPreviewOpen: Dispatch<SetStateAction<boolean>>;
  setIsSavingForm: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<string | null>>;
  setShowCreateValidation: Dispatch<SetStateAction<boolean>>;
}) {
  function closePreview() {
    setIsPreviewOpen(false);
  }

  function openFieldLayoutMenu(fieldId: string, position: { x: number; y: number }) {
    setFieldLayoutMenu({
      fieldId,
      x: position.x,
      y: position.y,
    });
  }

  function closeFieldLayoutMenu() {
    setFieldLayoutMenu(null);
  }

  function openPreview() {
    if (fields.length === 0) {
      return;
    }

    console.log("[CustomForm][Preview]", {
      draft,
      previewColumnCount,
      fields,
    });

    setIsPreviewOpen(true);
  }

  async function handleSaveForm() {
    if (isSavingForm || isLoadingForm) {
      return;
    }

    if (!canCreateForm) {
      setShowCreateValidation(true);
      setSaveError(null);
      return;
    }

    setIsSavingForm(true);
    setSaveError(null);
    setShowCreateValidation(false);

    try {
      const formId = isEditMode && customFormUniqueId
        ? await updateCustomForm(customFormUniqueId, draft, fields)
        : await createCustomForm(draft, fields);
      if (formId > 0) {
        navigate(APP_ROUTES.customForms, { replace: true });
        return;
      }

      setSaveError(isEditMode ? "We couldn't update the form. Please try again." : "We couldn't create the form. Please try again.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : isEditMode ? "Failed to update the form." : "Failed to create the form.");
    } finally {
      setIsSavingForm(false);
    }
  }

  return {
    closeFieldLayoutMenu,
    closePreview,
    handleSaveForm,
    openFieldLayoutMenu,
    openPreview,
  };
}
