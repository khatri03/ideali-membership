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
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { MembershipRegisterPageViewModel, MembershipTheme } from "./MembershipRegisterPage.types";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationCustomFormResponse,
  MembershipRegistrationCustomQuestionResponse,
  MembershipRegistrationInfo,
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomQuestion,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationPaymentMethodDetail,
  MembershipRegistrationSubmissionPreferences,
  MembershipRegistrationStripeCredentials,
  MembershipRegistrationSubmitContext,
  DiscountCouponValidationResult,
} from "../../types/membershipRegistration";
import { CountrySelectInput } from "../../components/inputs/CountrySelectInput/CountrySelectInput";
import { MultiSelectInput } from "../../components/inputs/MultiSelectInput/MultiSelectInput";
import { StateSelectInput } from "../../components/inputs/StateSelectInput/StateSelectInput";
import { PhoneInput } from "../../components/inputs/PhoneInput/PhoneInput";
import { PasswordInput } from "../../components/inputs/PasswordInput/PasswordInput";
import { fetchCountryOptions, fetchStateOptions } from "../../lib/customForms";
import {
  fetchAddressTypeOptions,
  fetchContactPrefixOptions,
  fetchStripePublicCredentials,
  resolvePaymentProductId,
} from "../../lib/membershipRegistration";
import { ProfilePhotoField } from "./components/ProfilePhotoField";
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
  formatAmountInput,
  formatFileSize,
  formatStepNumber,
  formatTenureWithExpiryLabel,
  getFieldBorderClass,
  getFieldDashedBorderClass,
  isEnabledFlag,
  isEmailValid,
  isPhoneLikeValue,
  isPricingStepComplete,
  isValidDateValue,
  isValidNumberValue,
  normalizeAmountInput,
  parseTipAmount,
  validateYourInformationStep,
} from "./MembershipRegisterWizard.utils";
import {
  buildCustomFormFieldKey,
  buildCustomFormResponses,
  buildCustomFormValues,
  buildCustomQuestionKey,
  buildCustomQuestionResponses,
  buildCustomQuestionValues,
  formatAcceptedFileTypes,
  getCustomFormControlType,
  getCustomFormDefaultValue,
  getCustomFormMultiSelectDefaultValue,
  getCustomQuestionControlType,
  getCustomQuestionDefaultValue,
  getCustomQuestionFileValidationError,
  getCustomQuestionGridClass,
  getCustomQuestionMultiSelectDefaultValue,
  getFileValidationError,
  getNearestCountryQuestionValue,
  isFileTypeAccepted,
  parseAcceptedFileTypes,
  parseDelimitedValues,
  serializeCustomValue,
  toSentenceCase,
  validateCustomFormField,
  validateCustomForms,
  validateCustomQuestionField,
  validateCustomQuestions,
} from "./MembershipRegisterWizard.logic";
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

function getCustomFormGridClass(layoutColumn: number) {
  void layoutColumn;
  return "grid grid-cols-1 gap-4 md:grid-cols-12";
}

