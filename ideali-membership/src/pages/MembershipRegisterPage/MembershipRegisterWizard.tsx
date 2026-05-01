import { useState, type FormEvent, type ReactNode } from "react";
import type { MembershipRegisterPageViewModel } from "./MembershipRegisterPage.types";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
} from "../../types/membershipRegistration";

type MembershipTheme = {
  accentRgb: { r: number; g: number; b: number };
  level1: string;
  level2: string;
  level3: string;
  pageBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  iconBackground: string;
  iconBorder: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  labelColor: string;
  mutedLabelColor: string;
  tileBorder: string;
  tileBackground: string;
  tileLabelColor: string;
  tileValueColor: string;
  barBackground: string;
};

type MembershipRegisterWizardProps = Pick<
  MembershipRegisterPageViewModel,
  "errors" | "form" | "isSubmitting" | "onSubmit" | "setField"
> & {
  info: MembershipRegistrationInfo;
  formattedMembershipCharges: string;
  isFreeMembership: boolean;
  paymentMethodOptions: Array<{ value: number; label: string }>;
  theme: MembershipTheme;
  membershipName: string;
  membershipDescription: string;
  organizerName: string;
};

const STEPS = [
  {
    title: "Pricing",
    description: "Review the price and choose a payment method.",
  },
  {
    title: "Your Information",
    description: "Share the member details we need.",
  },
  {
    title: "Payment",
    description: "Confirm the final payment details and submit.",
  },
] as const;

function formatStepNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
    </svg>
  );
}

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPricingStepComplete(
  form: MembershipRegistrationFormState,
  isFreeMembership: boolean,
  paymentMethodOptions: Array<{ value: number; label: string }>,
) {
  if (isFreeMembership) {
    return true;
  }

  if (paymentMethodOptions.length === 0) {
    return true;
  }

  return Boolean(form.paymentMethod.trim());
}

function isInformationStepComplete(form: MembershipRegistrationFormState) {
  return Boolean(
    form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      isEmailValid(form.email) &&
      form.password.length >= 6 &&
      form.confirmPassword &&
      form.confirmPassword === form.password &&
      form.streetLine1.trim() &&
      form.zipCode.trim(),
  );
}

function StepBadge({
  index,
  title,
  description,
  active,
  completed,
  disabled,
  onClick,
  theme,
}: {
  index: number;
  title: string;
  description: string;
  active: boolean;
  completed: boolean;
  disabled: boolean;
  onClick: () => void;
  theme: MembershipTheme;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative flex min-w-[10rem] flex-1 flex-col items-center gap-2 rounded-none border-0 px-3 py-2 text-center transition",
        disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-100",
      ].join(" ")}
      style={{
        background: "transparent",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-4 ring-white transition"
        style={{
          background: completed || active ? theme.level1 : "rgba(71, 85, 105, 0.18)",
          color: completed || active ? "#ffffff" : "#020617",
          boxShadow: active ? `0 0 0 6px ${theme.barBackground}` : "none",
        }}
      >
        {completed && !active ? <CheckIcon className="h-4 w-4" /> : formatStepNumber(index)}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-base font-semibold leading-5" style={{ color: active ? theme.level1 : theme.titleColor }}>
          {title}
        </p>
        <p className="text-sm leading-5" style={{ color: theme.bodyColor }}>
          {description}
        </p>
      </div>
      <div
        className="mt-1 h-1 w-full rounded-full transition"
        style={{
          background: completed || active ? theme.level1 : "rgba(148, 163, 184, 0.1)",
        }}
      />
    </button>
  );
}

function SectionTitle({
  title,
  description,
  theme,
}: {
  title: string;
  description: string;
  theme: MembershipTheme;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.titleColor }}>
        {title}
      </h2>
      <p className="text-base leading-6" style={{ color: theme.bodyColor }}>
        {description}
      </p>
    </div>
  );
}

function WizardField({
  label,
  children,
  error,
  theme,
  required = false,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  theme: MembershipTheme;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
        <span className="text-base font-semibold" style={{ color: theme.labelColor }}>
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
      {children}
      {error ? <span className="text-base text-rose-600">{error}</span> : null}
    </label>
  );
}

function PricingStep({
  info,
  form,
  paymentMethodOptions,
  formattedMembershipCharges,
  isFreeMembership,
  errors,
  setField,
  theme,
  membershipDescription,
}: {
  info: MembershipRegistrationInfo;
  form: MembershipRegistrationFormState;
  paymentMethodOptions: Array<{ value: number; label: string }>;
  formattedMembershipCharges: string;
  isFreeMembership: boolean;
  errors: Partial<Record<keyof MembershipRegistrationFormState, string>>;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
  membershipDescription: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5 rounded-3xl border p-5" style={{ borderColor: theme.cardBorder, background: "#fff" }}>
        <SectionTitle
          title="Pricing"
          description="Review the membership charge before moving ahead."
          theme={theme}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border p-4" style={{ borderColor: theme.tileBorder, background: theme.tileBackground }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
              Membership
            </p>
            <p className="mt-2 text-lg font-bold" style={{ color: theme.tileValueColor }}>
              {info.membershipDetail.name}
            </p>
            <p className="mt-1 text-sm" style={{ color: theme.bodyColor }}>
              {info.organizerName}
            </p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: theme.tileBorder, background: theme.tileBackground }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
              Amount
            </p>
            <p className="mt-2 text-lg font-bold" style={{ color: theme.level1 }}>
              {formattedMembershipCharges}
            </p>
            <p className="mt-1 text-sm" style={{ color: theme.bodyColor }}>
              {isFreeMembership ? "No payment is required." : "Payment method is required to continue."}
            </p>
          </div>
        </div>

        {!isFreeMembership ? (
          <WizardField
            label="Payment Method"
            theme={theme}
            required
            error={errors.paymentMethod}
          >
            <select
              value={form.paymentMethod}
              onChange={(event) => setField("paymentMethod", event.target.value)}
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
            >
              <option value="">Select a payment method</option>
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </WizardField>
        ) : null}
      </div>

      {membershipDescription.trim() ? (
        <div className="space-y-2 rounded-3xl border p-5 text-left" style={{ borderColor: theme.cardBorder, background: "#fff" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: theme.labelColor }}>
            About This Membership
          </p>
          <div
            className="text-base leading-7 [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:ml-6"
            style={{ color: theme.bodyColor }}
            dangerouslySetInnerHTML={{ __html: membershipDescription }}
          />
        </div>
      ) : null}
    </div>
  );
}

