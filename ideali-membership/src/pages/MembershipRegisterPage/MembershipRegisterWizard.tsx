import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { MembershipRegisterPageViewModel } from "./MembershipRegisterPage.types";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
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
  theme: MembershipTheme;
  membershipName: string;
  membershipDescription: string;
};

const STEPS = [
  {
    title: "Membership Info",
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

function formatShortExpiryLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatMonthDayLabel(month: number | null, day: number | null) {
  if (!month || !day) {
    return null;
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabel = monthLabels[month - 1];

  if (!monthLabel) {
    return null;
  }

  return `${String(day).padStart(2, "0")}-${monthLabel}`;
}

function parseDonationAmount(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildCurrencyPrefix(info: MembershipRegistrationInfo) {
  const currencySymbol = info.paymentSettings.paymentCurrencySymbol?.trim();
  const currencyCode = info.paymentSettings.paymentCurrencyCode?.trim();

  if (currencyCode) {
    return `${currencyCode.toUpperCase()} $`;
  }

  if (currencySymbol) {
    return currencySymbol;
  }

  return "";
}

function formatDonationAmountInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  if (!sanitized) {
    return "";
  }

  const [wholePartRaw = "0", ...decimalParts] = sanitized.split(".");
  const decimalPartRaw = decimalParts.join("");
  const wholePart = wholePartRaw.replace(/^0+(?=\d)/, "") || "0";
  const formattedWholePart = new Intl.NumberFormat("en-US").format(Number(wholePart));

  if (!sanitized.includes(".")) {
    return formattedWholePart;
  }

  const decimalPart = decimalPartRaw.slice(0, 2);
  return decimalPart ? `${formattedWholePart}.${decimalPart}` : `${formattedWholePart}.`;
}

function normalizeDonationAmountInput(value: string) {
  const parsed = parseDonationAmount(value);
  if (!Number.isFinite(parsed) || value.trim() === "") {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatRenewalDueLabel(month: number | null, day: number | null) {
  const monthDayLabel = formatMonthDayLabel(month, day);

  if (!monthDayLabel) {
    return null;
  }

  return `Renewal due on\u00A0${monthDayLabel}`;
}

function renderRenewalDueLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const renewalPrefix = "Renewal due on\u00A0";
  if (label.startsWith(renewalPrefix)) {
    return (
      <>
        {renewalPrefix}
        <span className="font-semibold">{label.slice(renewalPrefix.length)}</span>
      </>
    );
  }

  return label;
}

function formatTenureLabel(value: string | number | null) {
  const tenureMap: Record<number, string> = {
    1: "Monthly",
    2: "Annual",
    3: "Life Time",
    4: "Custom",
  };

  if (typeof value === "number") {
    return tenureMap[value] ?? "Membership";
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "Membership";
}

function isLifetimeTenure(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "lifetime" || normalized === "life time";
}

function formatTenureWithExpiryLabel(info: MembershipRegistrationInfo) {
  const tenureLabel = formatTenureLabel(info.membershipDetail.tenure);
  const annualExpiryLabel = formatRenewalDueLabel(
    info.membershipDetail.annualExpiryMonth,
    info.membershipDetail.annualExpiryDay,
  );
  const customExpiryLabel =
    info.membershipDetail.tenure === "Custom" || info.membershipDetail.tenure === 4
      ? info.membershipDetail.customExpiryDays
        ? `${info.membershipDetail.customExpiryDays} Days`
        : formatShortExpiryLabel(info.membershipDetail.customExpiryDate)
      : null;

  if (tenureLabel === "Monthly") {
    return { tenureLabel, expiryLabel: "Requires monthly renewal" };
  }

  if (tenureLabel === "Annual") {
    return { tenureLabel, expiryLabel: annualExpiryLabel ?? "Every Year" };
  }

  if (isLifetimeTenure(tenureLabel)) {
    return { tenureLabel, expiryLabel: "No Expiry" };
  }

  if (tenureLabel === "Custom") {
    return { tenureLabel, expiryLabel: customExpiryLabel ?? "No Expiry" };
  }

  return { tenureLabel, expiryLabel: annualExpiryLabel ?? customExpiryLabel ?? null };
}

function isPricingStepComplete(
  form: MembershipRegistrationFormState,
  isFreeMembership: boolean,
) {
  const donationAmount = parseDonationAmount(form.donationAmount);
  const requiresPaymentMethod = !isFreeMembership || donationAmount > 0;

  return requiresPaymentMethod ? Boolean(form.paymentMethod.trim()) : true;
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

function MembershipDescriptionPanel({
  description,
  theme,
}: {
  description: string;
  theme: MembershipTheme;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const trimmedDescription = description.trim();

  useEffect(() => {
    if (!trimmedDescription || !previewRef.current) {
      setIsOverflowing(false);
      return;
    }

    const element = previewRef.current;
    const updateOverflowState = () => {
      setIsOverflowing(element.scrollHeight > element.clientHeight + 2);
    };

    updateOverflowState();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateOverflowState);
    observer.observe(element);

    return () => observer.disconnect();
  }, [trimmedDescription]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  if (!trimmedDescription) {
    return null;
  }

  return (
    <>
      <div
        className="space-y-2 rounded-3xl border p-4 text-left sm:p-5"
        style={{
          borderColor: theme.cardBorder,
          background: theme.cardBackground,
          boxShadow: `0 18px 42px -28px ${theme.cardShadow}`,
        }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: theme.level1 }}>
          About This Membership
        </p>
        <div
          ref={previewRef}
          className="max-h-44 overflow-hidden text-base leading-7 [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:ml-6 sm:max-h-52 lg:max-h-60"
          style={{ color: theme.bodyColor }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {isOverflowing ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
            style={{ color: theme.level1 }}
          >
            More
          </button>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close description modal"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="About This Membership"
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border p-5 shadow-2xl sm:p-6"
            style={{
              borderColor: theme.cardBorder,
              background: "rgba(255, 255, 255, 0.98)",
              boxShadow: `0 30px 80px -30px ${theme.cardShadow}, 0 0 0 1px rgba(255, 255, 255, 0.7) inset`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: theme.level1 }}>
                  About This Membership
                </p>
                <p className="text-sm" style={{ color: theme.bodyColor }}>
                  Full description
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border px-3 py-1 text-sm font-semibold text-white transition hover:opacity-80"
                style={{
                  borderColor: theme.cardBorder,
                  background: theme.level1,
                }}
              >
                Close
              </button>
            </div>
            <div
              className="mt-5 max-h-[70vh] overflow-y-auto text-base leading-7 [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:ml-6"
              style={{ color: "#0f172a" }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </section>
        </div>
      ) : null}
    </>
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
        "relative flex min-w-[7.5rem] flex-1 flex-col items-center gap-1.5 rounded-none border-0 px-2 py-2 text-center transition sm:min-w-[10rem] sm:gap-2 sm:px-3",
        disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-100",
      ].join(" ")}
      style={{
        background: "transparent",
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-4 ring-white transition sm:h-10 sm:w-10"
        style={{
          background: completed || active ? theme.level1 : "rgba(71, 85, 105, 0.18)",
          color: completed || active ? "#ffffff" : "#020617",
          boxShadow: active ? `0 0 0 6px ${theme.barBackground}` : "none",
        }}
      >
        {completed && !active ? <CheckIcon className="h-4 w-4" /> : formatStepNumber(index)}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold leading-5 sm:text-base" style={{ color: active ? theme.level1 : theme.titleColor }}>
          {title}
        </p>
        <p className="text-xs leading-4 sm:text-sm sm:leading-5" style={{ color: theme.bodyColor }}>
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
  const donationCampaignName = info.membershipDetail.donationCampaignName?.trim();
  const donationCampaignAmount = parseDonationAmount(form.donationAmount);
  const currencyPrefix = buildCurrencyPrefix(info);
  const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
  const totalAmount = membershipAmount + donationCampaignAmount;
  const totalAmountLabel =
    totalAmount > 0
      ? `${currencyPrefix}${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalAmount)}`
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
        <div className="space-y-2 lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: theme.titleColor }}>
              {info.membershipDetail.name}
              {info.organizerName ? (
                <span className="ml-2 text-base font-semibold leading-6" style={{ color: theme.bodyColor }}>
                  by <span className="font-extrabold uppercase">{info.organizerName}</span>
                </span>
              ) : null}
              {tenureInfo.expiryLabel ? (
                <span className="ml-2 text-base font-semibold leading-6" style={{ color: theme.bodyColor }}>
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
                </span>
              ) : null}
            </h1>
            <p className="text-base leading-6" style={{ color: theme.bodyColor }}>
              Review the membership charge before moving ahead.
            </p>
          </div>
          {donationCampaignName ? (
            <div
              className="rounded-2xl px-4 py-3 text-right sm:px-5 sm:py-4 lg:ml-auto lg:min-w-56"
              style={{ background: theme.tileBackground }}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                Total Payable
              </span>
              <span className="mt-2 block text-2xl font-bold sm:text-3xl" style={{ color: theme.level1 }}>
                {totalAmountLabel}
              </span>
            </div>
          ) : null}
        </div>
        <div className="h-px w-full" style={{ background: theme.tileBorder, opacity: 0.7 }} />
        <div className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4" style={{ background: theme.tileBackground }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
            Amount
          </p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: theme.level1 }}>
            {formattedMembershipCharges}
          </p>
        </div>

        {info.membershipDetail.donationCampaignName ? (
          <>
            <div className="h-px w-full" style={{ background: theme.tileBorder, opacity: 0.7 }} />
          <div className="space-y-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-4" style={{ background: theme.tileBackground }}>
            <div className="grid gap-3 lg:grid-cols-[1fr_2fr] lg:items-center">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                  Donation Campaign
                </p>
                <p className="text-base font-semibold" style={{ color: theme.tileValueColor }}>
                  {donationCampaignName}
                </p>
              </div>
              <label className="flex min-w-0 items-stretch overflow-hidden rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <span
                  className="flex shrink-0 items-center whitespace-nowrap border-r px-3 text-sm font-semibold"
                  style={{ borderColor: theme.cardBorder, color: theme.tileValueColor, background: theme.level3 }}
                >
                  {currencyPrefix}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.donationAmount}
                  onChange={(event) => setField("donationAmount", formatDonationAmountInput(event.target.value))}
                  onBlur={(event) => setField("donationAmount", normalizeDonationAmountInput(event.target.value))}
                  placeholder="0.00"
                  className="w-full bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                  style={{ color: theme.titleColor }}
                />
              </label>
              <p className="text-xs leading-5 lg:col-start-2" style={{ color: theme.mutedLabelColor }}>
                Optional. Leave blank if you do not want to donate.
              </p>
            </div>
          </div>
          </>
        ) : null}

      </div>

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
    <div className="rounded-3xl border p-4 sm:p-5" style={{ borderColor: theme.cardBorder, background: theme.cardBackground }}>
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
    <div className="rounded-3xl border p-4 sm:p-5" style={{ borderColor: theme.cardBorder, background: theme.cardBackground }}>
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
  theme,
  membershipName,
  membershipDescription,
}: MembershipRegisterWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const pricingStepComplete = isPricingStepComplete(form, isFreeMembership);
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
    <form className="w-full max-w-[100rem] space-y-6" onSubmit={onSubmit}>
      <div className="relative -mx-4 overflow-x-auto pb-2 px-4 sm:mx-0 sm:px-0">
        <div className="relative z-10 flex min-w-full flex-nowrap gap-3 sm:min-w-max sm:gap-4">
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
        className="rounded-[2rem] border p-4 sm:p-5 lg:p-6"
        style={{
          borderColor: theme.cardBorder,
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
          <InformationStep form={form} errors={errors} setField={setField} theme={theme} />
        ) : (
          <PaymentStep form={form} setField={setField} theme={theme} />
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-2xl border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                }}
              >
                Back
              </button>
            ) : null}
          </div>

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
