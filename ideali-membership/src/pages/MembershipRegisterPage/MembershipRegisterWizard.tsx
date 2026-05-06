import { createPortal } from "react-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { MembershipRegisterPageViewModel } from "./MembershipRegisterPage.types";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomQuestion,
  MembershipRegistrationCustomFormSummary,
} from "../../types/membershipRegistration";
import { CountrySelectInput } from "../../components/inputs/CountrySelectInput/CountrySelectInput";
import { MultiSelectInput } from "../../components/inputs/MultiSelectInput/MultiSelectInput";
import { StateSelectInput } from "../../components/inputs/StateSelectInput/StateSelectInput";
import { PhoneInput } from "../../components/inputs/PhoneInput/PhoneInput";
import { PasswordInput } from "../../components/inputs/PasswordInput/PasswordInput";
import { fetchCountryOptions, fetchStateOptions } from "../../lib/customForms";
import { fetchAddressTypeOptions, fetchContactPrefixOptions, resolvePaymentProductId } from "../../lib/membershipRegistration";

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

function formatStepNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function isEnabledFlag(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
    </svg>
  );
}

function FieldTooltip({ text, theme }: { text: string; theme: MembershipTheme }) {
  return (
    <span className="inline-flex shrink-0 align-middle text-current" style={{ color: theme.bodyColor }}>
      <button
        type="button"
        aria-label="Show additional field help"
        title={text}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-current transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current opacity-70">
          <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 2a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2.25A1.25 1.25 0 1 0 10 8a1.25 1.25 0 0 0 0-2.5Zm-1 4.1h2V14h-2V9.85Z" />
        </svg>
      </button>
    </span>
  );
}

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPhoneLikeValue(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isValidDateValue(value: string) {
  if (!value.trim()) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isValidNumberValue(value: string) {
  if (!value.trim()) {
    return false;
  }

  return /^-?\d+(\.\d+)?$/.test(value.trim());
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

function getFieldBorderClass(showBorders: boolean) {
  return showBorders ? "border" : "";
}

function getFieldDashedBorderClass(showBorders: boolean) {
  return showBorders ? "border border-dashed" : "";
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

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
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

function validateUserLoginStep(form: MembershipRegistrationFormState) {
  const errors: Partial<Record<keyof MembershipRegistrationFormState, string>> = {};

  if (!form.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!isEmailValid(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function validateYourInformationStep(form: MembershipRegistrationFormState) {
  const errors = validateUserLoginStep(form);

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.addressType.trim()) {
    errors.addressType = "Address type is required.";
  }

  if (!form.streetLine1.trim()) {
    errors.streetLine1 = "Line 1 is required.";
  }

  return errors;
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
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-4xl border p-5 shadow-2xl sm:p-6"
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
  active,
  completed,
  disabled,
  onClick,
  theme,
}: {
  index: number;
  title: string;
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
        "relative flex min-w-30 flex-1 flex-col items-center gap-1.5 rounded-none border-0 px-2 py-2 text-center transition sm:min-w-40 sm:gap-2 sm:px-3",
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
        <span className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
      {children}
      {error ? <span className="text-base text-rose-600">{error}</span> : null}
    </label>
  );
}

function CameraIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.5 3.5 6.4 5H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2.4L12.5 3.5h-5Zm2.5 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    </svg>
  );
}

function AvatarSilhouetteIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.79-8 6.23V21h16v-.77C20 16.79 16.42 14 12 14Z" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7 3a1 1 0 0 0-1 1v1H3.5a.5.5 0 0 0 0 1H4l.7 9.1A2 2 0 0 0 6.7 17h6.6a2 2 0 0 0 2-1.9L16 6h.5a.5.5 0 0 0 0-1H14V4a1 1 0 0 0-1-1H7Zm1 2V4h4v1H8Zm-1.2 2h6.4L12.7 15H7.3L6.8 7Zm2 2.2a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Zm3 0a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Z" />
    </svg>
  );
}

function DragHintIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-6 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM7 13.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

const AVATAR_VIEWPORT_SIZE = 240;
const AVATAR_OUTPUT_SIZE = 400;
const AVATAR_DEFAULT_ZOOM = 1.15;
const AVATAR_MIN_ZOOM = 1.05;
const AVATAR_MAX_ZOOM = 3;

function clampAvatarOffset(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = src;
  });
}

function buildAvatarFileName(sourceName: string, mimeType: string) {
  const extension =
    mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "png";
  const baseName = sourceName.replace(/\.[^.]+$/, "") || "avatar";
  return `${baseName}-avatar.${extension}`;
}

function createDummyAvatarFile() {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">',
    '<rect width="320" height="320" rx="160" fill="#0ea5e9"/>',
    '<circle cx="160" cy="120" r="52" fill="#ffffff" fill-opacity="0.96"/>',
    '<path d="M78 268c18-46 58-72 82-72s64 26 82 72" fill="#ffffff" fill-opacity="0.96"/>',
    '<text x="160" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a">AV</text>',
    "</svg>",
  ].join("");

  return new File([svg], "dummy-avatar.svg", { type: "image/svg+xml" });
}

function createDummyTextFile(fileName: string, content: string, mimeType = "text/plain") {
  return new File([content], fileName, { type: mimeType });
}

function toDummyFileName(label: string, extension: string) {
  const baseName =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dummy";
  return `${baseName}.${extension}`;
}

function createDummyFileForAcceptedTypes(acceptedFileTypes: string | null | undefined, label: string) {
  const rules = parseAcceptedFileTypes(acceptedFileTypes).map((rule) => rule.toLowerCase());

  if (
    rules.some((rule) =>
      rule === "*" ||
      rule === "*/*" ||
      rule.startsWith("image/") ||
      rule === "image/*" ||
      rule.endsWith(".png") ||
      rule.endsWith(".jpg") ||
      rule.endsWith(".jpeg") ||
      rule.endsWith(".webp") ||
      rule.endsWith(".gif") ||
      rule.endsWith(".svg"),
    )
  ) {
    return createDummyAvatarFile();
  }

  if (rules.some((rule) => rule === "application/pdf" || rule.endsWith(".pdf"))) {
    return createDummyTextFile(
      toDummyFileName(label, "pdf"),
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF",
      "application/pdf",
    );
  }

  if (rules.some((rule) => rule === "text/plain" || rule.endsWith(".txt"))) {
    return createDummyTextFile(toDummyFileName(label, "txt"), "Dummy file content");
  }

  if (rules.some((rule) => rule.endsWith(".csv") || rule === "text/csv")) {
    return createDummyTextFile(toDummyFileName(label, "csv"), "header\nvalue", "text/csv");
  }

  return createDummyTextFile(toDummyFileName(label, "txt"), "Dummy file content");
}

