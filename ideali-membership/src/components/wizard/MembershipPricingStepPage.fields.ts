export const MEMBERSHIP_PRICING_STEP_NUMBER = 6;
export const MEMBERSHIP_PRICING_NEXT_STEP_NUMBER = 7;

export const MEMBERSHIP_PRICING_CONTENT = {
  title: "Pricing",
  description: "Set the billing cycle that defines this membership plan.",
  helper: "Choose one option before continuing to the next setup step.",
  annualHelper: "Choose both month and date while Annual is selected.",
  customHelper: "Enter how many days after subscription this membership should expire.",
} as const;

export const MEMBERSHIP_PRICING_OPTIONS = [
  {
    label: "Monthly",
    value: 1,
    description: "Renewed every month.",
  },
  {
    label: "Annual",
    value: 2,
    description: "Renewed once per year.",
  },
  {
    label: "Life Time",
    value: 3,
    description: "A one-time membership with no expiry.",
  },
  {
    label: "Custom",
    value: 4,
    description: "Set a custom expiry period in days.",
  },
] as const;

export const MEMBERSHIP_PRICING_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

export function getMembershipPricingDays(month: number | null | undefined) {
  if (!month || month < 1 || month > 12) {
    return [];
  }

  const daysInMonth = new Date(2024, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => index + 1);
}
