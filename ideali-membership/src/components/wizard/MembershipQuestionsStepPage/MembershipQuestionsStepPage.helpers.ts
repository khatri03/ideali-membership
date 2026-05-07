import type { CustomFormControl } from "../../../types/customForms";
import type {
  MembershipCustomQuestionDraft,
  MembershipCustomQuestionOptionDraft,
} from "../../../types/membership";
import { normalizeMembershipQuestionsCustomFormUniqueIds } from "./MembershipQuestionsStepPage.schema";

export function toSentenceCase(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return "Field";
  }

  const normalized = trimmed.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function createCustomQuestionOptionDraft(index: number): MembershipCustomQuestionOptionDraft {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `question-option-${Date.now()}-${index}`,
    displayText: `Option ${index + 1}`,
    value: `option-${index + 1}`,
    isDefault: index === 0,
  };
}

export function createCustomQuestionDraft(control: CustomFormControl): MembershipCustomQuestionDraft {
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
    requiredMessage: `${toSentenceCase(control.defaultLabel || control.name)} is required.`,
    acceptedFileTypes: [],
    minLength: null,
    maxLength: null,
    defaultValue: control.hasOptions ? (options[0]?.value ?? null) : null,
    displayOrder: 0,
    options,
  };
}

export function cloneCustomQuestionDraft(question: MembershipCustomQuestionDraft): MembershipCustomQuestionDraft {
  return {
    ...question,
    acceptedFileTypes: [...question.acceptedFileTypes],
    options: question.options.map((option) => ({ ...option })),
  };
}

export function sanitizeCustomQuestionDraft(draft: MembershipCustomQuestionDraft): MembershipCustomQuestionDraft {
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
    requiredMessage: draft.requiredMessage.trim() || `${toSentenceCase(draft.label)} is required.`,
    acceptedFileTypes: draft.acceptedFileTypes.map((item) => item.trim()).filter((item) => item.length > 0),
    minLength: draft.minLength?.trim() || null,
    maxLength: draft.maxLength?.trim() || null,
    defaultValue: draft.defaultValue?.trim() || null,
    options,
  };
}

export function normalizeQuestionsStepCustomFormUniqueIds(customFormUniqueIds: string[] | null) {
  return customFormUniqueIds ? normalizeMembershipQuestionsCustomFormUniqueIds(customFormUniqueIds) : null;
}
