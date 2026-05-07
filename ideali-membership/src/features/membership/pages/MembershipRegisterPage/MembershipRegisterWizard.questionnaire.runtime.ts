import type {
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationCustomQuestion,
} from "../../../../types/membershipRegistration";
import { buildCustomFormFieldKey, buildCustomQuestionKey, getCustomQuestionControlType } from "./MembershipRegisterWizard.questionnaire.helpers";

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

function getFirstOptionValue(options: Array<{ label: string; value: string }>) {
  return options.find((option) => option.value.trim())?.value || "";
}

export function getNearestCountryQuestionValue(
  questions: MembershipRegistrationCustomQuestion[],
  values: Record<string, string | string[] | boolean | File | null>,
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

export function getFileValidationError(field: MembershipRegistrationCustomFormField, value: string | string[] | boolean | File | null) {
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
  value: string | string[] | boolean | File | null,
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

function parseAcceptedFileTypes(acceptedFileTypes: string | null | undefined) {
  return (acceptedFileTypes ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isFileTypeAccepted(file: File, acceptedFileTypes: string | null | undefined) {
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

function toSentenceCase(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return "Field";
  }

  const normalized = trimmed.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function validateCustomFormField(field: MembershipRegistrationCustomFormField, value: string | string[] | boolean | File | null) {
  const controlType = field.formControlTypeId;
  const textValue = typeof value === "string" ? value.trim() : "";
  const normalizedString = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];
  const requiredMessage = field.requiredMessage?.trim() || `${toSentenceCase(field.controlLabel)} is required.`;

  if (controlType === 6) {
    if (field.isMandatory && value !== true) {
      return requiredMessage;
    }

    return "";
  }

  if (controlType === 9) {
    return getFileValidationError(field, value);
  }

  if (controlType === 15) {
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

  if ((controlType === 16 || controlType === 17) && field.isMandatory && !textValue) {
    return requiredMessage;
  }

  if ((controlType === 5 || controlType === 7) && field.options.length > 0 && textValue) {
    const isValidOption = field.options.some((option) => option.value === normalizedString);
    if (!isValidOption) {
      return "Select a valid option.";
    }
  }

  if (controlType === 2 && textValue && !isEmailValid(textValue)) {
    return "Enter a valid email address.";
  }

  if (controlType === 14 && textValue && !isPhoneLikeValue(textValue)) {
    return "Enter a valid phone number.";
  }

  if (controlType === 3 && textValue && !isValidNumberValue(textValue)) {
    return "Enter a valid number.";
  }

  if (controlType === 4 && textValue && !isValidDateValue(textValue)) {
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

export function validateCustomQuestionField(
  question: MembershipRegistrationCustomQuestion,
  value: string | string[] | boolean | File | null,
) {
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

export function validateCustomForms(customForms: MembershipRegistrationCustomFormSummary[], values: Record<string, string | string[] | boolean | File | null>) {
  const errors: Record<string, string> = {};

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
  values: Record<string, string | string[] | boolean | File | null>,
) {
  const errors: Record<string, string> = {};

  customQuestions.forEach((question) => {
    const key = buildCustomQuestionKey(question.uniqueId);
    const error = validateCustomQuestionField(question, values[key] ?? "");
    if (error) {
      errors[key] = error;
    }
  });

  return errors;
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

