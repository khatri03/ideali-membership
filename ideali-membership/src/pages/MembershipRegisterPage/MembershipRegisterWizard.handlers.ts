import type { MembershipRegistrationFormState, MembershipRegistrationInfo } from "../../types/membershipRegistration";
import type { CustomFormErrors, CustomFormValue, CustomFormValues, CustomQuestionErrors, CustomQuestionValue, CustomQuestionValues } from "./MembershipRegisterWizard.questionnaire.helpers";
import { getCustomFormControlType } from "./MembershipRegisterWizard.questionnaire.helpers";
import { getFileValidationError, validateCustomForms, validateCustomQuestionField, validateCustomQuestions } from "./MembershipRegisterWizard.questionnaire.runtime";
import { validateYourInformationStep } from "./MembershipRegisterWizard.helpers";
import type { Dispatch, SetStateAction } from "react";

type BuildMembershipRegisterHandlersArgs = {
  currentStep: number;
  form: MembershipRegistrationFormState;
  info: MembershipRegistrationInfo | null;
  pricingStepComplete: boolean;
  hasQuestionnaireContent: boolean;
  customFormValues: CustomFormValues;
  customQuestionValues: CustomQuestionValues;
  visibleStepCount: number;
  setField: <T extends keyof MembershipRegistrationFormState>(field: T, value: MembershipRegistrationFormState[T]) => void;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setUserLoginErrors: Dispatch<SetStateAction<Partial<Record<keyof MembershipRegistrationFormState, string>>>>;
  setCustomFormValues: Dispatch<SetStateAction<CustomFormValues>>;
  setCustomFormErrors: Dispatch<SetStateAction<CustomFormErrors>>;
  setCustomQuestionValues: Dispatch<SetStateAction<CustomQuestionValues>>;
  setCustomQuestionErrors: Dispatch<SetStateAction<CustomQuestionErrors>>;
};

export function buildMembershipRegisterHandlers({
  currentStep,
  form,
  info,
  pricingStepComplete,
  hasQuestionnaireContent,
  customFormValues,
  customQuestionValues,
  visibleStepCount,
  setField,
  setCurrentStep,
  setUserLoginErrors,
  setCustomFormValues,
  setCustomFormErrors,
  setCustomQuestionValues,
  setCustomQuestionErrors,
}: BuildMembershipRegisterHandlersArgs) {
  function handleNext() {
    if (currentStep === 0 && !pricingStepComplete) {
      return;
    }

    if (currentStep === 1) {
      const nextErrors = validateYourInformationStep(form);
      setUserLoginErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        return;
      }
    }

    if (hasQuestionnaireContent && currentStep === 2 && info) {
      const nextErrors = validateCustomForms(info.membershipDetail.customForms, customFormValues);
      const nextQuestionErrors = validateCustomQuestions(info.membershipDetail.customQuestions, customQuestionValues);
      setCustomFormErrors(nextErrors);
      setCustomQuestionErrors(nextQuestionErrors);

      if (Object.keys(nextErrors).length > 0 || Object.keys(nextQuestionErrors).length > 0) {
        return;
      }
    }

    setCurrentStep((value) => Math.min(value + 1, visibleStepCount - 1));
  }

  function handleBack() {
    setCurrentStep((value) => Math.max(value - 1, 0));
  }

  function handleUserLoginFieldChange<T extends keyof MembershipRegistrationFormState>(
    field: T,
    value: MembershipRegistrationFormState[T],
  ) {
    setField(field, value);
    setUserLoginErrors((current) => ({
      ...current,
      [field]: "",
    }));
  }

  function handleCustomFormFieldChange(key: string, value: CustomFormValue) {
    setCustomFormValues((current) => ({
      ...current,
      [key]: value,
    }));

    if (!info) {
      return;
    }

    const separatorIndex = key.indexOf(":");
    if (separatorIndex < 0) {
      setCustomFormErrors((current) => ({
        ...current,
        [key]: "",
      }));
      return;
    }

    const formUniqueId = key.slice(0, separatorIndex);
    const fieldUniqueId = key.slice(separatorIndex + 1);
    const form = info.membershipDetail.customForms.find((candidate) => candidate.uniqueId === formUniqueId);
    const field = form?.fields.find((candidate) => candidate.uniqueId === fieldUniqueId) ?? null;

    if (field && getCustomFormControlType(field.formControlTypeId) === "file") {
      const nextError = getFileValidationError(field, value);
      setCustomFormErrors((current) => ({
        ...current,
        [key]: nextError,
      }));
      return;
    }

    setCustomFormErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function handleCustomQuestionFieldChange(key: string, value: CustomQuestionValue) {
    setCustomQuestionValues((current) => ({
      ...current,
      [key]: value,
    }));

    if (!info) {
      return;
    }

    const question = info.membershipDetail.customQuestions.find((candidate) => candidate.uniqueId === key);
    if (!question) {
      return;
    }

    const nextError = validateCustomQuestionField(question, value);
    setCustomQuestionErrors((current) => ({
      ...current,
      [key]: nextError,
    }));
  }

  function handleCustomQuestionFieldBlur(key: string, value: CustomQuestionValue) {
    if (!info) {
      return;
    }

    const question = info.membershipDetail.customQuestions.find((candidate) => candidate.uniqueId === key);
    if (!question) {
      return;
    }

    const nextError = validateCustomQuestionField(question, value);
    setCustomQuestionErrors((current) => ({
      ...current,
      [key]: nextError,
    }));
  }

  return {
    handleNext,
    handleBack,
    handleUserLoginFieldChange,
    handleCustomFormFieldChange,
    handleCustomQuestionFieldChange,
    handleCustomQuestionFieldBlur,
  };
}
