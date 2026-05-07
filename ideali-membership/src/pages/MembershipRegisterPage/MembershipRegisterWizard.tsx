import { createPortal } from "react-dom";
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
import type { MembershipRegisterPageViewModel } from "./MembershipRegisterPage.types";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import { PaymentStep as PaymentStepView } from "./MembershipRegisterWizardPaymentStep";
import {
  buildCustomFormFieldKey,
  buildCustomFormValues,
  buildCustomQuestionKey,
  buildCustomQuestionValues,
  getCustomFormControlType,
  getCustomQuestionControlType,
  getFileValidationError,
  parseAcceptedFileTypes,
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
import {
  AvatarSilhouetteIcon,
  CameraIcon,
  MembershipTheme,
  StepBadge,
} from "./MembershipRegisterWizard.shared";
import { PricingStep } from "./MembershipRegisterWizard.pricing";
import { YourInformationStep as YourInformationStepView } from "./MembershipRegisterWizard.personalInfo";
import { QuestionnaireStep as QuestionnaireStepView } from "./MembershipRegisterWizard.questionnaire";

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

function isEnabledFlag(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "true";
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


