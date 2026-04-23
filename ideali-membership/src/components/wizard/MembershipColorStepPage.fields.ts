export const MEMBERSHIP_COLOR_STEP_NUMBER = 4;
export const MEMBERSHIP_COLOR_NEXT_STEP_NUMBER = 5;
export const MEMBERSHIP_COLOR_DEFAULT = "#4f46e5";

export const MEMBERSHIP_COLOR_CONTENT = {
  title: "Color",
  description:
    "Choose the main color for this membership type. It is optional, so you can skip it and come back later.",
  helper:
    "This color affects how the membership feels in the organizer flow and on member-facing surfaces.",
  customTitle: "Custom color",
} as const;

export const MEMBERSHIP_COLOR_SWATCHES = [
  { label: "Blue", value: "#2563eb" },
  { label: "Teal", value: "#0f766e" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Green", value: "#16a34a" },
  { label: "Amber", value: "#d97706" },
  { label: "Orange", value: "#ea580c" },
  { label: "Red", value: "#dc2626" },
  { label: "Pink", value: "#db2777" },
  { label: "Purple", value: "#9333ea" },
  { label: "Slate", value: "#475569" },
] as const;
