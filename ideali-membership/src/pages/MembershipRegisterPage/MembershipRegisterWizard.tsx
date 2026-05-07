import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from "react";
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import { MEMBERSHIP_WIZARD_STEPS as STEPS } from "../../components/wizard/membershipWizardSteps";
import { PaymentStep as PaymentStepView } from "./MembershipRegisterWizardPaymentStep";
import {
  buildCustomFormFieldKey,
  buildCustomFormValues,
  buildCustomQuestionKey,
  buildCustomQuestionValues,
  type CustomFormErrors,
  type CustomFormValues,
  type CustomQuestionErrors,
  type CustomQuestionValues,
} from "./MembershipRegisterWizard.questionnaire.helpers";
import {
  getNearestCountryQuestionValue,
  validateCustomForms,
  validateCustomQuestions,
} from "./MembershipRegisterWizard.questionnaire.runtime";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationStripeCredentials,
} from "../../types/membershipRegistration";
import { fetchStripePublicCredentials, resolvePaymentProductId } from "../../lib/membershipRegistration";
import { MembershipTheme, StepBadge } from "./MembershipRegisterWizard.shared";
import { PricingStep } from "./MembershipRegisterWizard.pricing";
import { YourInformationStep as YourInformationStepView } from "./MembershipRegisterWizard.personalInfo";
import { QuestionnaireStep as QuestionnaireStepView } from "./MembershipRegisterWizard.questionnaire";
import { buildMembershipRegisterHandlers } from "./MembershipRegisterWizard.handlers";
import {
  buildCurrencyPrefix,
  getFieldBorderClass,
  getFieldDashedBorderClass,
  isEnabledFlag,
  isLifetimeTenure,
  isPricingStepComplete,
  loadImageElement,
  formatDonationAmountInput,
  formatFileSize,
  formatMonthDayLabel,
  formatRenewalDueLabel,
  formatShortExpiryLabel,
  formatTenureLabel,
  formatTenureWithExpiryLabel,
  normalizeDonationAmountInput,
  parseDonationAmount,
  renderRenewalDueLabel,
  isEmailValid,
  isPhoneLikeValue,
  isValidDateValue,
  isValidNumberValue,
  toDummyFileName,
  validateUserLoginStep,
  validateYourInformationStep,
} from "./MembershipRegisterWizard.helpers";
import { ProfilePhotoField } from "./MembershipRegisterWizard.profilePhoto";
import { buildMembershipRegisterDummyData } from "./MembershipRegisterWizard.dummy";

interface MembershipRegisterWizardProps {
  info: MembershipRegistrationInfo;
  form: MembershipRegistrationFormState;
  errors: Partial<Record<keyof MembershipRegistrationFormState, string>>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setField: <T extends keyof MembershipRegistrationFormState>(field: T, value: MembershipRegistrationFormState[T]) => void;
  formattedMembershipCharges: string;
  isFreeMembership: boolean;
  theme: MembershipTheme;
  membershipName: string;
  membershipDescription: string;
  submitError: string;
}

