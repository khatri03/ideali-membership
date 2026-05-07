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

export function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPhoneLikeValue(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidDateValue(value: string) {
  if (!value.trim()) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function isValidNumberValue(value: string) {
  if (!value.trim()) {
    return false;
  }

  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

export function getFileValidationError(field: MembershipRegistrationCustomFormField, value: CustomFormValue) {
  const requiredMessage = field.requiredMessage?.trim() || `${toSentenceCase(field.controlLabel)} is required.`;

  if (!value) {
    return field.isMandatory ? requiredMessage : "";
  }

  if (!(value instanceof File)) {
    return "";
  }

  if (!isFileTypeAccepted(value, field.acceptedFileTypes)) {
    return "Select a valid file.";
  }

  return "";
}

export function getCustomQuestionFileValidationError(
  question: MembershipRegistrationCustomQuestion,
  value: CustomQuestionValue,
) {
  const requiredMessage = question.requiredMessage?.trim() || `${toSentenceCase(question.label)} is required.`;

  if (!value) {
    return question.required ? requiredMessage : "";
  }

  if (!(value instanceof File)) {
    return "";
  }

  if (!isFileTypeAccepted(value, question.acceptedFileTypes)) {
    return "Select a valid file.";
  }

  return "";
}

export function validateCustomFormField(field: MembershipRegistrationCustomFormField, value: CustomFormValue) {
  const controlType = getCustomFormControlType(field.formControlTypeId);
  const textValue = typeof value === "string" ? value.trim() : "";
  const normalizedString = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];
  const requiredMessage = field.requiredMessage?.trim() || `${toSentenceCase(field.controlLabel)} is required.`;

  if (controlType === "checkbox") {
    if (field.isMandatory && value !== true) {
      return requiredMessage;
    }

    return "";
  }

  if (controlType === "file") {
    return getFileValidationError(field, value);
  }

  if (controlType === "multiselect") {
    if (field.isMandatory && selectedValues.length === 0) {
      return requiredMessage;
    }

    if (selectedValues.length > 0 && field.options.length > 0) {
      const allowedValues = new Set(field.options.map((option) => option.value));
      if (selectedValues.some((item) => !allowedValues.has(item))) {
        return "Select a valid option.";
      }
    }

    return "";
  }

  if ((controlType === "country" || controlType === "state") && field.isMandatory && !textValue) {
    return requiredMessage;
  }

  if ((controlType === "select" || controlType === "radio") && field.options.length > 0 && textValue) {
    const isValidOption = field.options.some((option) => option.value === normalizedString);
    if (!isValidOption) {
      return "Select a valid option.";
    }
  }

  if (controlType === "email" && textValue && !isEmailValid(textValue)) {
    return "Enter a valid email address.";
  }

  if (controlType === "phone" && textValue && !isPhoneLikeValue(textValue)) {
    return "Enter a valid phone number.";
  }

  if (controlType === "number" && textValue && !isValidNumberValue(textValue)) {
    return "Enter a valid number.";
  }

  if (controlType === "date" && textValue && !isValidDateValue(textValue)) {
    return "Enter a valid date.";
  }

  if (field.isMandatory && !textValue) {
    return requiredMessage;
  }

  if (field.minLength != null && textValue.length > 0 && textValue.length < field.minLength) {
    return `Minimum ${field.minLength} characters required.`;
  }

  if (field.maxLength != null && textValue.length > field.maxLength) {
    return `Maximum ${field.maxLength} characters allowed.`;
  }

  return "";
}

export function validateCustomQuestionField(question: MembershipRegistrationCustomQuestion, value: CustomQuestionValue) {
  const controlType = getCustomQuestionControlType(question.controlType);
  const textValue = typeof value === "string" ? value.trim() : "";
  const normalizedString = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];
  const requiredMessage = question.requiredMessage?.trim() || `${toSentenceCase(question.label)} is required.`;

  if (controlType === "checkbox") {
    if (question.required && value !== true) {
      return requiredMessage;
    }

    return "";
  }

  if (controlType === "file") {
    return getCustomQuestionFileValidationError(question, value);
  }

  if (controlType === "multiselect") {
    if (question.required && selectedValues.length === 0) {
      return requiredMessage;
    }

    if (selectedValues.length > 0 && question.options.length > 0) {
      const allowedValues = new Set(question.options.map((option) => option.value));
      if (selectedValues.some((item) => !allowedValues.has(item))) {
        return "Select a valid option.";
      }
    }

    return "";
  }

  if ((controlType === "select" || controlType === "radio") && question.options.length > 0 && textValue) {
    const isValidOption = question.options.some((option) => option.value === normalizedString);
    if (!isValidOption) {
      return "Select a valid option.";
    }
  }

  if (controlType === "email" && textValue && !isEmailValid(textValue)) {
    return "Enter a valid email address.";
  }

  if (controlType === "phone" && textValue && !isPhoneLikeValue(textValue)) {
    return "Enter a valid phone number.";
  }

  if (controlType === "number" && textValue && !isValidNumberValue(textValue)) {
    return "Enter a valid number.";
  }

  if (controlType === "date" && textValue && !isValidDateValue(textValue)) {
    return "Enter a valid date.";
  }

  if (question.required && !textValue) {
    return requiredMessage;
  }

  if (question.minLength != null && textValue.length > 0 && textValue.length < Number(question.minLength)) {
    return `Minimum ${question.minLength} characters required.`;
  }

  if (question.maxLength != null && textValue.length > Number(question.maxLength)) {
    return `Maximum ${question.maxLength} characters allowed.`;
  }

  return "";
}

export function validateCustomForms(customForms: MembershipRegistrationCustomFormSummary[], values: CustomFormValues) {
  const errors: CustomFormErrors = {};

  customForms.forEach((form) => {
    form.fields.forEach((field) => {
      const key = buildCustomFormFieldKey(form.uniqueId, field.uniqueId);
      const error = validateCustomFormField(field, values[key] ?? "");
      if (error) {
        errors[key] = error;
      }
    });
  });

  return errors;
}

export function validateCustomQuestions(
  customQuestions: MembershipRegistrationCustomQuestion[],
  values: CustomQuestionValues,
) {
  const errors: CustomQuestionErrors = {};

  customQuestions.forEach((question) => {
    const key = buildCustomQuestionKey(question.uniqueId);
    const error = validateCustomQuestionField(question, values[key] ?? "");
    if (error) {
      errors[key] = error;
    }
  });

  return errors;
}

export function getNearestCountryQuestionValue(
  questions: MembershipRegistrationCustomQuestion[],
  values: CustomQuestionValues,
  targetIndex: number,
) {
  for (let index = targetIndex - 1; index >= 0; index -= 1) {
    const candidate = questions[index];
    if (!candidate) {
      continue;
    }
    if (getCustomQuestionControlType(candidate.controlType) !== "country") {
      continue;
    }
    const candidateValue = values[buildCustomQuestionKey(candidate.uniqueId)];
    return typeof candidateValue === "string" && candidateValue.trim().length > 0 ? candidateValue : null;
  }

  return null;
}

export function getFirstOptionValue(options: Array<{ label: string; value: string }>) {
  return options.find((option) => option.value.trim())?.value || "";
}

export function createDummyAvatarFile() {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">',
    '<rect width="320" height="320" rx="160" fill="#0ea5e9"/>',
    '<circle cx="160" cy="120" r="52" fill="#ffffff" fill-opacity="0.96"/>',
    '<path d="M78 268c18-46 58-72 82-72s64 26 82 72" fill="#ffffff" fill-opacity="0.96"/>',
    '<text x="160" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a">AV</text>',
    "</svg>",
  ].join("");

  return new File([svg], "dummy-avatar.svg", { type: "image/svg+xml" });
}

