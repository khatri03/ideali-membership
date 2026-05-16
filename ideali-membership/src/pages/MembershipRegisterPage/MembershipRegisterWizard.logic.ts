import type {
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomFormResponse,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationCustomQuestion,
  MembershipRegistrationCustomQuestionResponse,
  MembershipRegistrationInfo,
} from "../../types/membershipRegistration";
import type {
  CustomFormValue,
  CustomFormValues,
  CustomQuestionValues,
} from "./MembershipRegisterWizard.types";

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
          values[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] ??
          null;
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
      const rawValue =
        values[buildCustomQuestionKey(question.uniqueId)] ?? null;
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

export function getCustomQuestionGridClass() {
  return "grid gap-4";
}

export function getCustomFormGridClass() {
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

export function getCustomFormFieldSpanClass(
  formLayoutColumn: number,
  fieldLayoutColumn: number | null,
) {
  const resolvedLayoutColumn = Math.max(
    1,
    Math.min(4, fieldLayoutColumn ?? formLayoutColumn),
  );
  const span = resolvedLayoutColumn;
  return getCustomFormFieldGridSpanClass(span);
}
