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
  getCustomFormControlType,
  getCustomQuestionControlType,
  getFileValidationError,
  type CustomFormErrors,
  type CustomFormValue,
  type CustomFormValues,
  type CustomQuestionErrors,
  type CustomQuestionValue,
  type CustomQuestionValues,
  validateCustomForms,
  validateCustomQuestionField,
  validateCustomQuestions,
} from "./MembershipRegisterWizard.questionnaire.helpers";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationStripeCredentials,
} from "../../types/membershipRegistration";
import { fetchCountryOptions, fetchStateOptions } from "../../lib/customForms";
import {
  fetchAddressTypeOptions,
  fetchContactPrefixOptions,
  fetchStripePublicCredentials,
  resolvePaymentProductId,
} from "../../lib/membershipRegistration";
import { MembershipTheme, StepBadge } from "./MembershipRegisterWizard.shared";
import { PricingStep } from "./MembershipRegisterWizard.pricing";
import { YourInformationStep as YourInformationStepView } from "./MembershipRegisterWizard.personalInfo";
import { QuestionnaireStep as QuestionnaireStepView } from "./MembershipRegisterWizard.questionnaire";
import {
  buildDummyValueForControlType,
  buildCurrencyPrefix,
  createDummyAvatarFile,
  createDummyFileForAcceptedTypes,
  createDummyTextFile,
  getFirstOptionValue,
  getFieldBorderClass,
  getFieldDashedBorderClass,
  isEnabledFlag,
  isEmailValid,
  isLifetimeTenure,
  isPhoneLikeValue,
  isPricingStepComplete,
  isValidDateValue,
  isValidNumberValue,
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
  toDummyFileName,
  validateUserLoginStep,
  validateYourInformationStep,
} from "./MembershipRegisterWizard.helpers";
import { ProfilePhotoField } from "./MembershipRegisterWizard.profilePhoto";

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

  async function fillDummyData() {
    if (!info || isFillingDummyData) {
      return;
    }

    setIsFillingDummyData(true);

    try {
      const [nextPrefixOptions, nextAddressTypeOptions, nextCountryOptions] = await Promise.all([
        fetchContactPrefixOptions(),
        fetchAddressTypeOptions(),
        fetchCountryOptions(),
      ]);

      const nextCountryValue = getFirstOptionValue(nextCountryOptions);
      const nextStateOptions = nextCountryValue ? await fetchStateOptions(nextCountryValue) : [];
      const nextStateValue = getFirstOptionValue(nextStateOptions);
      const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
      const presetTips = info.presetTips ?? [];
      const seedDonationAmount = isFreeMembership ? 0 : 25;

      setField("profilePhotoFile", createDummyAvatarFile());
      setField("prefix", getFirstOptionValue(nextPrefixOptions));
      setField("firstName", "John");
      setField("middleName", "A");
      setField("lastName", "Doe");
      setField("email", "john.doe@example.com");
      setField("password", "Password123!");
      setField("confirmPassword", "Password123!");
      setField("cellPhone", "(555) 123-4567");
      setField("addressType", getFirstOptionValue(nextAddressTypeOptions));
      setField("countryId", nextCountryValue);
      setField("stateId", nextStateValue);
      setField("streetLine1", "123 Main Street");
      setField("streetLine2", "Suite 200");
      setField("zipCode", "10001");
      setField("cityName", "Sample City");
      setField("donationAmount", seedDonationAmount > 0 ? seedDonationAmount.toFixed(2) : "");
      const firstPresetTip = presetTips[0];
      setField("tipPresetPercent", firstPresetTip ? String(firstPresetTip.percent) : "");
      setField(
        "tipAmount",
        firstPresetTip ? (((membershipAmount + seedDonationAmount) * firstPresetTip.percent) / 100).toFixed(2) : "",
      );
      setField("notes", "Filled by the dummy data helper.");

      if (hasQuestionnaireContent) {
        const nextCustomFormValues = info.membershipDetail.customForms.reduce<CustomFormValues>((accumulator, form) => {
          const fields = [...form.fields].sort((left, right) => left.displayOrder - right.displayOrder);

          fields.forEach((field) => {
            const controlType = getCustomFormControlType(field.formControlTypeId);
            const key = buildCustomFormFieldKey(form.uniqueId, field.uniqueId);
            accumulator[key] = buildDummyValueForControlType(
              controlType,
              field.controlLabel,
              field.options.map((option) => ({ label: option.displayText, value: option.value })),
              field.acceptedFileTypes,
              nextCountryValue,
              nextStateValue,
            );
          });

          return accumulator;
        }, {});

        const nextCustomQuestionValues = info.membershipDetail.customQuestions.reduce<CustomQuestionValues>(
          (accumulator, question) => {
            const controlType = getCustomQuestionControlType(question.controlType);
            accumulator[buildCustomQuestionKey(question.uniqueId)] = buildDummyValueForControlType(
              controlType,
              question.label,
              question.options.map((option) => ({ label: option.displayText, value: option.value })),
              question.acceptedFileTypes,
              nextCountryValue,
              nextStateValue,
            );
            return accumulator;
          },
          {},
        );

        setCustomFormValues(nextCustomFormValues);
        setCustomQuestionValues(nextCustomQuestionValues);
        setCustomFormErrors({});
        setCustomQuestionErrors({});
      }

      setUserLoginErrors({});
      setCurrentStep(visibleSteps.length - 1);
    } finally {
      setIsFillingDummyData(false);
    }
  }

  useEffect(() => {
    if (!import.meta.env.DEV || !info || currentStep !== 1 || hasAutoFilledDummyDataRef.current) {
      return;
    }

    hasAutoFilledDummyDataRef.current = true;
    void fillDummyData();
  }, [currentStep, fillDummyData, info]);

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

    setCurrentStep((value) => Math.min(value + 1, visibleSteps.length - 1));
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



