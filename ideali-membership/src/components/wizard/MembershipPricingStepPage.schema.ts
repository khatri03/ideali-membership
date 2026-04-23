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
