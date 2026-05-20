import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { MembershipRegisterPageViewModel, MembershipTheme } from "./MembershipRegisterPage.types";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationCustomFormResponse,
  MembershipRegistrationCustomQuestionResponse,
  MembershipRegistrationInfo,
  MembershipRegistrationCustomQuestion,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationPaymentMethodDetail,
  MembershipRegistrationSubmissionPreferences,
  MembershipRegistrationSubmitContext,
} from "../../types/membershipRegistration";
import { resolvePaymentProductId } from "../../lib/membershipRegistration";
import type {
  CustomFormErrors,
  CustomFormValue,
  CustomFormValues,
  CustomQuestionErrors,
  CustomQuestionValue,
  CustomQuestionValues,
  StripeCardPaymentMethodCreator,
} from "./MembershipRegisterWizard.types";
import {
  buildCurrencyPrefix,
  formatFileSize,
  formatStepNumber,
  formatTenureWithExpiryLabel,
  getFieldBorderClass,
  isEnabledFlag,
  isEmailValid,
  isPhoneLikeValue,
  isPricingStepComplete,
  isValidDateValue,
  isValidNumberValue,
  validateYourInformationStep,
} from "./MembershipRegisterWizard.utils";
import {
  buildCustomFormResponses,
  buildCustomFormValues,
  buildCustomQuestionResponses,
  buildCustomQuestionValues,
  getCustomFormControlType,
} from "./MembershipRegisterWizard.logic";
import {
  getFileValidationError,
  validateCustomForms,
  validateCustomQuestionField,
  validateCustomQuestions,
} from "./MembershipRegisterWizard.logic.validation";
import {
  CameraIcon,
  CheckIcon,
  FieldTooltip,
  MembershipDescriptionPanel,
  SectionTitle,
  StepBadge,
  WizardField,
  XMarkIcon,
  renderRenewalDueLabel,
} from "./MembershipRegisterWizard.parts";
import { CustomQuestionsSection as ExtractedCustomQuestionsSection } from "./MembershipRegisterWizard.customQuestions";
import { CustomFormSection as ExtractedCustomFormSection } from "./MembershipRegisterWizard.customForms";
import { YourInformationStep } from "./MembershipRegisterWizard.yourInformationStep";
import { PaymentStep, type PaymentStepProps } from "./MembershipRegisterWizard.paymentStep";

type MembershipRegisterWizardProps = Pick<
  MembershipRegisterPageViewModel,
  | "errors"
  | "form"
  | "isSubmitting"
  | "onSubmit"
  | "setField"
  | "couponValidation"
  | "couponValidationError"
  | "isValidatingCoupon"
  | "isCouponApplied"
  | "onValidateCoupon"
  | "onClearCoupon"
> & {
  info: MembershipRegistrationInfo;
  formattedMembershipCharges: string;
  isFreeMembership: boolean;
  theme: MembershipTheme;
  membershipName: string;
  membershipDescription: string;
  submitError: string;
};

const STEPS = [
  {
    title: "Membership Info",
  },
  {
    title: "Your Information",
    hidden: true,
  },
  {
    title: "Questionnaire",
  },
  {
    title: "Payment",
  },
] as const;