function InformationStep({
  form,
  errors,
  setField,
  theme,
}: {
  form: MembershipRegistrationFormState;
  errors: Partial<Record<keyof MembershipRegistrationFormState, string>>;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
}) {
  return (
    <div className="rounded-3xl border p-5" style={{ borderColor: theme.cardBorder, background: "#fff" }}>
      <SectionTitle
        title="Your Information"
        description="Tell us who is joining and how we can contact them."
        theme={theme}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WizardField label="Prefix" theme={theme}>
          <input
            value={form.prefix}
            onChange={(event) => setField("prefix", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="First Name" theme={theme} required error={errors.firstName}>
          <input
            value={form.firstName}
            onChange={(event) => setField("firstName", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Middle Name" theme={theme}>
          <input
            value={form.middleName}
            onChange={(event) => setField("middleName", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Last Name" theme={theme} required error={errors.lastName}>
          <input
            value={form.lastName}
            onChange={(event) => setField("lastName", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Email" theme={theme} required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Cell Phone" theme={theme}>
          <input
            value={form.cellPhone}
            onChange={(event) => setField("cellPhone", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Password" theme={theme} required error={errors.password}>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setField("password", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Confirm Password" theme={theme} required error={errors.confirmPassword}>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setField("confirmPassword", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <WizardField label="Street Address" theme={theme} required error={errors.streetLine1}>
          <input
            value={form.streetLine1}
            onChange={(event) => setField("streetLine1", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Street Address 2" theme={theme}>
          <input
            value={form.streetLine2}
            onChange={(event) => setField("streetLine2", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
        <WizardField label="Zip Code" theme={theme} required error={errors.zipCode}>
          <input
            value={form.zipCode}
            onChange={(event) => setField("zipCode", event.target.value)}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
      </div>
    </div>
  );
}

function PaymentStep({
  form,
  setField,
  theme,
}: {
  form: MembershipRegistrationFormState;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
}) {
  return (
    <div className="rounded-3xl border p-5" style={{ borderColor: theme.cardBorder, background: "#fff" }}>
      <SectionTitle
        title="Payment"
        description="Confirm your payment note and final review before submitting."
        theme={theme}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border p-4" style={{ borderColor: theme.tileBorder, background: theme.tileBackground }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
            Selected Method
          </p>
          <p className="mt-2 text-lg font-bold" style={{ color: theme.tileValueColor }}>
            {form.paymentMethod || "Not selected"}
          </p>
          <p className="mt-2 text-sm" style={{ color: theme.bodyColor }}>
            Your selected payment method will be used for this registration.
          </p>
        </div>

        <WizardField label="Notes" theme={theme}>
          <textarea
            value={form.notes}
            onChange={(event) => setField("notes", event.target.value)}
            rows={8}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
          />
        </WizardField>
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
  paymentMethodOptions,
  theme,
  membershipName,
  membershipDescription,
  organizerName,
}: MembershipRegisterWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const pricingStepComplete = isPricingStepComplete(form, isFreeMembership, paymentMethodOptions);
  const infoStepComplete = isInformationStepComplete(form);

  const canGoNext =
    (currentStep === 0 && pricingStepComplete) || (currentStep === 1 && infoStepComplete) || currentStep === 2;

  const stepTitles = STEPS.map((step, index) => ({
    ...step,
    active: index === currentStep,
    completed: index < currentStep,
    disabled: index > currentStep || (index === 1 && !pricingStepComplete) || (index === 2 && !infoStepComplete),
  }));

  function handleNext() {
    if (!canGoNext) {
      return;
    }

    setCurrentStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function handleBack() {
    setCurrentStep((value) => Math.max(value - 1, 0));
  }

  return (
    <form className="w-full max-w-6xl space-y-6" onSubmit={onSubmit}>
      <div className="relative overflow-x-auto pb-2">
        <div className="relative z-10 flex min-w-max flex-nowrap gap-4">
          {stepTitles.map((step, index) => (
            <StepBadge
              key={step.title}
              index={index}
              title={step.title}
              description={step.description}
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
        className="rounded-[2rem] border p-6"
        style={{
          borderColor: theme.cardBorder,
          background: theme.cardBackground,
        }}
      >
        {currentStep === 0 ? (
          <PricingStep
            info={info}
            form={form}
            paymentMethodOptions={paymentMethodOptions}
          formattedMembershipCharges={formattedMembershipCharges}
          isFreeMembership={isFreeMembership}
          errors={errors}
          setField={setField}
          theme={theme}
          membershipDescription={membershipDescription}
        />
        ) : currentStep === 1 ? (
          <InformationStep form={form} errors={errors} setField={setField} theme={theme} />
        ) : (
          <PaymentStep form={form} setField={setField} theme={theme} />
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="rounded-2xl border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: theme.cardBorder,
              color: theme.titleColor,
            }}
          >
            Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: theme.level1 }}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: theme.level1 }}
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          )}
        </div>
      </section>
    </form>
  );
}
