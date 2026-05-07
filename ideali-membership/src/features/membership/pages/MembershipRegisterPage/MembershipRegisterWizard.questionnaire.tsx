import type {
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationCustomQuestion,
} from "../../../../types/membershipRegistration";
import { MembershipTheme } from "./MembershipRegisterWizard.shared";
import {
  type CustomFormErrors,
  type CustomFormValue,
  type CustomFormValues,
  type CustomQuestionErrors,
  type CustomQuestionValue,
  type CustomQuestionValues,
} from "./MembershipRegisterWizard.questionnaire.helpers";
import { CustomFormSection, CustomQuestionsSection } from "./MembershipRegisterWizard.questionnaire.fields";

type QuestionnaireStepProps = {
  customForms: MembershipRegistrationCustomFormSummary[];
  customQuestions: MembershipRegistrationCustomQuestion[];
  values: CustomFormValues;
  errors: CustomFormErrors;
  onFieldChange: (key: string, value: CustomFormValue) => void;
  customQuestionValues: CustomQuestionValues;
  customQuestionErrors: CustomQuestionErrors;
  onCustomQuestionFieldChange: (key: string, value: CustomQuestionValue) => void;
  onCustomQuestionFieldBlur: (key: string, value: CustomQuestionValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
};

export function QuestionnaireStep({
  customForms,
  customQuestions,
  values,
  errors,
  onFieldChange,
  customQuestionValues,
  customQuestionErrors,
  onCustomQuestionFieldChange,
  onCustomQuestionFieldBlur,
  theme,
  showBorders,
}: QuestionnaireStepProps) {
  const hasCustomForms = customForms.length > 0;
  const hasCustomQuestions = customQuestions.length > 0;

  return (
    <>
      {hasCustomForms ? (
        <div className="space-y-5">
          {customForms.map((form) => (
            <CustomFormSection
              key={form.uniqueId}
              form={form}
              values={values}
              errors={errors}
              onFieldChange={onFieldChange}
              theme={theme}
              showBorders={showBorders}
            />
          ))}
        </div>
      ) : null}

      {hasCustomQuestions ? (
        <CustomQuestionsSection
          questions={customQuestions}
          values={customQuestionValues}
          errors={customQuestionErrors}
          onFieldChange={onCustomQuestionFieldChange}
          onFieldBlur={onCustomQuestionFieldBlur}
          theme={theme}
          showBorders={showBorders}
        />
      ) : null}

      {!hasCustomForms && !hasCustomQuestions ? (
        <div className="rounded-3xl border border-dashed px-4 py-5 text-sm" style={{ borderColor: theme.cardBorder, color: theme.bodyColor }}>
          No questionnaire content mapped to this membership type.
        </div>
      ) : null}
    </>
  );
}