export function MembershipRegisterWizard({
  info,
  form,
  errors,
  isSubmitting,
  onSubmit,
  setField,
  formattedMembershipCharges,
  isFreeMembership,
  theme,
  membershipName,
  membershipDescription,
  submitError,
}: MembershipRegisterWizardProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const allowSubmitRef = useRef(false);
  const hasAutoFilledDummyDataRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isFillingDummyData, setIsFillingDummyData] = useState(false);
  const [userLoginErrors, setUserLoginErrors] = useState<Partial<Record<keyof MembershipRegistrationFormState, string>>>(
    {},
  );
  const [customFormValues, setCustomFormValues] = useState<CustomFormValues>({});
  const [customFormErrors, setCustomFormErrors] = useState<CustomFormErrors>({});
  const [customQuestionValues, setCustomQuestionValues] = useState<CustomQuestionValues>({});
  const [customQuestionErrors, setCustomQuestionErrors] = useState<CustomQuestionErrors>({});
  const showBorders = isEnabledFlag(import.meta.env.VITE_SHOW_BORDERS);
  const pricingStepComplete = isPricingStepComplete(form, isFreeMembership);
  const hasQuestionnaireContent = Boolean(
    info && (info.membershipDetail.customForms.length > 0 || info.membershipDetail.customQuestions.length > 0),
  );
  const visibleSteps = [
    STEPS[0],
    STEPS[1],
    ...(hasQuestionnaireContent ? [STEPS[2]] : []),
    STEPS[3],
  ] as const;
  const questionnaireStepComplete = info
    ? Object.keys(validateCustomForms(info.membershipDetail.customForms, customFormValues)).length === 0 &&
      Object.keys(validateCustomQuestions(info.membershipDetail.customQuestions, customQuestionValues)).length === 0
    : true;

  useEffect(() => {
    if (!info) {
      setCustomFormValues({});
      setCustomFormErrors({});
      setCustomQuestionValues({});
      setCustomQuestionErrors({});
      return;
    }

    setCustomFormValues(buildCustomFormValues(info.membershipDetail.customForms));
    setCustomFormErrors({});
    setCustomQuestionValues(buildCustomQuestionValues(info.membershipDetail.customQuestions));
    setCustomQuestionErrors({});
  }, [info]);

  useEffect(() => {
    setCurrentStep((value) => Math.min(value, visibleSteps.length - 1));
  }, [visibleSteps.length]);

  const canGoNext = currentStep === 0 ? pricingStepComplete : true;
  const userInformationStepComplete = Object.keys(validateYourInformationStep(form)).length === 0;
  const {
    handleNext,
    handleBack,
    handleUserLoginFieldChange,
    handleCustomFormFieldChange,
    handleCustomQuestionFieldChange,
    handleCustomQuestionFieldBlur,
  } = buildMembershipRegisterHandlers({
    currentStep,
    form,
    info,
    pricingStepComplete,
    hasQuestionnaireContent,
    customFormValues,
    customQuestionValues,
    visibleStepCount: visibleSteps.length,
    setField,
    setCurrentStep,
    setUserLoginErrors,
    setCustomFormValues,
    setCustomFormErrors,
    setCustomQuestionValues,
    setCustomQuestionErrors,
  });

  const stepTitles = visibleSteps.map((step, index) => ({
    ...step,
    active: index === currentStep,
    completed: index < currentStep,
    disabled:
      index > currentStep ||
      (index === 1 && !pricingStepComplete) ||
      (hasQuestionnaireContent && index === 2 && (!pricingStepComplete || !userInformationStepComplete)) ||
    (index === visibleSteps.length - 1 &&
        (!pricingStepComplete ||
          !userInformationStepComplete ||
          (hasQuestionnaireContent && !questionnaireStepComplete))),
  }));

  useEffect(() => {
    if (!import.meta.env.DEV || !info || currentStep !== 1 || hasAutoFilledDummyDataRef.current) {
      return;
    }

    hasAutoFilledDummyDataRef.current = true;
    setIsFillingDummyData(true);

    void buildMembershipRegisterDummyData({
      info,
      isFreeMembership,
      setField,
      setCustomFormValues,
      setCustomFormErrors,
      setCustomQuestionValues,
      setCustomQuestionErrors,
      setUserLoginErrors,
      setCurrentStep,
      visibleStepCount: visibleSteps.length,
      hasQuestionnaireContent,
    }).finally(() => {
      setIsFillingDummyData(false);
    });
  }, [currentStep, hasQuestionnaireContent, info, isFreeMembership, setField, visibleSteps.length]);

    return (
      <form
        ref={formRef}
        className="w-full max-w-400 space-y-6"
        onSubmit={(event) => {
          if (!allowSubmitRef.current) {
            event.preventDefault();
            return;
          }

          allowSubmitRef.current = false;

          if (currentStep < visibleSteps.length - 1) {
            event.preventDefault();
            return;
          }

          if (info) {
            const nextErrors = validateCustomForms(info.membershipDetail.customForms, customFormValues);
            const nextQuestionErrors = validateCustomQuestions(info.membershipDetail.customQuestions, customQuestionValues);
            setCustomFormErrors(nextErrors);
            setCustomQuestionErrors(nextQuestionErrors);

            if (Object.keys(nextErrors).length > 0 || Object.keys(nextQuestionErrors).length > 0) {
              event.preventDefault();
              return;
            }
          }

          void onSubmit(event);
        }}
      >
      {submitError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800 shadow-sm">
          {submitError}
        </div>
      ) : null}

      <div className="relative -mx-4 overflow-x-auto pb-2 px-4 sm:mx-0 sm:px-0">
        <div className="relative z-10 flex min-w-full flex-nowrap gap-3 sm:min-w-max sm:gap-4">
          {stepTitles.map((step, index) => (
            <StepBadge
              key={step.label ?? String(index)}
              index={index}
              title={step.label ?? "Step"}
              active={step.active}
              completed={step.completed}
              disabled={step.disabled}
              onClick={() => {
                if (!step.disabled) {
                  setCurrentStep(index);
                }
              }}
              theme={theme}
            />
          ))}
        </div>
      </div>
      <section
        className="rounded-4xl p-4 sm:p-5 lg:p-6"
        style={{
          background: theme.cardBackground,
        }}
      >
        {currentStep === 0 ? (
          <PricingStep
            info={info}
            formattedMembershipCharges={formattedMembershipCharges}
            theme={theme}
            membershipDescription={membershipDescription}
            form={form}
            setField={setField}
            formatDonationAmountInput={formatDonationAmountInput}
            normalizeDonationAmountInput={normalizeDonationAmountInput}
          />
        ) : currentStep === 1 ? (
          <YourInformationStepView
            form={form}
            errors={userLoginErrors}
            setField={handleUserLoginFieldChange}
            theme={theme}
            showBorders={showBorders}
          />
        ) : hasQuestionnaireContent && currentStep === 2 ? (
          <QuestionnaireStepView
            customForms={info.membershipDetail.customForms}
            customQuestions={info.membershipDetail.customQuestions}
            values={customFormValues}
            errors={customFormErrors}
            onFieldChange={handleCustomFormFieldChange}
            customQuestionValues={customQuestionValues}
            customQuestionErrors={customQuestionErrors}
            onCustomQuestionFieldChange={handleCustomQuestionFieldChange}
            onCustomQuestionFieldBlur={handleCustomQuestionFieldBlur}
            theme={theme}
            showBorders={showBorders}
          />
        ) : (
          <PaymentStepView
            info={info}
            form={form}
            paymentMethodError={errors.paymentMethod}
            setField={setField}
            theme={theme}
            currencyPrefix={buildCurrencyPrefix(info)}
            membershipAmount={Number(info.membershipDetail.membershipCharges ?? 0)}
            priceFreeLabel={MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel}
            parseDonationAmount={parseDonationAmount}
            formatDonationAmountInput={formatDonationAmountInput}
            normalizeDonationAmountInput={normalizeDonationAmountInput}
          />
        )}
      </section>

        <div className="mt-6 h-px w-full" style={{ background: theme.cardBorder, opacity: 0.7 }} />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-2xl border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              >
                Back
              </button>
            ) : null}
          </div>

          {currentStep < visibleSteps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              style={{ background: theme.level1 }}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                allowSubmitRef.current = true;
                formRef.current?.requestSubmit();
              }}
              className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              style={{ background: theme.level1 }}
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          )}
        </div>
    </form>
  );
}



