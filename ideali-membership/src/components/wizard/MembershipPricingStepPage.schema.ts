import { MEMBERSHIP_PRICING_OPTIONS } from "./MembershipPricingStepPage.fields";

export function normalizeMembershipPricing(value: number | null) {
  return MEMBERSHIP_PRICING_OPTIONS.some((option) => option.value === value) ? value : null;
}

export function getMembershipPricingError(value: number | null) {
  return normalizeMembershipPricing(value) ? "" : "Please select a pricing option.";
}