function getFirstOptionValue(options: Array<{ label: string; value: string }>) {
  return options.find((option) => option.value.trim())?.value || "";
}

function buildDummyValueForControlType(
  controlType: string,
  label: string,
  options: Array<{ label: string; value: string }> = [],
  acceptedFileTypes: string | null | undefined = null,
  countryValue = "",
  stateValue = "",
) {
  switch (controlType) {
    case "checkbox":
      return true;
    case "multiselect":
      return options
        .filter((option) => option.value.trim())
        .slice(0, 2)
        .map((option) => option.value);
    case "select":
    case "radio":
      return getFirstOptionValue(options);
    case "country":
      return countryValue;
    case "state":
      return stateValue;
    case "file":
      return createDummyFileForAcceptedTypes(acceptedFileTypes, label);
    case "email":
      return `demo.${label.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "user"}@example.com`;
    case "phone":
      return "(555) 123-4567";
    case "password":
      return "Password123!";
    case "number":
      return "123";
    case "date":
      return "2026-01-01";
    case "textarea":
      return `Sample ${label || "text"}`;
    default:
      return `Sample ${label || "value"}`;
  }
}

async function cropAvatarFile(
  file: File,
  previewUrl: string,
  dimensions: { width: number; height: number },
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const image = await loadImageElement(previewUrl);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  const baseScale = Math.max(AVATAR_VIEWPORT_SIZE / dimensions.width, AVATAR_VIEWPORT_SIZE / dimensions.height);
  const scale = baseScale * zoom;
  const sourceWidth = AVATAR_VIEWPORT_SIZE / scale;
  const sourceHeight = AVATAR_VIEWPORT_SIZE / scale;
  const sourceX = clampAvatarOffset((dimensions.width - sourceWidth) / 2 - offsetX / scale, 0, Math.max(0, dimensions.width - sourceWidth));
  const sourceY = clampAvatarOffset((dimensions.height - sourceHeight) / 2 - offsetY / scale, 0, Math.max(0, dimensions.height - sourceHeight));

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);

  const mimeType = file.type || "image/png";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, 0.92);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], buildAvatarFileName(file.name, mimeType), { type: mimeType });
}

