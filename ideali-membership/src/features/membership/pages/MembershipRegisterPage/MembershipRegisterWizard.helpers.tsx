import type { MembershipRegistrationFormState, MembershipRegistrationInfo } from "../../../../types/membershipRegistration";
import { parseAcceptedFileTypes } from "./MembershipRegisterWizard.questionnaire.helpers";

export function isEnabledFlag(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

export function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPhoneLikeValue(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidDateValue(value: string) {
  if (!value.trim()) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function isValidNumberValue(value: string) {
  if (!value.trim()) {
    return false;
  }

  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

export function formatShortExpiryLabel(value: string | null) {
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

export function formatMonthDayLabel(month: number | null, day: number | null) {
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

export function parseDonationAmount(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildCurrencyPrefix(info: MembershipRegistrationInfo) {
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

export function formatDonationAmountInput(value: string) {
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

export function getFieldBorderClass(showBorders: boolean) {
  return showBorders ? "border" : "";
}

export function getFieldDashedBorderClass(showBorders: boolean) {
  return showBorders ? "border border-dashed" : "";
}

export function normalizeDonationAmountInput(value: string) {
  const parsed = parseDonationAmount(value);
  if (!Number.isFinite(parsed) || value.trim() === "") {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

export function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatRenewalDueLabel(month: number | null, day: number | null) {
  const monthDayLabel = formatMonthDayLabel(month, day);

  if (!monthDayLabel) {
    return null;
  }

  return `Renewal due on\u00A0${monthDayLabel}`;
}

export function renderRenewalDueLabel(label: string | null) {
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

export function formatTenureLabel(value: string | number | null) {
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

export function isLifetimeTenure(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "lifetime" || normalized === "life time";
}

export function formatTenureWithExpiryLabel(info: MembershipRegistrationInfo) {
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

export function isPricingStepComplete(
  form: MembershipRegistrationFormState,
  isFreeMembership: boolean,
) {
  const donationAmount = parseDonationAmount(form.donationAmount);
  const requiresPaymentMethod = !isFreeMembership || donationAmount > 0;

  return requiresPaymentMethod ? Boolean(form.paymentMethod.trim()) : true;
}

export function validateUserLoginStep(form: MembershipRegistrationFormState) {
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

export function validateYourInformationStep(form: MembershipRegistrationFormState) {
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

export function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7 3a1 1 0 0 0-1 1v1H3.5a.5.5 0 0 0 0 1H4l.7 9.1A2 2 0 0 0 6.7 17h6.6a2 2 0 0 0 2-1.9L16 6h.5a.5.5 0 0 0 0-1H14V4a1 1 0 0 0-1-1H7Zm1 2V4h4v1H8Zm-1.2 2h6.4L12.7 15H7.3L6.8 7Zm2 2.2a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Zm3 0a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Z" />
    </svg>
  );
}

export function DragHintIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-6 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM7 13.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

export const AVATAR_VIEWPORT_SIZE = 240;
export const AVATAR_OUTPUT_SIZE = 400;
export const AVATAR_DEFAULT_ZOOM = 1.15;
export const AVATAR_MIN_ZOOM = 1.05;
export const AVATAR_MAX_ZOOM = 3;

export function clampAvatarOffset(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = src;
  });
}

export function buildAvatarFileName(sourceName: string, mimeType: string) {
  const extension =
    mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "png";
  const baseName = sourceName.replace(/\.[^.]+$/, "") || "avatar";
  return `${baseName}-avatar.${extension}`;
}

export function createDummyAvatarFile() {
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

export function createDummyTextFile(fileName: string, content: string, mimeType = "text/plain") {
  return new File([content], fileName, { type: mimeType });
}

export function toDummyFileName(label: string, extension: string) {
  const baseName =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dummy";
  return `${baseName}.${extension}`;
}

export function createDummyFileForAcceptedTypes(acceptedFileTypes: string | null | undefined, label: string) {
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

export function getFirstOptionValue(options: Array<{ label: string; value: string }>) {
  return options.find((option) => option.value.trim())?.value || "";
}

export function buildDummyValueForControlType(
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

export async function cropAvatarFile(
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



