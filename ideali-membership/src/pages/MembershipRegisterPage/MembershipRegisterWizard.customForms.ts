import type {
  MembershipRegistrationInfo,
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomFormResponse,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationCustomQuestion,
  MembershipRegistrationCustomQuestionResponse,
} from "../../types/membershipRegistration";
import type {
  CustomFormErrors,
  CustomFormValue,
  CustomFormValues,
  CustomQuestionErrors,
  CustomQuestionValue,
  CustomQuestionValues,
} from "./MembershipRegisterWizard.types";
import { isEmailValid, isPhoneLikeValue, isValidDateValue, isValidNumberValue } from "./MembershipRegisterWizard.utils";

export function serializeCustomValue(value: CustomFormValue | undefined): string {
  if (value instanceof File) {
    return value.name;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => serializeCustomValue(item)));
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

export function buildCustomFormFieldKey(formUniqueId: string, fieldUniqueId: string) {
  return `${formUniqueId}:${fieldUniqueId}`;
}

export function buildCustomQuestionKey(questionUniqueId: string) {
  return questionUniqueId;
}

export function buildCustomFormResponses(
  customForms: MembershipRegistrationInfo["membershipDetail"]["customForms"],
  values: CustomFormValues,
): MembershipRegistrationCustomFormResponse[] {
  return customForms.flatMap((form) =>
    form.fields
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((field) => {
        const value =
          values[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] ?? null;
        const fieldId = field.id;

        return {
          fieldId,
          value: serializeCustomValue(value),
        };
      })
      .filter((response) => response.fieldId > 0 && response.value !== ""),
  );
}

export function buildCustomQuestionResponses(
  customQuestions: MembershipRegistrationInfo["membershipDetail"]["customQuestions"],
  values: CustomQuestionValues,
): MembershipRegistrationCustomQuestionResponse[] {
  return customQuestions
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((question) => {
      const rawValue = values[buildCustomQuestionKey(question.uniqueId)] ?? null;
      const serializedValue = serializeCustomValue(rawValue);
      const matchedOption =
        typeof rawValue === "string"
          ? (question.options.find(
              (option) =>
                option.uniqueId === rawValue || option.value === rawValue,
            ) ?? null)
          : null;

      return {
        questionUniqueId: question.uniqueId,
        optionUniqueId: matchedOption?.uniqueId ?? null,
        fileStorageId: null,
        value: serializedValue || null,
      };
    })
    .filter(
      (response) => response.value !== null || response.optionUniqueId !== null,
    );
}

export function getCustomFormControlType(controlTypeId: number): string {
  switch (controlTypeId) {
    case 1: return "text";
    case 2: return "email";
    case 3: return "number";
    case 4: return "date";
    case 5: return "select";
    case 6: return "checkbox";
    case 7: return "radio";
    case 8: return "textarea";
    case 9: return "file";
    case 10: return "password";
    case 14: return "phone";
    case 15: return "multiselect";
    case 16: return "country";
    case 17: return "state";
    default: return "text";
  }
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

export function getCustomFormMultiSelectDefaultValue(
  field: MembershipRegistrationCustomFormField,
) {
  const selectedValues = field.options
    .filter((option) => option.isDefault)
    .map((option) => option.value);
  if (selectedValues.length > 0) {
    return Array.from(new Set(selectedValues));
  }

  return parseDelimitedValues(field.defaultValue);
}

export function getCustomFormDefaultValue(
  field: MembershipRegistrationCustomFormField,
) {
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

  if (controlType === "country") {
    return field.defaultValue || "";
  }

  if (controlType === "state") {
    return field.defaultValue || "";
  }

  if (controlType === "select" || controlType === "radio") {
    const selectedOption =
      field.options.find((option) => option.isDefault)?.value ||
      field.defaultValue ||
      "";
    return selectedOption;
  }

  return field.defaultValue || "";
}

export function getCustomQuestionControlType(controlType: string) {
  return controlType.trim().toLowerCase();
}

export function getCustomQuestionMultiSelectDefaultValue(
  question: MembershipRegistrationCustomQuestion,
) {
  const selectedValues = question.options
    .filter((option) => option.isDefault)
    .map((option) => option.value);
  if (selectedValues.length > 0) {
    return Array.from(new Set(selectedValues));
  }

  return parseDelimitedValues(question.defaultValue);
}

export function getCustomQuestionDefaultValue(
  question: MembershipRegistrationCustomQuestion,
) {
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
    const selectedOption =
      question.options.find((option) => option.isDefault)?.value ||
      question.defaultValue ||
      "";
    return selectedOption;
  }

  return question.defaultValue || "";
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

export function getCustomQuestionFileValidationError(
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

export function buildCustomFormValues(
  customForms: MembershipRegistrationCustomFormSummary[],
) {
  return customForms.reduce<CustomFormValues>((accumulator, form) => {
    form.fields.forEach((field) => {
      accumulator[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] =
        getCustomFormDefaultValue(field);
    });

    return accumulator;
  }, {});
}

export function buildCustomQuestionValues(
  customQuestions: MembershipRegistrationCustomQuestion[],
) {
  return customQuestions.reduce<CustomQuestionValues>(
    (accumulator, question) => {
      accumulator[buildCustomQuestionKey(question.uniqueId)] =
        getCustomQuestionDefaultValue(question);
      return accumulator;
    },
    {},
  );
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
      const allowedValues = new Set(field.options.map((option) => option.value));
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
      const allowedValues = new Set(question.options.map((option) => option.value));
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
    return typeof candidateValue === "string" &&
      candidateValue.trim().length > 0
      ? candidateValue
      : null;
  }

  return null;
}