export function createDummyTextFile(fileName: string, content: string, mimeType = "text/plain") {
  return new File([content], fileName, { type: mimeType });
}

export function toDummyFileName(label: string, extension: string) {
  const baseName =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dummy";
  return `${baseName}.${extension}`;
}

export function createDummyFileForAcceptedTypes(acceptedFileTypes: string | null | undefined, label: string) {
  const rules = parseAcceptedFileTypes(acceptedFileTypes).map((rule) => rule.toLowerCase());

  if (
    rules.some(
      (rule) =>
        rule === "*" ||
        rule === "*/*" ||
        rule.startsWith("image/") ||
        rule === "image/*" ||
        rule.endsWith(".png") ||
        rule.endsWith(".jpg") ||
        rule.endsWith(".jpeg") ||
        rule.endsWith(".webp") ||
        rule.endsWith(".gif") ||
        rule.endsWith(".svg"),
    )
  ) {
    return createDummyAvatarFile();
  }

  if (rules.some((rule) => rule === "application/pdf" || rule.endsWith(".pdf"))) {
    return createDummyTextFile(
      toDummyFileName(label, "pdf"),
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF",
      "application/pdf",
    );
  }

  if (rules.some((rule) => rule === "text/plain" || rule.endsWith(".txt"))) {
    return createDummyTextFile(toDummyFileName(label, "txt"), "Dummy file content");
  }

  if (rules.some((rule) => rule.endsWith(".csv") || rule === "text/csv")) {
    return createDummyTextFile(toDummyFileName(label, "csv"), "header\nvalue", "text/csv");
  }

  return createDummyTextFile(toDummyFileName(label, "txt"), "Dummy file content");
}

export function buildDummyValueForControlType(
  controlType: string,
  label: string,
  options: Array<{ label: string; value: string }> = [],
  acceptedFileTypes: string | null | undefined = null,
  countryValue = "",
  stateValue = "",
) {
  switch (controlType) {
    case "checkbox":
      return true;
    case "multiselect":
      return options
        .filter((option) => option.value.trim())
        .slice(0, 2)
        .map((option) => option.value);
    case "select":
    case "radio":
      return getFirstOptionValue(options);
    case "country":
      return countryValue;
    case "state":
      return stateValue;
    case "file":
      return createDummyFileForAcceptedTypes(acceptedFileTypes, label);
    case "email":
      return `demo.${label.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "user"}@example.com`;
    case "phone":
      return "(555) 123-4567";
    case "password":
      return "Password123!";
    case "number":
      return "123";
    case "date":
      return "2026-01-01";
    case "textarea":
      return `Sample ${label || "text"}`;
    default:
      return `Sample ${label || "value"}`;
  }
}