function ProfilePhotoField({
  value,
  onChange,
  theme,
}: {
  value: File | null;
  onChange: (value: File | null) => void;
  theme: MembershipTheme;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const dropCounterRef = useRef(0);
  const cropViewportRef = useRef<HTMLDivElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null);
  const [editorSource, setEditorSource] = useState<File | null>(null);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorZoom, setEditorZoom] = useState(AVATAR_DEFAULT_ZOOM);
  const [editorOffsetXPercent, setEditorOffsetXPercent] = useState(0);
  const [editorOffsetYPercent, setEditorOffsetYPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      setPreviewDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreviewUrl(objectUrl);

    const image = new Image();
    image.onload = () => {
      setPreviewDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  useEffect(() => {
    if (!editorSource) {
      setEditorUrl(null);
      setPreviewDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(editorSource);
    setEditorUrl(objectUrl);

    const image = new Image();
    image.onload = () => {
      setPreviewDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [editorSource]);

  useEffect(() => {
    if (!editorOpen || !isDragging) {
      return;
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (!dragStateRef.current || !cropViewportRef.current) {
        return;
      }

      const width = cropViewportRef.current.clientWidth || 1;
      const height = cropViewportRef.current.clientHeight || 1;
      const deltaXPercent = ((event.clientX - dragStateRef.current.startX) / width) * 100;
      const deltaYPercent = ((event.clientY - dragStateRef.current.startY) / height) * 100;
      setEditorOffsetXPercent(clampAvatarOffset(dragStateRef.current.startOffsetX + deltaXPercent, -40, 40));
      setEditorOffsetYPercent(clampAvatarOffset(dragStateRef.current.startOffsetY + deltaYPercent, -40, 40));
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [editorOpen, isDragging]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function openEditor(file: File) {
    setEditorSource(file);
    setEditorZoom(AVATAR_DEFAULT_ZOOM);
    setEditorOffsetXPercent(0);
    setEditorOffsetYPercent(0);
    setEditorOpen(true);
  }

  function closeEditor() {
    if (isSaving) {
      return;
    }

    setEditorOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function applyEditorChanges() {
    if (!editorSource) {
      return;
    }

    setIsSaving(true);

    try {
      if (!editorUrl || !previewDimensions) {
        return;
      }

      const croppedFile = await cropAvatarFile(
        editorSource,
        editorUrl,
        previewDimensions,
        editorZoom,
        editorOffsetXPercent * AVATAR_VIEWPORT_SIZE / 100,
        editorOffsetYPercent * AVATAR_VIEWPORT_SIZE / 100,
      );
      onChange(croppedFile);
      setEditorOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAvatarClick() {
    if (value) {
      openEditor(value);
      return;
    }

    openFilePicker();
  }

  function handleFileSelection(file: File | null) {
    if (!file) {
      return;
    }

    openEditor(file);
  }

  function openRemoveConfirm() {
    setIsRemoveConfirmOpen(true);
  }

  function closeRemoveConfirm() {
    setIsRemoveConfirmOpen(false);
  }

  function confirmAvatarRemove() {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsRemoveConfirmOpen(false);
  }

  function isImageFile(file: File | null) {
    return Boolean(file && file.type.startsWith("image/"));
  }

  function resetDropState() {
    dropCounterRef.current = 0;
    setIsDropActive(false);
  }

  function handleAvatarDragEnter(event: React.DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    dropCounterRef.current += 1;
    setIsDropActive(true);
  }

  function handleAvatarDragOver(event: React.DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropActive(true);
  }

  function handleAvatarDragLeave(event: React.DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    dropCounterRef.current = Math.max(0, dropCounterRef.current - 1);
    if (dropCounterRef.current === 0) {
      setIsDropActive(false);
    }
  }

  function handleAvatarDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    resetDropState();

    if (!isImageFile(file)) {
      return;
    }

    handleFileSelection(file);
  }

  function handleCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!cropViewportRef.current) {
      return;
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: editorOffsetXPercent,
      startOffsetY: editorOffsetYPercent,
    };
    setIsDragging(true);
  }

  return (
    <div className="relative isolate grid h-full w-full justify-items-center gap-4 p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-8 h-48 rounded-full bg-cyan-100/40 blur-3xl"
      />
      <div className="flex h-full flex-col items-center justify-center space-y-3 text-center">
        <div className="group relative mx-auto">
          <button
            type="button"
            onClick={handleAvatarClick}
            onDragEnter={handleAvatarDragEnter}
            onDragOver={handleAvatarDragOver}
            onDragLeave={handleAvatarDragLeave}
            onDrop={handleAvatarDrop}
            aria-label={value ? "Change profile photo" : "Choose profile photo"}
            title={value ? "Change profile photo" : "Choose profile photo"}
            className={`mx-auto flex aspect-square w-24 items-center justify-center overflow-hidden rounded-full border text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:opacity-95 sm:w-28 lg:w-32 ${isDropActive ? "scale-[1.01] ring-4 ring-cyan-200/70" : ""}`}
            style={{
              borderColor: theme.cardBorder,
              background: theme.tileBackground,
              color: theme.tileValueColor,
            }}
          >
            <div className={`flex h-full w-full items-center justify-center ${previewUrl ? "p-0" : "p-4"}`}>
              {previewUrl ? (
                <img src={previewUrl} alt="Selected avatar preview" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="space-y-2">
                  <span
                    className="mx-auto flex items-center justify-center"
                    style={{
                      color: theme.tileLabelColor,
                    }}
                  >
                    <AvatarSilhouetteIcon className="h-12 w-12" />
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                    Click to select
                  </span>
                </div>
              )}
            </div>
          </button>

          {value ? (
            <button
              type="button"
              onClick={openRemoveConfirm}
              aria-label="Remove profile photo"
              title="Remove profile photo"
              className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-slate-700 opacity-0 transition duration-200 hover:scale-110 hover:text-rose-600 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <TrashIcon />
            </button>
          ) : null}
        </div>

        <p className="text-center text-sm font-semibold" style={{ color: theme.tileValueColor }}>
          Profile Photo / Avatar
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
      />

      {editorOpen && editorUrl && editorSource ? createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close avatar editor"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={closeEditor}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Edit avatar"
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-4xl border bg-white p-0 shadow-2xl"
            style={{
              borderColor: "rgba(59, 130, 246, 0.15)",
              boxShadow: `0 30px 80px -30px ${theme.cardShadow}`,
            }}
          >
            <div className="border-b border-blue-50 bg-blue-50/60 px-6 py-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.level1 }}>
                Profile Photo
              </div>
              <h3 className="mt-1 text-2xl font-semibold" style={{ color: theme.titleColor }}>
                Adjust Avatar Crop
              </h3>
              <p className="mt-2 text-sm" style={{ color: theme.bodyColor }}>
                Choose the square area you want to use as your avatar before saving.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 px-6 py-6">
              <div className="flex w-full items-center justify-center">
                <div className="rounded-4xl border border-blue-50 bg-blue-50/50 p-5">
                  <div
                    ref={cropViewportRef}
                    className={`relative h-60 w-60 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-inner ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                    onPointerDown={handleCropPointerDown}
                  >
                    <img
                      src={editorUrl}
                      alt="Avatar editor preview"
                      draggable={false}
                      className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                      style={{
                        width: previewDimensions
                          ? previewDimensions.width * Math.max(AVATAR_VIEWPORT_SIZE / previewDimensions.width, AVATAR_VIEWPORT_SIZE / previewDimensions.height) * editorZoom
                          : 0,
                        height: previewDimensions
                          ? previewDimensions.height * Math.max(AVATAR_VIEWPORT_SIZE / previewDimensions.width, AVATAR_VIEWPORT_SIZE / previewDimensions.height) * editorZoom
                          : 0,
                        transform: `translate(calc(-50% + ${editorOffsetXPercent}px), calc(-50% + ${editorOffsetYPercent}px))`,
                        userSelect: "none",
                      }}
                    />
                    {!isDragging ? (
                      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-slate-950/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-sm">
                        <DragHintIcon className="h-3.5 w-3.5" />
                        Drag to reposition
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-medium" style={{ color: theme.tileValueColor }}>
                    <span>Zoom</span>
                    <span style={{ color: theme.bodyColor }}>{editorZoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={AVATAR_MIN_ZOOM}
                    max={AVATAR_MAX_ZOOM}
                    step="0.01"
                    value={editorZoom}
                    onChange={(event) => setEditorZoom(Number(event.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" style={{ color: theme.bodyColor }}>
                  Drag the image inside the circle to choose what stays visible in your avatar.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void applyEditorChanges()}
                disabled={isSaving}
                className="rounded-md bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Use This Avatar"}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}

      {isRemoveConfirmOpen ? createPortal(
        <div className="fixed inset-0 z-10000 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close remove avatar dialog"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={closeRemoveConfirm}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Remove profile photo"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border bg-white shadow-2xl"
            style={{
              borderColor: theme.cardBorder,
              boxShadow: `0 24px 70px -28px ${theme.cardShadow}`,
            }}
          >
            <div className="space-y-3 px-6 py-6">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold" style={{ color: theme.titleColor }}>
                  Remove profile photo?
                </h3>
                <p className="text-sm leading-6" style={{ color: theme.bodyColor }}>
                  This will clear the selected avatar. You can add a new one anytime.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRemoveConfirm}
                  className="rounded-2xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                  style={{
                    borderColor: theme.cardBorder,
                    color: theme.titleColor,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAvatarRemove}
                  className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: theme.level1 }}
                >
                  Remove photo
                </button>
              </div>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
  </div>
  );
}

type CustomFormValue = string | string[] | boolean | File | null;
type CustomFormValues = Record<string, CustomFormValue>;
type CustomFormErrors = Record<string, string>;
type CustomQuestionValue = CustomFormValue;
type CustomQuestionValues = Record<string, CustomQuestionValue>;
type CustomQuestionErrors = Record<string, string>;

function buildCustomFormFieldKey(formUniqueId: string, fieldUniqueId: string) {
  return `${formUniqueId}:${fieldUniqueId}`;
}

function buildCustomQuestionKey(questionUniqueId: string) {
  return questionUniqueId;
}

function getCustomFormControlType(controlTypeId: number): string {
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

function parseDelimitedValues(value: string | null | undefined) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function getCustomFormMultiSelectDefaultValue(field: MembershipRegistrationCustomFormField) {
  const selectedValues = field.options.filter((option) => option.isDefault).map((option) => option.value);
  if (selectedValues.length > 0) {
    return Array.from(new Set(selectedValues));
  }

  return parseDelimitedValues(field.defaultValue);
}

function getCustomFormDefaultValue(field: MembershipRegistrationCustomFormField) {
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
    const selectedOption = field.options.find((option) => option.isDefault)?.value || field.defaultValue || "";
    return selectedOption;
  }

  return field.defaultValue || "";
}

function getCustomQuestionControlType(controlType: string) {
  return controlType.trim().toLowerCase();
}

function getCustomQuestionDefaultValue(question: MembershipRegistrationCustomQuestion) {
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
    const selectedOption = question.options.find((option) => option.isDefault)?.value || question.defaultValue || "";
    return selectedOption;
  }

  return question.defaultValue || "";
}

function getCustomQuestionMultiSelectDefaultValue(question: MembershipRegistrationCustomQuestion) {
  const selectedValues = question.options.filter((option) => option.isDefault).map((option) => option.value);
  if (selectedValues.length > 0) {
    return Array.from(new Set(selectedValues));
  }

  return parseDelimitedValues(question.defaultValue);
}

function toSentenceCase(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return "Field";
  }

  const normalized = trimmed.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function parseAcceptedFileTypes(acceptedFileTypes: string | null | undefined) {
  return (acceptedFileTypes ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isFileTypeAccepted(file: File, acceptedFileTypes: string | null | undefined) {
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

function formatAcceptedFileTypes(acceptedFileTypes: string | null | undefined) {
  const rules = parseAcceptedFileTypes(acceptedFileTypes);
  return rules.length > 0 ? rules.join(", ") : "";
}

function getFileValidationError(field: MembershipRegistrationCustomFormField, value: CustomFormValue) {
  const requiredMessage = field.requiredMessage?.trim() || `${toSentenceCase(field.controlLabel)} is required.`;

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

function getCustomQuestionFileValidationError(
  question: MembershipRegistrationCustomQuestion,
  value: CustomQuestionValue,
) {
  const requiredMessage = question.requiredMessage?.trim() || `${toSentenceCase(question.label)} is required.`;

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

function buildCustomFormValues(customForms: MembershipRegistrationCustomFormSummary[]) {
  return customForms.reduce<CustomFormValues>((accumulator, form) => {
    form.fields.forEach((field) => {
      accumulator[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] = getCustomFormDefaultValue(field);
    });

    return accumulator;
  }, {});
}

function buildCustomQuestionValues(customQuestions: MembershipRegistrationCustomQuestion[]) {
  return customQuestions.reduce<CustomQuestionValues>((accumulator, question) => {
    accumulator[buildCustomQuestionKey(question.uniqueId)] = getCustomQuestionDefaultValue(question);
    return accumulator;
  }, {});
}

function validateCustomFormField(
  field: MembershipRegistrationCustomFormField,
  value: CustomFormValue,
) {
  const controlType = getCustomFormControlType(field.formControlTypeId);
  const textValue = typeof value === "string" ? value.trim() : "";
  const normalizedString = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];
  const requiredMessage = field.requiredMessage?.trim() || `${toSentenceCase(field.controlLabel)} is required.`;

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

  if ((controlType === "select" || controlType === "radio") && field.options.length > 0 && textValue) {
    const isValidOption = field.options.some((option) => option.value === normalizedString);
    if (!isValidOption) {
      return "Select a valid option.";
    }
  }

  if (field.isMandatory && !textValue) {
    return requiredMessage;
  }

  if (field.minLength != null && textValue.length > 0 && textValue.length < field.minLength) {
    return `Minimum ${field.minLength} characters required.`;
  }

  if (field.maxLength != null && textValue.length > field.maxLength) {
    return `Maximum ${field.maxLength} characters allowed.`;
  }

  return "";
}

function validateCustomQuestionField(
  question: MembershipRegistrationCustomQuestion,
  value: CustomQuestionValue,
) {
  const controlType = getCustomQuestionControlType(question.controlType);
  const textValue = typeof value === "string" ? value.trim() : "";
  const normalizedString = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];
  const requiredMessage = question.requiredMessage?.trim() || `${toSentenceCase(question.label)} is required.`;

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

  if ((controlType === "select" || controlType === "radio") && question.options.length > 0 && textValue) {
    const isValidOption = question.options.some((option) => option.value === normalizedString);
    if (!isValidOption) {
      return "Select a valid option.";
    }
  }

  if (question.required && !textValue) {
    return requiredMessage;
  }

  if (question.minLength != null && textValue.length > 0 && textValue.length < Number(question.minLength)) {
    return `Minimum ${question.minLength} characters required.`;
  }

  if (question.maxLength != null && textValue.length > Number(question.maxLength)) {
    return `Maximum ${question.maxLength} characters allowed.`;
  }

  return "";
}

function validateCustomForms(
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

function validateCustomQuestions(
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

function getNearestCountryQuestionValue(
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
    return typeof candidateValue === "string" && candidateValue.trim().length > 0 ? candidateValue : null;
  }

  return null;
}

function getCustomQuestionGridClass() {
  return "grid gap-4";
}

function CustomQuestionFieldCard({
  question,
  value,
  error,
  onChange,
  onBlur,
  theme,
  showBorders,
  countryId,
}: {
  question: MembershipRegistrationCustomQuestion;
  value: CustomQuestionValue;
  error: string;
  onChange: (value: CustomQuestionValue) => void;
  onBlur: (value: CustomQuestionValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
  countryId?: string | null;
}) {
  const controlType = getCustomQuestionControlType(question.controlType);
  const label = question.placeHolder || question.label;
  const defaultOptionValue = typeof value === "string" ? value : "";
  const multiSelectValue = Array.isArray(value) ? value : getCustomQuestionMultiSelectDefaultValue(question);
  const checkboxValue = typeof value === "boolean" ? value : false;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const selectedFile = value instanceof File ? value : null;
  const controlBorderClass = getFieldBorderClass(showBorders);
  const dashedBorderClass = getFieldDashedBorderClass(showBorders);
  const tooltipText = question.tooltip?.trim() || "";

  return (
    <div
      className={`group relative space-y-3 rounded-2xl p-4 sm:p-5 ${controlBorderClass}`.trim()}
      style={{ borderColor: theme.cardBorder, background: theme.tileBackground }}
      title={tooltipText || undefined}
    >
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
            {question.label}
            {question.required ? <span className="ml-1 text-rose-600">*</span> : null}
          </p>
          {tooltipText ? <FieldTooltip text={tooltipText} theme={theme} /> : null}
        </div>
      </div>

      {controlType === "textarea" ? (
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur(typeof value === "string" ? value : "")}
          placeholder={label}
          className={`w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ color: theme.titleColor }}
        />
      ) : controlType === "select" && question.options.length > 0 ? (
        <select
          value={defaultOptionValue}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur(defaultOptionValue)}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ color: theme.titleColor }}
        >
          <option value="">{label || "Select one"}</option>
          {question.options.map((option) => (
            <option key={option.uniqueId || option.value} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      ) : controlType === "radio" && question.options.length > 0 ? (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.uniqueId || option.value}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-black/5"
              style={{ color: theme.titleColor }}
            >
              <input
                type="radio"
                name={`custom-question-${question.uniqueId}`}
                checked={defaultOptionValue === option.value}
                onChange={() => onChange(option.value)}
                onBlur={() => onBlur(defaultOptionValue)}
                className="h-4 w-4 accent-cyan-600"
                style={{ accentColor: theme.level1 }}
              />
              <span className="text-sm font-medium">{option.displayText}</span>
            </label>
          ))}
        </div>
      ) : controlType === "checkbox" ? (
        <label className="inline-flex items-center gap-3">
          <input
            type="checkbox"
            checked={checkboxValue}
            onChange={(event) => onChange(event.target.checked)}
            onBlur={() => onBlur(checkboxValue)}
            className="h-4 w-4 accent-cyan-600"
          />
          <span className="text-sm font-medium" style={{ color: theme.titleColor }}>
            {question.label}
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
            accept={question.acceptedFileTypes || undefined}
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            onBlur={() => onBlur(selectedFile)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition hover:shadow-sm sm:px-5 ${dashedBorderClass}`.trim()}
            style={{
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
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                <path d="M12 2.5a6.5 6.5 0 0 0-4.6 11.1l.1.1h-1a4.9 4.9 0 0 0 0 9.8h11a4.9 4.9 0 0 0 0-9.8h-1l.1-.1A6.5 6.5 0 0 0 12 2.5Zm0 2a4.5 4.5 0 0 1 3.2 7.7l-.8.8V9.2a1 1 0 1 0-2 0V13l-1.3-1.3a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0l3-3a1 1 0 1 0-1.4-1.4L15 13V9.2l.8-.8A4.5 4.5 0 0 1 12 4.5Z" />
              </svg>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
                {selectedFile?.name || "Drop a file here or browse"}
              </p>
              <p className="text-xs leading-5" style={{ color: theme.bodyColor }}>
                Drag and drop a file here, or click to choose one from your device.
              </p>
            </div>
          </button>

          {selectedFile ? (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${controlBorderClass}`.trim()}
              style={{ borderColor: theme.cardBorder, background: theme.cardBackground }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: theme.titleColor }}>
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
          onBlur={() => onBlur(typeof value === "string" ? value : "")}
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
          onBlur={() => onBlur(typeof value === "string" ? value : "")}
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
          onBlur={() => onBlur(typeof value === "string" ? value : "")}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "email" ? (
        <input
          type="text"
          inputMode="email"
          autoComplete="email"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur(typeof value === "string" ? value : "")}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur(typeof value === "string" ? value : "")}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      )}

      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function CustomQuestionsSection({
  questions,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
  theme,
  showBorders,
}: {
  questions: MembershipRegistrationCustomQuestion[];
  values: CustomQuestionValues;
  errors: CustomQuestionErrors;
  onFieldChange: (key: string, value: CustomQuestionValue) => void;
  onFieldBlur: (key: string, value: CustomQuestionValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
}) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-4">
      <div className={getCustomQuestionGridClass()}>
        {questions
          .slice()
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map((question, index, sortedQuestions) => {
            const key = buildCustomQuestionKey(question.uniqueId);
            const countryId = getNearestCountryQuestionValue(sortedQuestions, values, index);
            const controlType = getCustomQuestionControlType(question.controlType);

            function handleFieldChange(nextValue: CustomQuestionValue) {
              onFieldChange(key, nextValue);

              if (controlType !== "country") {
                return;
              }

              for (let nextIndex = index + 1; nextIndex < sortedQuestions.length; nextIndex += 1) {
                const nextQuestion = sortedQuestions[nextIndex];
                if (!nextQuestion) {
                  continue;
                }

                const nextType = getCustomQuestionControlType(nextQuestion.controlType);

                if (nextType === "country") {
                  break;
                }

                if (nextType === "state") {
                  onFieldChange(buildCustomQuestionKey(nextQuestion.uniqueId), "");
                }
              }
            }

            return (
              <CustomQuestionFieldCard
                key={question.uniqueId}
                question={question}
                value={values[key] ?? ""}
                error={errors[key] ?? ""}
                onChange={handleFieldChange}
                onBlur={(nextValue) => onFieldBlur(key, nextValue)}
                theme={theme}
                showBorders={showBorders}
                countryId={countryId}
              />
            );
          })}
      </div>
    </div>
  );
}

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