function PricingStep({
  info,
  formattedMembershipCharges,
  theme,
  membershipDescription,
  form,
  setField,
}: {
  info: MembershipRegistrationInfo;
  formattedMembershipCharges: string;
  theme: MembershipTheme;
  membershipDescription: string;
  form: MembershipRegistrationFormState;
  setField: MembershipRegisterPageViewModel["setField"];
}) {
  const tenureInfo = formatTenureWithExpiryLabel(info);
  const currencyPrefix = buildCurrencyPrefix(info);
  const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
  const totalAmountLabel =
    membershipAmount > 0
      ? `${currencyPrefix}${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(membershipAmount)}`
      : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel;

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_7fr] xl:gap-6">
      <MembershipDescriptionPanel
        description={membershipDescription}
        theme={theme}
      />

      <div
        className="space-y-5 rounded-3xl p-4 sm:p-5"
        style={{ background: theme.cardBackground }}
      >
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: theme.titleColor }}
              >
                {info.membershipDetail.name}
              </h1>

              <div
                className="flex flex-wrap items-center gap-2 text-base font-semibold leading-6"
                style={{ color: theme.bodyColor }}
              >
                {info.organizerName ? (
                  <span>
                    by{" "}
                    <span className="font-extrabold uppercase">
                      {info.organizerName}
                    </span>
                  </span>
                ) : null}

                {tenureInfo.expiryLabel ? (
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold leading-5"
                    style={{
                      color: theme.level1,
                      borderColor: theme.level1,
                      background: theme.cardBackground,
                    }}
                  >
                    {renderRenewalDueLabel(tenureInfo.expiryLabel)}
                  </span>
                ) : null}
              </div>
            </div>

            <p
              className="text-base leading-6"
              style={{ color: theme.bodyColor }}
            >
              Review the membership charge before moving ahead.
            </p>
          </div>
          <div
            className="w-full rounded-2xl px-4 py-3 text-center sm:max-w-sm sm:px-5 sm:py-4 lg:ml-auto lg:min-w-56"
            style={{ background: theme.tileBackground }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              Total Payable
            </span>
            <span
              className="mt-2 block text-2xl font-bold sm:text-3xl"
              style={{ color: theme.level1 }}
            >
              {totalAmountLabel}
            </span>
          </div>
        </div>
        <div
          className="h-px w-full"
          style={{ background: theme.tileBorder, opacity: 0.7 }}
        />
        <div>
          <div
            className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4"
            style={{ background: theme.tileBackground }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              Amount
            </p>
            <p
              className="mt-2 text-2xl font-bold sm:text-3xl"
              style={{ color: theme.level1 }}
            >
              {formattedMembershipCharges}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



function QuestionnaireStep({
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
}: {
  customForms: MembershipRegistrationCustomFormSummary[];
  customQuestions: MembershipRegistrationCustomQuestion[];
  values: CustomFormValues;
  errors: CustomFormErrors;
  onFieldChange: (key: string, value: CustomFormValue) => void;
  customQuestionValues: CustomQuestionValues;
  customQuestionErrors: CustomQuestionErrors;
  onCustomQuestionFieldChange: (
    key: string,
    value: CustomQuestionValue,
  ) => void;
  onCustomQuestionFieldBlur: (key: string, value: CustomQuestionValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
}) {
  const hasCustomForms = customForms.length > 0;
  const hasCustomQuestions = customQuestions.length > 0;

  return (
    <>
      <div
        className="space-y-6 rounded-3xl border p-4 sm:p-5"
        style={{
          borderColor: theme.cardBorder,
          background: theme.cardBackground,
          boxShadow: `0 18px 42px -30px ${theme.cardShadow}`,
        }}
      >
        {hasCustomForms ? (
          <div className="space-y-6">
            {customForms.map((form) => (
              <ExtractedCustomFormSection
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
          <ExtractedCustomQuestionsSection
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
          <div
            className="rounded-2xl border border-dashed px-5 py-6 text-sm leading-6"
            style={{
              borderColor: theme.cardBorder,
              background: theme.cardBackground,
              color: theme.bodyColor,
            }}
          >
            No questionnaire content mapped to this membership type.
          </div>
        ) : null}
      </div>
    </>
  );
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
  couponValidation,
  couponValidationError,
  isValidatingCoupon,
  isCouponApplied,
  onValidateCoupon,
  onClearCoupon,
}: MembershipRegisterWizardProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const allowSubmitRef = useRef(false);
  const stripeCardPaymentMethodCreatorRef =
    useRef<StripeCardPaymentMethodCreator | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFillingDummyData, setIsFillingDummyData] = useState(false);
  const [paymentStepError, setPaymentStepError] = useState("");
  const [isCreditCardFieldsComplete, setIsCreditCardFieldsComplete] =
    useState(false);
  const [showCreditCardFieldErrors, setShowCreditCardFieldErrors] =
    useState(false);
  const [logOutgoingPayload, setLogOutgoingPayload] = useState(true);
  const [submitToApi, setSubmitToApi] = useState(true);
  const [userLoginErrors, setUserLoginErrors] = useState<
    Partial<Record<keyof MembershipRegistrationFormState, string>>
  >({});
  const [customFormValues, setCustomFormValues] = useState<CustomFormValues>(
    {},
  );
  const [customFormErrors, setCustomFormErrors] = useState<CustomFormErrors>(
    {},
  );
  const [customQuestionValues, setCustomQuestionValues] =
    useState<CustomQuestionValues>({});
  const [customQuestionErrors, setCustomQuestionErrors] =
    useState<CustomQuestionErrors>({});
  const handleStripeCardPaymentMethodCreatorReady = useCallback(
    (creator: StripeCardPaymentMethodCreator | null) => {
      stripeCardPaymentMethodCreatorRef.current = creator;
      if (creator) {
        setPaymentStepError("");
      }
    },
    [],
  );
  const handleStripeCardFieldsCompleteChange = useCallback(
    (isComplete: boolean) => {
      setIsCreditCardFieldsComplete(isComplete);
      if (isComplete) {
        setPaymentStepError("");
        setShowCreditCardFieldErrors(false);
      }
    },
    [],
  );
  const showBorders = isEnabledFlag(import.meta.env.VITE_SHOW_BORDERS);
  const pricingStepComplete = isPricingStepComplete(form, isFreeMembership);
  const hasQuestionnaireContent = Boolean(
    info &&
    (info.membershipDetail.customForms.length > 0 ||
      info.membershipDetail.customQuestions.length > 0),
  );
  const visibleSteps = [
    STEPS[0],
    STEPS[1],
    ...(hasQuestionnaireContent ? [STEPS[2]] : []),
    STEPS[3],
  ] as const;
  const questionnaireStepComplete = info
    ? Object.keys(
        validateCustomForms(
          info.membershipDetail.customForms,
          customFormValues,
        ),
      ).length === 0 &&
      Object.keys(
        validateCustomQuestions(
          info.membershipDetail.customQuestions,
          customQuestionValues,
        ),
      ).length === 0
    : true;

  useEffect(() => {
    if (!info) {
      setCustomFormValues({});
      setCustomFormErrors({});
      setCustomQuestionValues({});
      setCustomQuestionErrors({});
      return;
    }

    setCustomFormValues(
      buildCustomFormValues(info.membershipDetail.customForms),
    );
    setCustomFormErrors({});
    setCustomQuestionValues(
      buildCustomQuestionValues(info.membershipDetail.customQuestions),
    );
    setCustomQuestionErrors({});
  }, [info]);

  useEffect(() => {
    setPaymentStepError("");
  }, [form.paymentMethod]);

  useEffect(() => {
    setShowCreditCardFieldErrors(false);
  }, [form.paymentMethod]);

  useEffect(() => {
    setCurrentStep((value) => Math.min(value, visibleSteps.length - 1));
  }, [visibleSteps.length]);

  const canGoNext = currentStep === 0 ? pricingStepComplete : true;
  const userInformationStepComplete =
    Object.keys(validateYourInformationStep(form)).length === 0;

  const stepTitles = visibleSteps.map((step, index) => ({
    ...step,
    active: index === currentStep,
    completed: index < currentStep,
    disabled:
      index > currentStep ||
      (index === 1 && !pricingStepComplete) ||
      (hasQuestionnaireContent &&
        index === 2 &&
        (!pricingStepComplete || !userInformationStepComplete)) ||
      (index === visibleSteps.length - 1 &&
        (!pricingStepComplete ||
          !userInformationStepComplete ||
          (hasQuestionnaireContent && !questionnaireStepComplete))),
  }));

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
      const nextErrors = validateCustomForms(
        info.membershipDetail.customForms,
        customFormValues,
      );
      const nextQuestionErrors = validateCustomQuestions(
        info.membershipDetail.customQuestions,
        customQuestionValues,
      );
      setCustomFormErrors(nextErrors);
      setCustomQuestionErrors(nextQuestionErrors);

      if (
        Object.keys(nextErrors).length > 0 ||
        Object.keys(nextQuestionErrors).length > 0
      ) {
        return;
      }
    }

    setCurrentStep((value) => Math.min(value + 1, visibleSteps.length - 1));
  }

  function handleBack() {
    setCurrentStep((value) => Math.max(value - 1, 0));
  }

  function handleUserLoginFieldChange<
    T extends keyof MembershipRegistrationFormState,
  >(field: T, value: MembershipRegistrationFormState[T]) {
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
    const form = info.membershipDetail.customForms.find(
      (candidate) => candidate.uniqueId === formUniqueId,
    );
    const field =
      form?.fields.find((candidate) => candidate.uniqueId === fieldUniqueId) ??
      null;

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

  function handleCustomQuestionFieldChange(
    key: string,
    value: CustomQuestionValue,
  ) {
    setCustomQuestionValues((current) => ({
      ...current,
      [key]: value,
    }));

    if (!info) {
      return;
    }

    const question = info.membershipDetail.customQuestions.find(
      (candidate) => candidate.uniqueId === key,
    );
    if (!question) {
      return;
    }

    const nextError = validateCustomQuestionField(question, value);
    setCustomQuestionErrors((current) => ({
      ...current,
      [key]: nextError,
    }));
  }

  function handleCustomQuestionFieldBlur(
    key: string,
    value: CustomQuestionValue,
  ) {
    if (!info) {
      return;
    }

    const question = info.membershipDetail.customQuestions.find(
      (candidate) => candidate.uniqueId === key,
    );
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
      className="w-full max-w-7xl space-y-6"
      onSubmit={async (event) => {
        if (!allowSubmitRef.current) {
          event.preventDefault();
          return;
        }

        allowSubmitRef.current = false;
        event.preventDefault();
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement) {
          activeElement.blur();
        }

        if (currentStep < visibleSteps.length - 1) {
          return;
        }

        if (info) {
          const nextErrors = validateCustomForms(
            info.membershipDetail.customForms,
            customFormValues,
          );
          const nextQuestionErrors = validateCustomQuestions(
            info.membershipDetail.customQuestions,
            customQuestionValues,
          );
          setCustomFormErrors(nextErrors);
          setCustomQuestionErrors(nextQuestionErrors);

          if (
            Object.keys(nextErrors).length > 0 ||
            Object.keys(nextQuestionErrors).length > 0
          ) {
            event.preventDefault();
            return;
          }
        }

        const selectedPaymentProduct =
          info.paymentSettings.paymentProducts.find((product) => {
            const productId = resolvePaymentProductId(product.name);
            return productId
              ? String(productId) === form.paymentMethod.trim()
              : false;
          });

        const cardPaymentMethodCreator =
          stripeCardPaymentMethodCreatorRef.current;
        let paymentMethodDetail: MembershipRegistrationPaymentMethodDetail | null =
          null;

        if (selectedPaymentProduct?.name === "CreditCard") {
          if (!isCreditCardFieldsComplete) {
            setPaymentStepError(
              "Complete the credit card fields before submitting.",
            );
            setShowCreditCardFieldErrors(true);
            return;
          }

          if (!cardPaymentMethodCreator) {
            setPaymentStepError(
              "Card payment fields are not ready yet. Please wait and try again.",
            );
            return;
          }

          const cardHolderName =
            `${form.firstName.trim()} ${form.lastName.trim()}`.trim() ||
            form.email.trim();

          try {
            const paymentMethod =
              await cardPaymentMethodCreator(cardHolderName);
            paymentMethodDetail = {
              paymentMethodId: paymentMethod.id,
              cardHolderName,
            };
          } catch (error) {
            setPaymentStepError(
              error instanceof Error
                ? error.message
                : "Unable to create the card payment method.",
            );
            return;
          }
        }

        setPaymentStepError("");

        const submissionContext: MembershipRegistrationSubmitContext = {
          paymentMethodDetail,
          customFormResponses: buildCustomFormResponses(
            info.membershipDetail.customForms,
            customFormValues,
          ),
          customQuestionResponses: buildCustomQuestionResponses(
            info.membershipDetail.customQuestions,
            customQuestionValues,
          ),
          submissionPreferences: {
            logToConsole: logOutgoingPayload,
            submitToApi,
          } satisfies MembershipRegistrationSubmissionPreferences,
          couponUniqueId: isCouponApplied && couponValidation ? couponValidation.couponUniqueId : null,
          discountType: isCouponApplied && couponValidation ? couponValidation.discountType : null,
          discountAmount: isCouponApplied && couponValidation ? couponValidation.discountAmount : null,
        };

        await onSubmit(event, submissionContext);
      }}
    >
      {paymentStepError || submitError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800 shadow-sm">
          {paymentStepError || submitError}
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl overflow-x-auto pb-2">
        <div
          className="relative z-10 flex min-w-full flex-nowrap gap-3 rounded-[1.75rem] border p-2.5 shadow-sm sm:min-w-max sm:gap-4 sm:p-3"
          style={{
            borderColor: theme.cardBorder,
            background: theme.cardBackground,
            boxShadow: `0 18px 42px -34px ${theme.cardShadow}`,
          }}
        >
          {stepTitles.map((step, index) => (
            <StepBadge
              key={step.title}
              index={index}
              title={step.title}
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
        className="mx-auto w-full max-w-6xl rounded-[2rem] border p-4 shadow-sm sm:p-5 lg:p-7"
        style={{
          borderColor: theme.cardBorder,
          background: theme.cardBackground,
          boxShadow: `0 24px 60px -42px ${theme.cardShadow}`,
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
          />
        ) : currentStep === 1 ? (
          <YourInformationStep
            form={form}
            errors={userLoginErrors}
            setField={handleUserLoginFieldChange}
            theme={theme}
            showBorders={showBorders}
          />
        ) : hasQuestionnaireContent && currentStep === 2 ? (
          <QuestionnaireStep
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
          <PaymentStep
            info={info}
            form={form}
            paymentMethodError={errors.paymentMethod}
            isCreditCardFieldsComplete={isCreditCardFieldsComplete}
            showCreditCardFieldErrors={showCreditCardFieldErrors}
            onStripeCardPaymentMethodCreatorReady={
              handleStripeCardPaymentMethodCreatorReady
            }
            onStripeCardFieldsCompleteChange={
              handleStripeCardFieldsCompleteChange
            }
            setField={setField}
            theme={theme}
            couponValidation={couponValidation}
            couponValidationError={couponValidationError}
            isValidatingCoupon={isValidatingCoupon}
            isCouponApplied={isCouponApplied}
            onValidateCoupon={onValidateCoupon}
            onClearCoupon={onClearCoupon}
            isSubmitting={isSubmitting}
            isLastStep={currentStep === visibleSteps.length - 1}
          />
        )}
      </section>

      <div
        className="mt-6 h-px w-full"
        style={{ background: theme.cardBorder, opacity: 0.7 }}
      />

      {currentStep === visibleSteps.length - 1 ? (
        <div
          className="mt-6 rounded-3xl border p-4 sm:p-5"
          style={{
            borderColor: theme.cardBorder,
            background: theme.cardBackground,
          }}
        >
          <div className="mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              Submit options
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className="flex items-start gap-3 rounded-2xl border px-4 py-3 transition hover:bg-black/5"
              style={{ borderColor: theme.cardBorder }}
            >
              <input
                type="checkbox"
                checked={logOutgoingPayload}
                onChange={(event) =>
                  setLogOutgoingPayload(event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-cyan-600"
                style={{ accentColor: theme.level1 }}
              />
              <span className="space-y-1">
                <span
                  className="block text-sm font-semibold"
                  style={{ color: theme.titleColor }}
                >
                  Log on console
                </span>
                <span
                  className="block text-xs leading-5"
                  style={{ color: theme.tileLabelColor }}
                >
                  Print the outgoing payload to the browser console for review.
                </span>
              </span>
            </label>

            <label
              className="flex items-start gap-3 rounded-2xl border px-4 py-3 transition hover:bg-black/5"
              style={{ borderColor: theme.cardBorder }}
            >
              <input
                type="checkbox"
                checked={submitToApi}
                onChange={(event) => setSubmitToApi(event.target.checked)}
                className="mt-1 h-4 w-4 accent-cyan-600"
                style={{ accentColor: theme.level1 }}
              />
              <span className="space-y-1">
                <span
                  className="block text-sm font-semibold"
                  style={{ color: theme.titleColor }}
                >
                  Submit to API
                </span>
                <span
                  className="block text-xs leading-5"
                  style={{ color: theme.tileLabelColor }}
                >
                  Send the registration payload to the backend endpoint.
                </span>
              </span>
            </label>
          </div>
        </div>
      ) : null}

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
              setShowCreditCardFieldErrors(true);
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