function getCustomFormFieldGridSpanClass(layoutColumn: number) {
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

function getCustomFormFieldSpanClass(
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

function CustomFormFieldCard({
  field,
  value,
  error,
  onChange,
  countryId,
  theme,
  showBorders,
  formLayoutColumn,
}: {
  field: MembershipRegistrationCustomFormField;
  value: CustomFormValue;
  error: string;
  onChange: (value: CustomFormValue) => void;
  countryId?: string | null;
  theme: MembershipTheme;
  showBorders: boolean;
  formLayoutColumn: number;
}) {
  const controlType = getCustomFormControlType(field.formControlTypeId);
  const label = field.placeHolder || field.controlLabel;
  const defaultOptionValue = typeof value === "string" ? value : "";
  const multiSelectValue = Array.isArray(value) ? value : [];
  const checkboxValue = typeof value === "boolean" ? value : false;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const selectedFile = value instanceof File ? value : null;
  const controlBorderClass = getFieldBorderClass(showBorders);
  const dashedBorderClass = getFieldDashedBorderClass(showBorders);
  const tooltipText = field.tooltip?.trim() || "";
  const spanClass = getCustomFormFieldSpanClass(
    formLayoutColumn,
    field.layoutColumn,
  );

  return (
    <div
      className={`group relative space-y-3 rounded-2xl p-4 sm:p-5 ${controlBorderClass} ${spanClass}`.trim()}
      style={{
        borderColor: theme.cardBorder,
        background: theme.tileBackground,
      }}
      title={tooltipText || undefined}
    >
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <p
            className="text-sm font-semibold"
            style={{ color: theme.tileValueColor }}
          >
            {field.controlLabel}
            {field.isMandatory ? (
              <span className="ml-1 text-rose-600">*</span>
            ) : null}
          </p>
          {tooltipText ? (
            <FieldTooltip text={tooltipText} theme={theme} />
          ) : null}
        </div>
      </div>

      {controlType === "textarea" ? (
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "select" && field.options.length > 0 ? (
        <select
          value={defaultOptionValue}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        >
          <option value="">{label || "Select one"}</option>
          {field.options.map((option) => (
            <option key={option.uniqueId || option.value} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      ) : controlType === "multiselect" ? (
        <MultiSelectInput
          value={multiSelectValue}
          onChange={onChange}
          options={field.options.map((option) => ({
            label: option.displayText,
            value: option.value,
          }))}
          placeholder={label || "Select one or more"}
        />
      ) : controlType === "country" ? (
        <CountrySelectInput
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={label || "Select country"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "state" ? (
        <StateSelectInput
          countryId={countryId}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={label || "Select state"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "radio" && field.options.length > 0 ? (
        <div className="space-y-2">
          {field.options.map((option) => (
            <label
              key={option.uniqueId || option.value}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-black/5"
              style={{ color: theme.titleColor }}
            >
              <input
                type="radio"
                name={`custom-form-${field.uniqueId}`}
                checked={defaultOptionValue === option.value}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-cyan-600"
                style={{ accentColor: theme.level1 }}
              />
              <span className="text-sm font-medium">{option.displayText}</span>
            </label>
          ))}
        </div>
      ) : controlType === "country" ? (
        <CountrySelectInput
          value={typeof value === "string" ? value : ""}
          onChange={(nextValue) => onChange(nextValue)}
          placeholder={label || "Select country"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "state" ? (
        <StateSelectInput
          countryId={countryId}
          value={typeof value === "string" ? value : ""}
          onChange={(nextValue) => onChange(nextValue)}
          placeholder={label || "Select state"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "checkbox" ? (
        <label className="inline-flex items-center gap-3">
          <input
            type="checkbox"
            checked={checkboxValue}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-cyan-600"
          />
          <span
            className="text-sm font-medium"
            style={{ color: theme.titleColor }}
          >
            {field.controlLabel}
          </span>
        </label>
      ) : controlType === "file" ? (
        <div
          className="space-y-3"
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            onChange(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={field.acceptedFileTypes || undefined}
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition hover:shadow-sm sm:px-5 ${dashedBorderClass}`.trim()}
            style={{
              borderColor: isDragging ? theme.level1 : theme.cardBorder,
              background: isDragging ? theme.level3 : theme.cardBackground,
            }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: theme.level3,
                color: theme.level1,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6 fill-current"
              >
                <path d="M12 2.5a6.5 6.5 0 0 0-4.6 11.1l.1.1h-1a4.9 4.9 0 0 0 0 9.8h11a4.9 4.9 0 0 0 0-9.8h-1l.1-.1A6.5 6.5 0 0 0 12 2.5Zm0 2a4.5 4.5 0 0 1 3.2 7.7l-.8.8V9.2a1 1 0 1 0-2 0V13l-1.3-1.3a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0l3-3a1 1 0 1 0-1.4-1.4L15 13V9.2l.8-.8A4.5 4.5 0 0 1 12 4.5Z" />
              </svg>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p
                className="text-sm font-semibold"
                style={{ color: theme.tileValueColor }}
              >
                {selectedFile?.name || "Drop a file here or browse"}
              </p>
              <p
                className="text-xs leading-5"
                style={{ color: theme.bodyColor }}
              >
                Drag and drop a file here, or click to choose one from your
                device.
              </p>
            </div>
          </button>

          {selectedFile ? (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${controlBorderClass}`.trim()}
              style={{
                borderColor: theme.cardBorder,
                background: theme.cardBackground,
              }}
            >
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-semibold"
                  style={{ color: theme.titleColor }}
                >
                  {selectedFile.name}
                </p>
                <p className="text-xs" style={{ color: theme.bodyColor }}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(null)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${controlBorderClass}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                  background: theme.level3,
                }}
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : controlType === "number" ? (
        <input
          type="number"
          inputMode="numeric"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          min={0}
          step="1"
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "date" ? (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "phone" ? (
        <PhoneInput
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={label || "(555) 123-4567"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "password" ? (
        <input
          type="password"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "email" ? (
        <input
          type="email"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      )}

      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}

function CustomFormSection({
  form,
  values,
  errors,
  onFieldChange,
  theme,
  showBorders,
}: {
  form: MembershipRegistrationCustomFormSummary;
  values: CustomFormValues;
  errors: CustomFormErrors;
  onFieldChange: (key: string, value: CustomFormValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
}) {
  const displayTitle = form.headerText || form.name;
  const displayDescription = form.description || "";
  const layoutColumn = form.layoutColumn || 2;
  const fields = [...(form.fields || [])].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );

  function getNearestCountryValue(
    targetField: MembershipRegistrationCustomFormField,
  ) {
    const countryField = fields
      .filter((candidate) => candidate.displayOrder < targetField.displayOrder)
      .filter(
        (candidate) =>
          getCustomFormControlType(candidate.formControlTypeId) === "country",
      )
      .pop();

    if (!countryField) {
      return null;
    }

    const countryValue =
      values[buildCustomFormFieldKey(form.uniqueId, countryField.uniqueId)];
    return typeof countryValue === "string" && countryValue.trim().length > 0
      ? countryValue
      : null;
  }

  function handleFieldChange(
    targetField: MembershipRegistrationCustomFormField,
    nextValue: CustomFormValue,
  ) {
    const key = buildCustomFormFieldKey(form.uniqueId, targetField.uniqueId);
    onFieldChange(key, nextValue);

    if (getCustomFormControlType(targetField.formControlTypeId) !== "country") {
      return;
    }

    fields.forEach((candidate) => {
      if (candidate.displayOrder <= targetField.displayOrder) {
        return;
      }

      if (getCustomFormControlType(candidate.formControlTypeId) === "state") {
        onFieldChange(
          buildCustomFormFieldKey(form.uniqueId, candidate.uniqueId),
          "",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3
          className="text-xl font-bold tracking-tight"
          style={{ color: theme.titleColor }}
        >
          {displayTitle}
        </h3>
        {displayDescription ? (
          <p className="text-sm leading-6" style={{ color: theme.bodyColor }}>
            {displayDescription}
          </p>
        ) : null}
      </div>

      {fields.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-4 py-5 text-sm"
          style={{ borderColor: theme.cardBorder, color: theme.bodyColor }}
        >
          This custom form does not contain any fields.
        </div>
      ) : (
        <div className={getCustomFormGridClass(layoutColumn)}>
          {fields.map((field) => (
            <CustomFormFieldCard
              key={field.uniqueId || `${field.formId}-${field.displayOrder}`}
              field={field}
              value={
                values[
                  buildCustomFormFieldKey(form.uniqueId, field.uniqueId)
                ] ?? ""
              }
              error={
                errors[
                  buildCustomFormFieldKey(form.uniqueId, field.uniqueId)
                ] ?? ""
              }
              onChange={(nextValue) => handleFieldChange(field, nextValue)}
              countryId={getNearestCountryValue(field)}
              theme={theme}
              showBorders={showBorders}
              formLayoutColumn={layoutColumn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

function YourInformationStep({
  form,
  errors,
  setField,
  theme,
  showBorders,
}: {
  form: MembershipRegistrationFormState;
  errors: Partial<Record<keyof MembershipRegistrationFormState, string>>;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
  showBorders: boolean;
}) {
  const [prefixOptions, setPrefixOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [isLoadingPrefixOptions, setIsLoadingPrefixOptions] = useState(false);
  const [addressTypeOptions, setAddressTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [isLoadingAddressTypeOptions, setIsLoadingAddressTypeOptions] =
    useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPrefixOptions(true);

    void fetchContactPrefixOptions()
      .then((options) => {
        if (isMounted) {
          setPrefixOptions(options);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPrefixOptions([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPrefixOptions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingAddressTypeOptions(true);

    void fetchAddressTypeOptions()
      .then((options) => {
        if (isMounted) {
          setAddressTypeOptions(options);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAddressTypeOptions([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAddressTypeOptions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <SectionTitle
            title="User Login"
            description="Use these details to sign in after registration."
            theme={theme}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <WizardField
              label="Email"
              theme={theme}
              error={errors.email}
              required
            >
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="name@example.com"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
              <WizardField
                label="Password"
                theme={theme}
                error={errors.password}
                required
              >
                <PasswordInput
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder="Create password"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField
                label="Confirm Password"
                theme={theme}
                error={errors.confirmPassword}
                required
              >
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setField("confirmPassword", event.target.value)
                  }
                  placeholder="Confirm password"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>
            </div>
          </div>
        </div>

        <div
          className="my-6 w-full border-t border-solid"
          style={{ borderColor: theme.cardBorder }}
          aria-hidden="true"
        />

        <div className="space-y-4">
          <SectionTitle
            title="Contact Info"
            description="Share the contact details we need for your membership record."
            theme={theme}
          />

          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,8fr)]">
            <div className="lg:row-span-2 lg:h-full">
              <ProfilePhotoField
                value={form.profilePhotoFile}
                onChange={(value) => setField("profilePhotoFile", value)}
                theme={theme}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <WizardField label="Prefix" theme={theme}>
                <select
                  value={form.prefix}
                  onChange={(event) => setField("prefix", event.target.value)}
                  disabled={
                    isLoadingPrefixOptions && prefixOptions.length === 0
                  }
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                >
                  <option value="">
                    {isLoadingPrefixOptions && prefixOptions.length === 0
                      ? "Loading prefixes..."
                      : "Select prefix"}
                  </option>
                  {prefixOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </WizardField>

              <WizardField
                label="First Name"
                theme={theme}
                error={errors.firstName}
              >
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(event) =>
                    setField("firstName", event.target.value)
                  }
                  placeholder="First name"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField label="Middle Name" theme={theme}>
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(event) =>
                    setField("middleName", event.target.value)
                  }
                  placeholder="Middle name"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField
                label="Last Name"
                theme={theme}
                error={errors.lastName}
                required
              >
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(event) => setField("lastName", event.target.value)}
                  placeholder="Last name"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>

              <WizardField
                label="Cell Phone"
                theme={theme}
                error={errors.cellPhone}
              >
                <PhoneInput
                  value={form.cellPhone}
                  onChange={(value) => setField("cellPhone", value)}
                  placeholder="(555) 123-4567"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                />
              </WizardField>
            </div>
          </div>
        </div>

        <div
          className="my-6 w-full border-t border-solid"
          style={{ borderColor: theme.cardBorder }}
          aria-hidden="true"
        />

        <div className="space-y-4">
          <SectionTitle
            title="Address"
            description="Add an address if you want one attached to your membership record."
            theme={theme}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <WizardField
              label="Address Type"
              theme={theme}
              error={errors.addressType}
              required
            >
              <select
                value={form.addressType}
                onChange={(event) =>
                  setField("addressType", event.target.value)
                }
                disabled={
                  isLoadingAddressTypeOptions && addressTypeOptions.length === 0
                }
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              >
                <option value="">
                  {isLoadingAddressTypeOptions &&
                  addressTypeOptions.length === 0
                    ? "Loading address types..."
                    : "Select address type"}
                </option>
                {addressTypeOptions.map((option) => (
                  <option
                    key={option.value || "placeholder"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </WizardField>

            <WizardField label="Country List" theme={theme}>
              <CountrySelectInput
                value={form.countryId}
                onChange={(value) => {
                  setField("countryId", value);
                  setField("stateId", "");
                }}
                placeholder="Select country"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="State List" theme={theme}>
              <StateSelectInput
                countryId={form.countryId}
                value={form.stateId}
                onChange={(value) => setField("stateId", value)}
                placeholder="Select state"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <WizardField
              label="Line 1"
              theme={theme}
              error={errors.streetLine1}
              required
            >
              <input
                type="text"
                value={form.streetLine1}
                onChange={(event) =>
                  setField("streetLine1", event.target.value)
                }
                placeholder="Line 1"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="Line 2" theme={theme}>
              <input
                type="text"
                value={form.streetLine2}
                onChange={(event) =>
                  setField("streetLine2", event.target.value)
                }
                placeholder="Line 2"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="City" theme={theme}>
              <input
                type="text"
                value={form.cityName}
                onChange={(event) => setField("cityName", event.target.value)}
                placeholder="City"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>

            <WizardField label="Zip/Postal Code" theme={theme}>
              <input
                type="text"
                value={form.zipCode}
                onChange={(event) => setField("zipCode", event.target.value)}
                placeholder="Zip / postal code"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              />
            </WizardField>
          </div>
        </div>
      </div>
    </>
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
      {hasCustomForms ? (
        <div className="space-y-5">
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
          className="rounded-3xl border border-dashed px-4 py-5 text-sm"
          style={{ borderColor: theme.cardBorder, color: theme.bodyColor }}
        >
          No questionnaire content mapped to this membership type.
        </div>
      ) : null}
    </>
  );
}

type PaymentStepProps = {
  info: MembershipRegistrationInfo;
  form: MembershipRegistrationFormState;
  paymentMethodError?: string;
  isCreditCardFieldsComplete: boolean;
  showCreditCardFieldErrors: boolean;
  onStripeCardPaymentMethodCreatorReady: (
    creator: StripeCardPaymentMethodCreator | null,
  ) => void;
  onStripeCardFieldsCompleteChange: (isComplete: boolean) => void;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
  couponValidation: DiscountCouponValidationResult | null;
  couponValidationError: string;
  isValidatingCoupon: boolean;
  isCouponApplied: boolean;
  onValidateCoupon: () => void;
  onClearCoupon: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
};

function ChevronDownIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.41Z" />
    </svg>
  );
}

function StripeCardFields({
  theme,
  onCreatePaymentMethodReady,
  onCardFieldsCompleteChange,
  showFieldErrors,
}: {
  theme: MembershipTheme;
  onCreatePaymentMethodReady: (
    creator: StripeCardPaymentMethodCreator | null,
  ) => void;
  onCardFieldsCompleteChange: (isComplete: boolean) => void;
  showFieldErrors: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const stripeInputClassName =
    "w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm";
  const stripeInputStyle = {
    style: {
      base: {
        color: theme.titleColor,
        fontSize: "16px",
        "::placeholder": {
          color: theme.mutedLabelColor,
        },
      },
      invalid: {
        color: "#dc2626",
      },
    },
  };
  const cardNumberElementOptions = {
    ...stripeInputStyle,
    disableLink: true,
  };
  const [isCardNumberComplete, setIsCardNumberComplete] = useState(false);
  const [isCardExpiryComplete, setIsCardExpiryComplete] = useState(false);
  const [isCardCvcComplete, setIsCardCvcComplete] = useState(false);
  const cardExpiryElementRef = useRef<{ focus: () => void } | null>(null);
  const cardCvcElementRef = useRef<{ focus: () => void } | null>(null);

  useEffect(() => {
    onCardFieldsCompleteChange(
      isCardNumberComplete && isCardExpiryComplete && isCardCvcComplete,
    );
  }, [
    isCardCvcComplete,
    isCardExpiryComplete,
    isCardNumberComplete,
    onCardFieldsCompleteChange,
  ]);

  useEffect(() => {
    if (!stripe || !elements) {
      onCreatePaymentMethodReady(null);
      onCardFieldsCompleteChange(false);
      return;
    }

    const createPaymentMethod: StripeCardPaymentMethodCreator = async (
      cardHolderName: string,
    ) => {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Card element not found.");
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: cardHolderName,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error("Unable to create payment method.");
      }

      console.log("[Membership Registration] Created Stripe payment method", {
        paymentMethodId: paymentMethod.id,
      });

      return { id: paymentMethod.id };
    };

    onCreatePaymentMethodReady(createPaymentMethod);

    return () => {
      onCreatePaymentMethodReady(null);
      onCardFieldsCompleteChange(false);
    };
  }, [
    elements,
    onCardFieldsCompleteChange,
    onCreatePaymentMethodReady,
    stripe,
  ]);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[3fr_1fr_1fr]">
          <div className="space-y-2 md:col-span-1">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              Credit card
            </p>
            <div
              className={stripeInputClassName}
              style={{ borderColor: theme.cardBorder }}
            >
              <CardNumberElement
                options={cardNumberElementOptions}
                onChange={(event) => {
                  setIsCardNumberComplete(event.complete);
                }}
              />
            </div>
            {showFieldErrors && !isCardNumberComplete ? (
              <p className="text-xs font-medium leading-5 text-rose-600">
                Credit card required.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              Expiry
            </p>
            <div
              className={stripeInputClassName}
              style={{ borderColor: theme.cardBorder }}
            >
              <CardExpiryElement
                options={stripeInputStyle}
                onChange={(event) => {
                  setIsCardExpiryComplete(event.complete);
                  if (event.complete) {
                    cardCvcElementRef.current?.focus();
                  }
                }}
                onReady={(element) => {
                  cardExpiryElementRef.current = element;
                }}
              />
            </div>
            {showFieldErrors && !isCardExpiryComplete ? (
              <p className="text-xs font-medium leading-5 text-rose-600">
                Expiry required.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              CVV
            </p>
            <div
              className={stripeInputClassName}
              style={{ borderColor: theme.cardBorder }}
            >
              <CardCvcElement
                options={stripeInputStyle}
                onChange={(event) => {
                  setIsCardCvcComplete(event.complete);
                }}
                onReady={(element) => {
                  cardCvcElementRef.current = element;
                }}
              />
            </div>
            {showFieldErrors && !isCardCvcComplete ? (
              <p className="text-xs font-medium leading-5 text-rose-600">
                CVV required.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StripeElementsFields({
  theme,
  stripeCredentials,
  onCreatePaymentMethodReady,
  onCardFieldsCompleteChange,
  showFieldErrors,
}: {
  theme: MembershipTheme;
  stripeCredentials: MembershipRegistrationStripeCredentials;
  onCreatePaymentMethodReady: (
    creator: StripeCardPaymentMethodCreator | null,
  ) => void;
  onCardFieldsCompleteChange: (isComplete: boolean) => void;
  showFieldErrors: boolean;
}) {
  const stripePromise = useMemo(() => {
    return loadStripe(stripeCredentials.publishableKey);
  }, [stripeCredentials.publishableKey]);

  if (!stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardFields
        theme={theme}
        onCreatePaymentMethodReady={onCreatePaymentMethodReady}
        onCardFieldsCompleteChange={onCardFieldsCompleteChange}
        showFieldErrors={showFieldErrors}
      />
    </Elements>
  );
}

function StripeCardSkeleton() {
  const skeletonRowClassName =
    "h-12 animate-pulse rounded-2xl border border-slate-200 bg-slate-100";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[3fr_1fr_1fr]">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className={skeletonRowClassName} />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className={skeletonRowClassName} />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200" />
          <div className={skeletonRowClassName} />
        </div>
      </div>
    </div>
  );
}

function PaymentStep({
  info,
  form,
  paymentMethodError,
  isCreditCardFieldsComplete,
  showCreditCardFieldErrors,
  onStripeCardPaymentMethodCreatorReady,
  onStripeCardFieldsCompleteChange,
  setField,
  theme,
  couponValidation,
  couponValidationError,
  isValidatingCoupon,
  isCouponApplied,
  onValidateCoupon,
  onClearCoupon,
  isSubmitting,
  isLastStep,
}: PaymentStepProps) {
  const paymentProducts = useMemo(() => {
    return info.paymentSettings.paymentProducts.filter(
      (product, index, array) =>
        array.findIndex((candidate) => candidate.name === product.name) ===
        index,
    );
  }, [info.paymentSettings.paymentProducts]);
  const paymentAccountUniqueId =
    info.paymentSettings.paymentAccountUniqueId?.trim();
  const currencyPrefix = buildCurrencyPrefix(info);
  const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
  const presetTips = info.presetTips ?? [];
  const tipAmount = presetTips.length > 0 ? parseTipAmount(form.tipAmount) : 0;
  const selectedTipPercent =
    presetTips.length > 0 ? Number(form.tipPresetPercent) : 0;
  const tipAmountInputRef = useRef<HTMLInputElement | null>(null);
  const totalAmount = membershipAmount + tipAmount;
  const couponDiscountAmount = isCouponApplied && couponValidation
    ? couponValidation.discountAmount
    : 0;
  const finalTotal = Math.max(totalAmount - couponDiscountAmount, 0);
  const hasCouponSection =
    isLastStep && Boolean(info?.discountsEnabled && info?.hasActiveCoupons);
  const [stripeCredentials, setStripeCredentials] =
    useState<MembershipRegistrationStripeCredentials | null>(null);
  const [stripeCredentialsLoading, setStripeCredentialsLoading] =
    useState(false);
  const [stripeCredentialsError, setStripeCredentialsError] = useState("");
  const blurActiveElement = useCallback(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }, []);
  const formatMoney = (amount: number) => {
    return `${currencyPrefix}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };
  const totalAmountLabel =
    finalTotal > 0
      ? formatMoney(finalTotal)
      : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel;
  useEffect(() => {
    if (!selectedTipPercent || !presetTips.length) {
      return;
    }

    const matchingPreset = presetTips.find(
      (presetTip) => presetTip.percent === selectedTipPercent,
    );
    if (!matchingPreset) {
      return;
    }

    const presetBaseAmount = membershipAmount;
    const nextTipAmount = (
      (presetBaseAmount * matchingPreset.percent) /
      100
    ).toFixed(2);

    if (form.tipAmount !== nextTipAmount) {
      setField("tipAmount", nextTipAmount);
    }
  }, [
    form.tipAmount,
    membershipAmount,
    presetTips,
    selectedTipPercent,
    setField,
  ]);

  const selectedPaymentProduct = useMemo(() => {
    const selectedProductId = form.paymentMethod.trim();
    if (!selectedProductId) {
      return null;
    }

    return (
      paymentProducts.find((product) => {
        const productId = resolvePaymentProductId(product.name);
        return productId ? String(productId) === selectedProductId : false;
      }) ?? null
    );
  }, [form.paymentMethod, paymentProducts]);

  const [openPaymentProduct, setOpenPaymentProduct] = useState<string | null>(
    null,
  );
  const didInitializeOpenStateRef = useRef(false);

  useEffect(() => {
    if (
      !paymentAccountUniqueId ||
      selectedPaymentProduct?.name !== "CreditCard"
    ) {
      setStripeCredentials(null);
      setStripeCredentialsError("");
      setStripeCredentialsLoading(false);
      return;
    }

    let isMounted = true;
    setStripeCredentialsLoading(true);
    setStripeCredentialsError("");

    void (async () => {
      try {
        const credentials = await fetchStripePublicCredentials(
          paymentAccountUniqueId,
        );
        if (!isMounted) {
          return;
        }

        setStripeCredentials(credentials);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStripeCredentials(null);
        setStripeCredentialsError(
          error instanceof Error
            ? error.message
            : "Unable to load Stripe credentials.",
        );
      } finally {
        if (isMounted) {
          setStripeCredentialsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [paymentAccountUniqueId, selectedPaymentProduct?.name]);

  useEffect(() => {
    if (didInitializeOpenStateRef.current || paymentProducts.length === 0) {
      return;
    }

    didInitializeOpenStateRef.current = true;
    setOpenPaymentProduct(
      selectedPaymentProduct?.name ?? paymentProducts[0]?.name ?? null,
    );
  }, [paymentProducts, selectedPaymentProduct]);

  useEffect(() => {
    if (selectedPaymentProduct?.name !== "CreditCard") {
      onStripeCardFieldsCompleteChange(false);
      blurActiveElement();
    }
  }, [
    blurActiveElement,
    onStripeCardFieldsCompleteChange,
    selectedPaymentProduct?.name,
  ]);

  if (paymentProducts.length === 0) {
    return (
      <div
        className="rounded-3xl border px-4 py-5 text-sm leading-6"
        style={{ borderColor: theme.cardBorder }}
      >
        No payment methods are currently available for this membership.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paymentMethodError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800 shadow-sm">
          {paymentMethodError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="order-2 space-y-3 lg:order-1">
          <div className="text-sm leading-6" style={{ color: theme.bodyColor }}>
            Select your desired payment method.
          </div>

          <div className="space-y-3">
            {paymentProducts.map((product, index) => {
              const isOpen = openPaymentProduct === product.name;
              const productId = resolvePaymentProductId(product.name);
              const isSelected = productId
                ? form.paymentMethod.trim() === String(productId)
                : false;
              const panelId = `payment-method-panel-${product.name}`;
              const buttonId = `payment-method-button-${product.name}`;
              const headerLabel = product.displayName || product.name;

              return (
                <div key={product.name}>
                  <section
                    className="overflow-hidden rounded-3xl border transition"
                    style={{
                      borderColor:
                        isOpen || isSelected ? theme.level1 : theme.cardBorder,
                      background: theme.cardBackground,
                    }}
                  >
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => {
                        blurActiveElement();

                        if (productId) {
                          setField("paymentMethod", String(productId));
                        }

                        setOpenPaymentProduct((current) => {
                          if (current === product.name && isSelected) {
                            return current;
                          }

                          return current === product.name ? null : product.name;
                        });
                      }}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                            style={{
                              borderColor: isSelected
                                ? theme.level1
                                : theme.cardBorder,
                              background: isSelected
                                ? theme.level1
                                : "transparent",
                              color: isSelected ? "#fff" : theme.bodyColor,
                            }}
                            aria-hidden="true"
                          >
                            {isSelected ? (
                              <CheckIcon className="h-3.5 w-3.5" />
                            ) : null}
                          </span>
                          <span
                            className="truncate text-base font-semibold"
                            style={{ color: theme.titleColor }}
                          >
                            {headerLabel}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="overflow-hidden border-t px-4"
                        style={{ borderColor: theme.cardBorder }}
                      >
                        <div className="py-4">
                          {product.name === "CreditCard" && isSelected ? (
                            <div className="mt-4">
                              {stripeCredentialsLoading ? (
                                <StripeCardSkeleton />
                              ) : stripeCredentialsError ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
                                  {stripeCredentialsError}
                                </div>
                              ) : stripeCredentials ? (
                                <StripeElementsFields
                                  key={stripeCredentials.publishableKey}
                                  theme={theme}
                                  stripeCredentials={stripeCredentials}
                                  onCreatePaymentMethodReady={
                                    onStripeCardPaymentMethodCreatorReady
                                  }
                                  onCardFieldsCompleteChange={
                                    onStripeCardFieldsCompleteChange
                                  }
                                  showFieldErrors={showCreditCardFieldErrors}
                                />
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="order-1 space-y-2 rounded-3xl border px-4 py-4 sm:px-5 sm:py-5 lg:order-2 lg:self-start"
          style={{
            borderColor: theme.cardBorder,
            background: theme.tileBackground,
          }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              What you will pay
            </p>
            <p
              className="mt-1 text-sm leading-6"
              style={{ color: theme.bodyColor }}
            >
              Review the amount before selecting a payment method.
            </p>
          </div>

          <div
            className="space-y-3 rounded-2xl px-4 py-4"
            style={{ background: theme.cardBackground }}
          >
            <div className="grid gap-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: theme.tileLabelColor }}
                >
                  Membership
                </p>
                <p
                  className="text-base text-right font-semibold"
                  style={{ color: theme.tileValueColor }}
                >
                  {membershipAmount > 0
                    ? formatMoney(membershipAmount)
                    : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel}
                </p>
              </div>

              {hasCouponSection ? (
                <div
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 ${isCouponApplied ? "rounded-2xl p-3 -mx-3" : ""}`.trim()}
                  id="coupon-section"
                  style={{
                    background: isCouponApplied
                      ? "rgba(240,253,244,0.98)"
                      : "transparent",
                  }}
                >
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.2em]"
                      style={{ color: theme.tileLabelColor }}
                    >
                      Coupon
                    </p>
                    {isCouponApplied && couponValidation ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          {couponValidation.code}
                        </span>
                        <span className="text-sm font-semibold text-emerald-600">
                          -{formatMoney(couponValidation.discountAmount)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <p
                    className="text-base text-right font-semibold"
                    style={{ color: theme.tileValueColor }}
                  >
                    <div className="space-y-2">
                      {!isCouponApplied ? (
                        <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/80 shadow-sm transition">
                          <input
                            id="couponCode"
                            type="text"
                            value={form.couponCode}
                            onChange={(event) =>
                              setField("couponCode", event.target.value)
                            }
                            placeholder="Enter coupon code"
                            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                            style={{ color: theme.titleColor }}
                            disabled={isSubmitting || isValidatingCoupon}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void onValidateCoupon();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => void onValidateCoupon()}
                            disabled={
                              !form.couponCode.trim() ||
                              isSubmitting ||
                              isValidatingCoupon
                            }
                            className="shrink-0 px-3 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ background: theme.level1 }}
                          >
                            {isValidatingCoupon ? "Validating..." : "Apply"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onClearCoupon()}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                          Remove
                        </button>
                      )}

                      {couponValidationError ? (
                        <p className="text-xs text-rose-600">
                          {couponValidationError}
                        </p>
                      ) : null}
                    </div>
                  </p>
                </div>
              ) : null}

              {presetTips.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)_minmax(0,200px)] sm:items-center">
                    <div className="min-w-0 sm:self-center">
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.2em]"
                        style={{ color: theme.tileLabelColor }}
                      >
                        Tip
                      </p>
                    </div>

                    <div className="min-w-0">
                      <select
                        value={form.tipPresetPercent}
                        onChange={(event) => {
                          if (event.target.value === "other") {
                            setField("tipPresetPercent", "other");
                            window.setTimeout(() => {
                              tipAmountInputRef.current?.focus();
                            }, 0);
                            return;
                          }

                          const selectedPreset = presetTips.find(
                            (presetTip) =>
                              String(presetTip.percent) === event.target.value,
                          );
                          if (!selectedPreset) {
                            setField("tipPresetPercent", "");
                            return;
                          }

                          const presetBaseAmount = membershipAmount;
                          const presetAmount =
                            (presetBaseAmount * selectedPreset.percent) / 100;
                          setField("tipPresetPercent", event.target.value);
                          setField(
                            "tipAmount",
                            presetAmount > 0 ? presetAmount.toFixed(2) : "",
                          );
                        }}
                        className="w-full rounded-2xl border bg-white px-3 py-3 text-left text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                        style={{
                          borderColor: theme.cardBorder,
                          color: theme.titleColor,
                        }}
                      >
                        {presetTips.map((presetTip) => (
                          <option
                            key={presetTip.percent}
                            value={presetTip.percent}
                          >
                            {presetTip.percent}%
                          </option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="w-full sm:max-w-50">
                      <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/70 shadow-sm">
                        <span
                          className="flex shrink-0 items-center whitespace-nowrap px-3 text-sm font-semibold"
                          style={{
                            color: theme.tileValueColor,
                            background: theme.level3,
                          }}
                        >
                          {currencyPrefix}
                        </span>
                        <input
                          ref={tipAmountInputRef}
                          type="text"
                          inputMode="decimal"
                          value={form.tipAmount}
                          onChange={(event) => {
                            setField("tipPresetPercent", "other");
                            setField(
                              "tipAmount",
                              formatAmountInput(event.target.value),
                            );
                          }}
                          onBlur={(event) => {
                            setField("tipPresetPercent", "other");
                            setField(
                              "tipAmount",
                              normalizeAmountInput(event.target.value),
                            );
                          }}
                          placeholder="0.00"
                          className="w-full bg-white/70 px-3 py-2.5 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                          style={{ color: theme.titleColor }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] leading-4 tracking-wide">
                    <span
                      aria-hidden="true"
                      className="text-[12px] leading-none text-red-500"
                    >
                      ♥
                    </span>{" "}
                    If you would like to give a little extra, your tip goes a
                    long way in supporting us.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {isCouponApplied && couponDiscountAmount > 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-2.5">
              <span className="text-sm font-medium text-emerald-700">
                Discount applied
              </span>
              <span className="text-sm font-bold text-emerald-700">
                -{formatMoney(couponDiscountAmount)}
              </span>
            </div>
          ) : null}

          <div className="border-t" style={{ borderColor: theme.cardBorder }} />

          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: theme.cardBackground }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: theme.tileLabelColor }}
              >
                Total payable
              </p>
              <p
                className="text-2xl font-bold text-right sm:text-3xl"
                style={{ color: isCouponApplied ? theme.level1 : theme.level1 }}
              >
                {totalAmountLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const [currentStep, setCurrentStep] = useState(1);
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
      className="w-full max-w-400 space-y-6"
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
            console.log(
              "[Membership Registration] Using Stripe payment method",
              {
                paymentMethodId: paymentMethod.id,
              },
            );
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

      <div className="relative -mx-4 overflow-x-auto pb-2 px-4 sm:mx-0 sm:px-0">
        <div className="relative z-10 flex min-w-full flex-nowrap gap-3 sm:min-w-max sm:gap-4">
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

