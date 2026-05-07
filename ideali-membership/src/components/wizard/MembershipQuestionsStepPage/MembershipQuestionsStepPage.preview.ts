import { fetchCustomFormPreview } from "../../../lib/customForms";
import type { CustomFormListItem } from "../../../types/customForms";

export type MembershipQuestionsPreviewField = {
  id: number;
  displayOrder: number;
  layoutColumn: number | null;
  controlLabel: string;
  placeHolder: string | null;
  tooltip: string | null;
  isMandatory: boolean;
  defaultValue: string | null;
  controlType: string;
  iconClass: string;
  options: Array<{
    id: number;
    displayText: string;
    value: string;
  }>;
};

export async function loadMembershipQuestionsPreview(customForms: CustomFormListItem[], customFormUniqueId: string) {
  const formItem = customForms.find((form) => form.value === customFormUniqueId);

  if (!formItem) {
    throw new Error("Custom form not found.");
  }

  const preview = await fetchCustomFormPreview(customFormUniqueId);

  console.log("[MembershipQuestions][Preview]", {
    customFormUniqueId,
    layoutColumn: preview.layoutColumn,
    fields: (preview.fields || []).map((field) => ({
      id: field.id,
      uniqueId: field.uniqueId,
      controlLabel: field.controlLabel,
      displayOrder: field.displayOrder,
      layoutColumn: field.layoutColumn,
      controlType: field.formControl?.controlType,
      defaultValue: field.defaultValue,
      placeHolder: field.placeHolder,
      tooltip: field.tooltip,
      isMandatory: field.isMandatory,
      requiredMessage: field.requiredMessage,
      acceptedFileTypes: field.acceptedFileTypes,
      minLength: field.minLength,
      maxLength: field.maxLength,
      options: field.options,
    })),
  });

  return {
    previewName: preview.headerText || preview.name || formItem.text,
    previewLayoutColumn: Math.max(1, Math.min(4, preview.layoutColumn || 1)),
    previewFields: (preview.fields || []).map((field) => ({
      id: field.id,
      displayOrder: field.displayOrder,
      layoutColumn: field.layoutColumn,
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
    })) as MembershipQuestionsPreviewField[],
  };
}
