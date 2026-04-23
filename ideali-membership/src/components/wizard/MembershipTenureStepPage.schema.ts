import { MEMBERSHIP_TENURE_OPTIONS } from "./MembershipTenureStepPage.fields";

export function normalizeMembershipTenure(value: number | null) {
  return MEMBERSHIP_TENURE_OPTIONS.some((option) => option.value === value) ? value : null;
}

export function getMembershipTenureError(value: number | null) {
  return normalizeMembershipTenure(value) ? "" : "Please select a membership tenure.";
}
