export const MEMBERSHIP_PRICING_STEP_NUMBER = 5;
export const MEMBERSHIP_PRICING_NEXT_STEP_NUMBER = 6;

export const MEMBERSHIP_PRICING_CONTENT = {
  title: "Pricing",
  description: "Set the billing cycle that defines this membership plan.",
  helper: "Choose one option before continuing to the next setup step.",
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
    description: "Set a custom expiry pattern later.",
  },
] as const;
