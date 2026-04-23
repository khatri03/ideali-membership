import { MEMBERSHIP_PRICING_OPTIONS } from "./MembershipPricingStepPage.fields";

export function normalizeMembershipPricing(value: number | null) {
  return MEMBERSHIP_PRICING_OPTIONS.some((option) => option.value === value) ? value : null;
}

export function getMembershipPricingError(value: number | null) {
  return normalizeMembershipPricing(value) ? "" : "Please select a pricing option.";
}

export function normalizeMembershipPricingMonth(value: number | null) {
  return typeof value === "number" && value >= 1 && value <= 12 ? value : null;
}

export function normalizeMembershipPricingDay(value: number | null, month: number | null) {
  if (!month || month < 1 || month > 12 || typeof value !== "number") {
    return null;
  }

  const maxDays = new Date(2024, month, 0).getDate();
  return value >= 1 && value <= maxDays ? value : null;
}

export function normalizeMembershipPricingDays(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 ? Math.floor(value) : null;
}

export function formatMembershipPricingAmount(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sanitizeMembershipPricingAmountInput(value: string) {
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const [integerPartRaw = "", decimalPartRaw = ""] = cleaned.split(".");
  const integerDigits = integerPartRaw.replace(/\D/g, "");
  const decimalDigits = decimalPartRaw.replace(/\D/g, "").slice(0, 2);
  const formattedInteger = integerDigits ? Number(integerDigits).toLocaleString("en-US") : "";
  const hadDecimalSeparator = cleaned.includes(".");

  if (!formattedInteger && !decimalDigits && !hadDecimalSeparator) {
    return "";
  }

  if (!hadDecimalSeparator) {
    return formattedInteger;
  }

  return `${formattedInteger}${formattedInteger ? "." : ""}${decimalDigits}`;
}

export function parseMembershipPricingAmount(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}