function getCustomFormFieldSpanClass(formLayoutColumn: number, fieldLayoutColumn: number | null) {
  const resolvedLayoutColumn = Math.max(1, Math.min(4, fieldLayoutColumn ?? formLayoutColumn));
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
  const spanClass = getCustomFormFieldSpanClass(formLayoutColumn, field.layoutColumn);

  return (
    <div
      className={`group relative space-y-3 rounded-2xl p-4 sm:p-5 ${controlBorderClass} ${spanClass}`.trim()}
      style={{ borderColor: theme.cardBorder, background: theme.tileBackground }}
      title={tooltipText || undefined}
    >
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
            {field.controlLabel}
            {field.isMandatory ? <span className="ml-1 text-rose-600">*</span> : null}
          </p>
          {tooltipText ? <FieldTooltip text={tooltipText} theme={theme} /> : null}
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
          <span className="text-sm font-medium" style={{ color: theme.titleColor }}>
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
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                <path d="M12 2.5a6.5 6.5 0 0 0-4.6 11.1l.1.1h-1a4.9 4.9 0 0 0 0 9.8h11a4.9 4.9 0 0 0 0-9.8h-1l.1-.1A6.5 6.5 0 0 0 12 2.5Zm0 2a4.5 4.5 0 0 1 3.2 7.7l-.8.8V9.2a1 1 0 1 0-2 0V13l-1.3-1.3a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0l3-3a1 1 0 1 0-1.4-1.4L15 13V9.2l.8-.8A4.5 4.5 0 0 1 12 4.5Z" />
              </svg>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
                {selectedFile?.name || "Drop a file here or browse"}
              </p>
              <p className="text-xs leading-5" style={{ color: theme.bodyColor }}>
                Drag and drop a file here, or click to choose one from your device.
              </p>
            </div>
          </button>

          {selectedFile ? (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${controlBorderClass}`.trim()}
              style={{ borderColor: theme.cardBorder, background: theme.cardBackground }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: theme.titleColor }}>
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

      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
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
  const layoutColumn = form.layoutColumn || 1;
  const fields = [...(form.fields || [])].sort((left, right) => left.displayOrder - right.displayOrder);

  function getNearestCountryValue(targetField: MembershipRegistrationCustomFormField) {
    const countryField = fields
      .filter((candidate) => candidate.displayOrder < targetField.displayOrder)
      .filter((candidate) => getCustomFormControlType(candidate.formControlTypeId) === "country")
      .pop();

    if (!countryField) {
      return null;
    }

    const countryValue = values[buildCustomFormFieldKey(form.uniqueId, countryField.uniqueId)];
    return typeof countryValue === "string" && countryValue.trim().length > 0 ? countryValue : null;
  }

  function handleFieldChange(targetField: MembershipRegistrationCustomFormField, nextValue: CustomFormValue) {
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
        onFieldChange(buildCustomFormFieldKey(form.uniqueId, candidate.uniqueId), "");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight" style={{ color: theme.titleColor }}>
          {displayTitle}
        </h3>
        {displayDescription ? (
          <p className="text-sm leading-6" style={{ color: theme.bodyColor }}>
            {displayDescription}
          </p>
        ) : null}
      </div>

      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-4 py-5 text-sm" style={{ borderColor: theme.cardBorder, color: theme.bodyColor }}>
          This custom form does not contain any fields.
        </div>
      ) : (
        <div className={getCustomFormGridClass(layoutColumn)}>
          {fields.map((field) => (
          <CustomFormFieldCard
            key={field.uniqueId || `${field.formId}-${field.displayOrder}`}
            field={field}
            value={values[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] ?? ""}
            error={errors[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] ?? ""}
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
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: theme.titleColor }}>
                {info.membershipDetail.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-base font-semibold leading-6" style={{ color: theme.bodyColor }}>
                {info.organizerName ? (
                  <span>
                    by <span className="font-extrabold uppercase">{info.organizerName}</span>
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

            <p className="text-base leading-6" style={{ color: theme.bodyColor }}>
              Review the membership charge before moving ahead.
            </p>
          </div>
          {donationCampaignName ? (
            <div
              className="w-full rounded-2xl px-4 py-3 text-center sm:max-w-sm sm:px-5 sm:py-4 lg:ml-auto lg:min-w-56"
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
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4" style={{ background: theme.tileBackground }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
              Amount
            </p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: theme.level1 }}>
              {formattedMembershipCharges}
            </p>
          </div>

          {info.membershipDetail.donationCampaignName ? (
            <div className="space-y-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-4" style={{ background: theme.tileBackground }}>
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
                  className="w-full bg-white px-4 py-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                  style={{ color: theme.titleColor }}
                />
              </label>
              <p className="text-xs leading-5" style={{ color: theme.mutedLabelColor }}>
                Optional. Leave blank if you do not want to donate.
              </p>
            </div>
          ) : null}
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
  const [prefixOptions, setPrefixOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoadingPrefixOptions, setIsLoadingPrefixOptions] = useState(false);
  const [addressTypeOptions, setAddressTypeOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoadingAddressTypeOptions, setIsLoadingAddressTypeOptions] = useState(false);

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
            <WizardField label="Email" theme={theme} error={errors.email} required>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="name@example.com"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
              <WizardField label="Password" theme={theme} error={errors.password} required>
                <PasswordInput
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder="Create password"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
                />
              </WizardField>

              <WizardField label="Confirm Password" theme={theme} error={errors.confirmPassword} required>
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(event) => setField("confirmPassword", event.target.value)}
                  placeholder="Confirm password"
                  className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                  style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
                />
              </WizardField>
            </div>
          </div>
        </div>

        <div className="my-6 w-full border-t border-solid" style={{ borderColor: theme.cardBorder }} aria-hidden="true" />

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
                disabled={isLoadingPrefixOptions && prefixOptions.length === 0}
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              >
                <option value="">
                  {isLoadingPrefixOptions && prefixOptions.length === 0 ? "Loading prefixes..." : "Select prefix"}
                </option>
                {prefixOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </WizardField>

            <WizardField label="First Name" theme={theme} error={errors.firstName}>
              <input
                type="text"
                value={form.firstName}
                onChange={(event) => setField("firstName", event.target.value)}
                placeholder="First name"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <WizardField label="Middle Name" theme={theme}>
              <input
                type="text"
                value={form.middleName}
                onChange={(event) => setField("middleName", event.target.value)}
                placeholder="Middle name"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <WizardField label="Last Name" theme={theme} error={errors.lastName} required>
              <input
                type="text"
                value={form.lastName}
                onChange={(event) => setField("lastName", event.target.value)}
                placeholder="Last name"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <WizardField label="Cell Phone" theme={theme} error={errors.cellPhone}>
              <PhoneInput
                value={form.cellPhone}
                onChange={(value) => setField("cellPhone", value)}
                placeholder="(555) 123-4567"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>
            </div>
          </div>
        </div>

        <div className="my-6 w-full border-t border-solid" style={{ borderColor: theme.cardBorder }} aria-hidden="true" />

        <div className="space-y-4">
          <SectionTitle
            title="Address"
            description="Add an address if you want one attached to your membership record."
            theme={theme}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <WizardField label="Address Type" theme={theme} error={errors.addressType} required>
              <select
                value={form.addressType}
                onChange={(event) => setField("addressType", event.target.value)}
                disabled={isLoadingAddressTypeOptions && addressTypeOptions.length === 0}
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              >
                <option value="">
                  {isLoadingAddressTypeOptions && addressTypeOptions.length === 0
                    ? "Loading address types..."
                    : "Select address type"}
                </option>
                {addressTypeOptions.map((option) => (
                  <option key={option.value || "placeholder"} value={option.value}>
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
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <WizardField label="State List" theme={theme}>
              <StateSelectInput
                countryId={form.countryId}
                value={form.stateId}
                onChange={(value) => setField("stateId", value)}
                placeholder="Select state"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <WizardField label="Line 1" theme={theme} error={errors.streetLine1} required>
              <input
                type="text"
                value={form.streetLine1}
                onChange={(event) => setField("streetLine1", event.target.value)}
                placeholder="Line 1"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <WizardField label="Line 2" theme={theme}>
              <input
                type="text"
                value={form.streetLine2}
                onChange={(event) => setField("streetLine2", event.target.value)}
                placeholder="Line 2"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <WizardField label="City" theme={theme}>
              <input
                type="text"
                value={form.cityName}
                onChange={(event) => setField("cityName", event.target.value)}
                placeholder="City"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
              />
            </WizardField>

            <WizardField label="Zip/Postal Code" theme={theme}>
              <input
                type="text"
                value={form.zipCode}
                onChange={(event) => setField("zipCode", event.target.value)}
                placeholder="Zip / postal code"
                className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
                style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
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
  onCustomQuestionFieldChange: (key: string, value: CustomQuestionValue) => void;
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
  setField: MembershipRegisterWizardProps["setField"];
  theme: MembershipTheme;
};

function ChevronDownIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.41Z" />
    </svg>
  );
}

function PaymentStep({ info, form, paymentMethodError, setField, theme }: PaymentStepProps) {
  const paymentProducts = useMemo(() => {
    return info.paymentSettings.paymentProducts.filter(
      (product, index, array) => array.findIndex((candidate) => candidate.name === product.name) === index,
    );
  }, [info.paymentSettings.paymentProducts]);
  const donationCampaignName = info.membershipDetail.donationCampaignName?.trim();
  const currencyPrefix = buildCurrencyPrefix(info);
  const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
  const donationAmount = donationCampaignName ? parseDonationAmount(form.donationAmount) : 0;
  const presetTips = info.presetTips ?? [];
  const tipAmount = presetTips.length > 0 ? parseDonationAmount(form.tipAmount) : 0;
  const selectedTipPercent = presetTips.length > 0 ? Number(form.tipPresetPercent) : 0;
  const tipAmountInputRef = useRef<HTMLInputElement | null>(null);
  const totalAmount = membershipAmount + donationAmount + tipAmount;
  const formatMoney = (amount: number) => {
    return `${currencyPrefix}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };
  const totalAmountLabel = totalAmount > 0 ? formatMoney(totalAmount) : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel;

  useEffect(() => {
    if (!selectedTipPercent || !presetTips.length) {
      return;
    }

    const matchingPreset = presetTips.find((presetTip) => presetTip.percent === selectedTipPercent);
    if (!matchingPreset) {
      return;
    }

    const presetBaseAmount = membershipAmount + donationAmount;
    const nextTipAmount = ((presetBaseAmount * matchingPreset.percent) / 100).toFixed(2);

    if (form.tipAmount !== nextTipAmount) {
      setField("tipAmount", nextTipAmount);
    }
  }, [donationAmount, form.tipAmount, membershipAmount, presetTips, selectedTipPercent, setField]);

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

  const [openPaymentProduct, setOpenPaymentProduct] = useState<string | null>(null);
  const didInitializeOpenStateRef = useRef(false);

  useEffect(() => {
    if (didInitializeOpenStateRef.current || paymentProducts.length === 0) {
      return;
    }

    didInitializeOpenStateRef.current = true;
    setOpenPaymentProduct(selectedPaymentProduct?.name ?? paymentProducts[0]?.name ?? null);
  }, [paymentProducts, selectedPaymentProduct]);

  if (paymentProducts.length === 0) {
    return (
      <div className="rounded-3xl border px-4 py-5 text-sm leading-6" style={{ borderColor: theme.cardBorder }}>
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

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="order-2 space-y-3 lg:order-1">
          <div className="text-sm leading-6" style={{ color: theme.bodyColor }}>
            Choose one payment method below. You can expand a card to review it and collapse it again if needed.
          </div>

          <div className="space-y-3">
            {paymentProducts.map((product) => {
              const isOpen = openPaymentProduct === product.name;
              const productId = resolvePaymentProductId(product.name);
              const isSelected = productId ? form.paymentMethod.trim() === String(productId) : false;
              const panelId = `payment-method-panel-${product.name}`;
              const buttonId = `payment-method-button-${product.name}`;
              const headerLabel = product.displayName || product.name;

              return (
                <section
                  key={product.name}
                  className="overflow-hidden rounded-3xl border transition"
                  style={{
                    borderColor: isOpen || isSelected ? theme.level1 : theme.cardBorder,
                    background: theme.cardBackground,
                  }}
                >
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => {
                      if (productId) {
                        setField("paymentMethod", String(productId));
                      }

                      setOpenPaymentProduct((current) => (current === product.name ? null : product.name));
                    }}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                          style={{
                            borderColor: isSelected ? theme.level1 : theme.cardBorder,
                            background: isSelected ? theme.level1 : "transparent",
                            color: isSelected ? "#fff" : theme.bodyColor,
                          }}
                          aria-hidden="true"
                        >
                          {isSelected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span className="truncate text-base font-semibold" style={{ color: theme.titleColor }}>
                          {headerLabel}
                        </span>
                      </div>
                    </div>

                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition"
                      style={{
                        borderColor: isOpen ? theme.level1 : theme.cardBorder,
                        color: theme.titleColor,
                      }}
                      aria-hidden="true"
                    >
                      <span
                        className={isOpen ? "rotate-180 transform transition-transform duration-300 ease-out" : "transition-transform duration-300 ease-out"}
                      >
                        <ChevronDownIcon />
                      </span>
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="overflow-hidden border-t px-4"
                      style={{ borderColor: theme.cardBorder }}
                    >
                      <div className="py-4">
                        <p className="text-sm leading-6" style={{ color: theme.bodyColor }}>
                          {headerLabel} will be used for this registration. You can collapse this card after selecting it.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div
          className="order-1 space-y-3 rounded-3xl border px-4 py-4 sm:px-5 sm:py-5 lg:order-2"
          style={{ borderColor: theme.cardBorder, background: theme.tileBackground }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
              What you will pay
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: theme.bodyColor }}>
              Review the amount before selecting a payment method.
            </p>
          </div>

          <div className="rounded-2xl px-4 py-3" style={{ background: theme.cardBackground }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                Membership
              </p>
              <p className="text-base font-semibold text-right" style={{ color: theme.tileValueColor }}>
                {membershipAmount > 0 ? formatMoney(membershipAmount) : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel}
              </p>
            </div>
          </div>

          {donationCampaignName ? (
            <div className="space-y-3 rounded-2xl px-4 py-4" style={{ background: theme.cardBackground }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                    Donation
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5">{donationCampaignName}</p>
                </div>
                <div className="w-full sm:w-[200px]">
                  <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/70 shadow-sm">
                    <span
                      className="flex shrink-0 items-center whitespace-nowrap px-3 text-sm font-semibold"
                      style={{ color: theme.tileValueColor, background: theme.level3 }}
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
                      className="w-full bg-white/70 px-3 py-2.5 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                      style={{ color: theme.titleColor }}
                    />
                  </div>
                </div>
              </div>

              {presetTips.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                    Tip
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <div className="min-w-0 flex-1">
                      <select
                        value={form.tipPresetPercent}
                        onChange={(event) => {
                          if (event.target.value === "other") {
                            setField("tipPresetPercent", "other");
                            setField("tipAmount", "");
                            window.setTimeout(() => {
                              tipAmountInputRef.current?.focus();
                            }, 0);
                            return;
                          }

                          const selectedPreset = presetTips.find((presetTip) => String(presetTip.percent) === event.target.value);
                          if (!selectedPreset) {
                            setField("tipPresetPercent", "");
                            return;
                          }

                          const presetBaseAmount = membershipAmount + donationAmount;
                          const presetAmount = (presetBaseAmount * selectedPreset.percent) / 100;
                          setField("tipPresetPercent", event.target.value);
                          setField("tipAmount", presetAmount > 0 ? presetAmount.toFixed(2) : "");
                        }}
                        className="w-full rounded-2xl border bg-white px-3 py-3 text-left text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                        style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
                      >
                        {presetTips.map((presetTip) => (
                          <option key={presetTip.percent} value={presetTip.percent}>
                            {presetTip.percent}%
                          </option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-[200px]">
                      <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/70 shadow-sm">
                        <span
                          className="flex shrink-0 items-center whitespace-nowrap px-3 text-sm font-semibold"
                          style={{ color: theme.tileValueColor, background: theme.level3 }}
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
                            setField("tipAmount", formatDonationAmountInput(event.target.value));
                          }}
                          onBlur={(event) => {
                            setField("tipPresetPercent", "other");
                            setField("tipAmount", normalizeDonationAmountInput(event.target.value));
                          }}
                          placeholder="0.00"
                          className="w-full bg-white/70 px-3 py-2.5 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                          style={{ color: theme.titleColor }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] leading-4 tracking-wide">
                    <span aria-hidden="true" className="text-[12px] leading-none text-red-500">
                      ♥
                    </span>{" "}
                    If you would like to give a little extra, your tip goes a long way in supporting us.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="border-t" style={{ borderColor: theme.cardBorder }} />

          <div className="rounded-2xl px-4 py-3" style={{ background: theme.cardBackground }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                Total payable
              </p>
              <p className="text-2xl font-bold text-right sm:text-3xl" style={{ color: theme.level1 }}>
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
      setField("tipPresetPercent", presetTips.length > 0 ? String(presetTips[0].percent) : "");
      setField(
        "tipAmount",
        presetTips.length > 0 ? (((membershipAmount + seedDonationAmount) * presetTips[0].percent) / 100).toFixed(2) : "",
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
            setField={setField}
            theme={theme}
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
