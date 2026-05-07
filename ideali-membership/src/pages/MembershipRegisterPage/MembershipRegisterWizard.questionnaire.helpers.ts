import type {
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationCustomQuestion,
} from "../../types/membershipRegistration";

export type CustomFormValue = string | string[] | boolean | File | null;
export type CustomFormValues = Record<string, CustomFormValue>;
export type CustomFormErrors = Record<string, string>;
export type CustomQuestionValue = CustomFormValue;
export type CustomQuestionValues = Record<string, CustomQuestionValue>;
export type CustomQuestionErrors = Record<string, string>;

export function buildCustomFormFieldKey(formUniqueId: string, fieldUniqueId: string) {
  return `${formUniqueId}:${fieldUniqueId}`;
}

export function buildCustomQuestionKey(questionUniqueId: string) {
  return questionUniqueId;
}

export function getCustomFormControlType(controlTypeId: number): string {
  switch (controlTypeId) {
    case 1:
      return "text";
    case 2:
      return "email";
    case 3:
      return "number";
    case 4:
      return "date";
    case 5:
      return "select";
    case 6:
      return "checkbox";
    case 7:
      return "radio";
    case 8:
      return "textarea";
    case 9:
      return "file";
    case 10:
      return "password";
    case 14:
      return "phone";
    case 15:
      return "multiselect";
    case 16:
      return "country";
    case 17:
      return "state";
    default:
      return "text";
  }
}

export function getCustomQuestionControlType(controlType: string) {
  return controlType.trim().toLowerCase();
}

export function parseDelimitedValues(value: string | null | undefined) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function toSentenceCase(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return "Field";
  }

  const normalized = trimmed.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function parseAcceptedFileTypes(acceptedFileTypes: string | null | undefined) {
  return (acceptedFileTypes ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isFileTypeAccepted(file: File, acceptedFileTypes: string | null | undefined) {
  const rules = parseAcceptedFileTypes(acceptedFileTypes);

  if (rules.length === 0) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return rules.some((rule) => {
    const normalizedRule = rule.toLowerCase();

    if (normalizedRule === "*" || normalizedRule === "*/*") {
      return true;
    }

    if (normalizedRule.startsWith(".")) {
      return fileName.endsWith(normalizedRule);
    }

    if (normalizedRule.endsWith("/*")) {
      return fileType.startsWith(normalizedRule.slice(0, -1));
    }

    if (normalizedRule.includes("/")) {
      return fileType === normalizedRule;
    }

    return fileName.endsWith(`.${normalizedRule}`);
  });
}

export function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function getFieldBorderClass(showBorders: boolean) {
  return showBorders ? "border" : "";
}

export function getFieldDashedBorderClass(showBorders: boolean) {
  return showBorders ? "border border-dashed" : "";
}

export function getCustomQuestionGridClass() {
  return "grid gap-4";
}

export function getCustomFormGridClass(layoutColumn: number) {
  void layoutColumn;
  return "grid grid-cols-1 gap-4 md:grid-cols-12";
}

export function getCustomFormFieldGridSpanClass(layoutColumn: number) {
  switch (layoutColumn) {
    case 1:
      return "col-span-12";
    case 2:
      return "col-span-12 md:col-span-6";
    case 3:
      return "col-span-12 md:col-span-6 lg:col-span-4";
    case 4:
      return "col-span-12 md:col-span-6 lg:col-span-3";
    default:
      return "col-span-12";
  }
}

export function getCustomFormFieldSpanClass(formLayoutColumn: number, fieldLayoutColumn: number | null) {
  const resolvedLayoutColumn = Math.max(1, Math.min(4, fieldLayoutColumn ?? formLayoutColumn));
  return getCustomFormFieldGridSpanClass(resolvedLayoutColumn);
}

export function getCustomFormMultiSelectDefaultValue(field: MembershipRegistrationCustomFormField) {
  const selectedValues = field.options.filter((option) => option.isDefault).map((option) => option.value);
  if (selectedValues.length > 0) {
    return Array.from(new Set(selectedValues));
  }

  return parseDelimitedValues(field.defaultValue);
}

export function getCustomFormDefaultValue(field: MembershipRegistrationCustomFormField) {
  const controlType = getCustomFormControlType(field.formControlTypeId);

  if (controlType === "checkbox") {
    return field.defaultValue === "true" || field.defaultValue === "1";
  }

  if (controlType === "file") {
    return null;
  }

  if (controlType === "multiselect") {
    return getCustomFormMultiSelectDefaultValue(field);
  }

  if (controlType === "country" || controlType === "state") {
    return field.defaultValue || "";
  }

  if (controlType === "select" || controlType === "radio") {
    return field.options.find((option) => option.isDefault)?.value || field.defaultValue || "";
  }

  return field.defaultValue || "";
}

export function getCustomQuestionMultiSelectDefaultValue(question: MembershipRegistrationCustomQuestion) {
  const selectedValues = question.options.filter((option) => option.isDefault).map((option) => option.value);
  if (selectedValues.length > 0) {
    return Array.from(new Set(selectedValues));
  }

  return parseDelimitedValues(question.defaultValue);
}

export function getCustomQuestionDefaultValue(question: MembershipRegistrationCustomQuestion) {
  const controlType = getCustomQuestionControlType(question.controlType);

  if (controlType === "checkbox") {
    return question.defaultValue === "true" || question.defaultValue === "1";
  }

  if (controlType === "file") {
    return null;
  }

  if (controlType === "multiselect") {
    return getCustomQuestionMultiSelectDefaultValue(question);
  }

  if (controlType === "select" || controlType === "radio") {
    return question.options.find((option) => option.isDefault)?.value || question.defaultValue || "";
  }

  return question.defaultValue || "";
}

export function buildCustomFormValues(customForms: MembershipRegistrationCustomFormSummary[]) {
  return customForms.reduce<CustomFormValues>((accumulator, form) => {
    form.fields.forEach((field) => {
      accumulator[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] = getCustomFormDefaultValue(field);
    });

    return accumulator;
  }, {});
}

export function buildCustomQuestionValues(customQuestions: MembershipRegistrationCustomQuestion[]) {
  return customQuestions.reduce<CustomQuestionValues>((accumulator, question) => {
    accumulator[buildCustomQuestionKey(question.uniqueId)] = getCustomQuestionDefaultValue(question);
    return accumulator;
  }, {});
}
