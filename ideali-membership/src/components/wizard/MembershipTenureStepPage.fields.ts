export const MEMBERSHIP_TENURE_STEP_NUMBER = 3;
export const MEMBERSHIP_TENURE_NEXT_STEP_NUMBER = 4;

export const MEMBERSHIP_TENURE_CONTENT = {
  title: "Tenure",
  description: "Select how long this membership stays active.",
  helper: "Choose one option before continuing to the next step.",
} as const;

export const MEMBERSHIP_TENURE_OPTIONS = [
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
