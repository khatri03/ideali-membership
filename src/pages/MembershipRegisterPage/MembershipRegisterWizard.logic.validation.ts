import type {
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationCustomQuestion,
} from "../../types/membershipRegistration";
import type {
  CustomFormErrors,
  CustomFormValue,
  CustomFormValues,
  CustomQuestionErrors,
  CustomQuestionValue,
  CustomQuestionValues,
} from "./MembershipRegisterWizard.types";
import {
  isEmailValid,
  isPhoneLikeValue,
  isValidDateValue,
  isValidNumberValue,
} from "./MembershipRegisterWizard.utils";
import {
  buildCustomFormFieldKey,
  buildCustomQuestionKey,
  getCustomFormControlType,
  getCustomQuestionControlType,
  toSentenceCase,
} from "./MembershipRegisterWizard.logic";

export function parseAcceptedFileTypes(acceptedFileTypes: string | null | undefined) {
  return (acceptedFileTypes ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isFileTypeAccepted(
  file: File,
  acceptedFileTypes: string | null | undefined,
) {
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

export function formatAcceptedFileTypes(acceptedFileTypes: string | null | undefined) {
  const rules = parseAcceptedFileTypes(acceptedFileTypes);
  return rules.length > 0 ? rules.join(", ") : "";
}

export function getFileValidationError(
  field: MembershipRegistrationCustomFormField,
  value: CustomFormValue,
) {
  const requiredMessage =
    field.requiredMessage?.trim() ||
    `${toSentenceCase(field.controlLabel)} is required.`;

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

function getCustomQuestionFileValidationError(
  question: MembershipRegistrationCustomQuestion,
  value: CustomQuestionValue,
) {
  const requiredMessage =
    question.requiredMessage?.trim() ||
    `${toSentenceCase(question.label)} is required.`;

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

export function validateCustomFormField(
  field: MembershipRegistrationCustomFormField,
  value: CustomFormValue,
) {
  const controlType = getCustomFormControlType(field.formControlTypeId);
  const textValue = typeof value === "string" ? value.trim() : "";
  const normalizedString = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : [];
  const requiredMessage =
    field.requiredMessage?.trim() ||
    `${toSentenceCase(field.controlLabel)} is required.`;

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
      const allowedValues = new Set(
        field.options.map((option) => option.value),
      );
      if (selectedValues.some((item) => !allowedValues.has(item))) {
        return "Select a valid option.";
      }
    }

    return "";
  }

  if (controlType === "country") {
    if (field.isMandatory && !textValue) {
      return requiredMessage;
    }

    return "";
  }

  if (controlType === "state") {
    if (field.isMandatory && !textValue) {
      return requiredMessage;
    }

    return "";
  }

  if (controlType === "email" && textValue) {
    if (!isEmailValid(textValue)) {
      return "Enter a valid email address.";
    }
  }

  if (controlType === "phone" && textValue) {
    if (!isPhoneLikeValue(textValue)) {
      return "Enter a valid phone number.";
    }
  }

  if (controlType === "number" && textValue) {
    if (!isValidNumberValue(textValue)) {
      return "Enter a valid number.";
    }
  }

  if (controlType === "date" && textValue) {
    if (!isValidDateValue(textValue)) {
      return "Enter a valid date.";
    }
  }

  if (
    (controlType === "select" || controlType === "radio") &&
    field.options.length > 0 &&
    textValue
  ) {
    const isValidOption = field.options.some(
      (option) => option.value === normalizedString,
    );
    if (!isValidOption) {
      return "Select a valid option.";
    }
  }

  if (field.isMandatory && !textValue) {
    return requiredMessage;
  }

  if (
    field.minLength != null &&
    textValue.length > 0 &&
    textValue.length < field.minLength
  ) {
    return `Minimum ${field.minLength} characters required.`;
  }

  if (field.maxLength != null && textValue.length > field.maxLength) {
    return `Maximum ${field.maxLength} characters allowed.`;
  }

  return "";
}

export function validateCustomQuestionField(
  question: MembershipRegistrationCustomQuestion,
  value: CustomQuestionValue,
) {
  const controlType = getCustomQuestionControlType(question.controlType);
  const textValue = typeof value === "string" ? value.trim() : "";
  const normalizedString = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : [];
  const requiredMessage =
    question.requiredMessage?.trim() ||
    `${toSentenceCase(question.label)} is required.`;

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
      const allowedValues = new Set(
        question.options.map((option) => option.value),
      );
      if (selectedValues.some((item) => !allowedValues.has(item))) {
        return "Select a valid option.";
      }
    }

    return "";
  }

  if (controlType === "email" && textValue) {
    if (!isEmailValid(textValue)) {
      return "Enter a valid email address.";
    }
  }

  if (controlType === "phone" && textValue) {
    if (!isPhoneLikeValue(textValue)) {
      return "Enter a valid phone number.";
    }
  }

  if (controlType === "number" && textValue) {
    if (!isValidNumberValue(textValue)) {
      return "Enter a valid number.";
    }
  }

  if (controlType === "date" && textValue) {
    if (!isValidDateValue(textValue)) {
      return "Enter a valid date.";
    }
  }

  if (
    (controlType === "select" || controlType === "radio") &&
    question.options.length > 0 &&
    textValue
  ) {
    const isValidOption = question.options.some(
      (option) => option.value === normalizedString,
    );
    if (!isValidOption) {
      return "Select a valid option.";
    }
  }

  if (question.required && !textValue) {
    return requiredMessage;
  }

  if (
    question.minLength != null &&
    textValue.length > 0 &&
    textValue.length < Number(question.minLength)
  ) {
    return `Minimum ${question.minLength} characters required.`;
  }

  if (
    question.maxLength != null &&
    textValue.length > Number(question.maxLength)
  ) {
    return `Maximum ${question.maxLength} characters allowed.`;
  }

  return "";
}

export function validateCustomForms(
  customForms: MembershipRegistrationCustomFormSummary[],
  values: CustomFormValues,
) {
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
