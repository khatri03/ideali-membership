import { MEMBERSHIP_COLOR_SWATCHES } from "./MembershipColorStepPage.fields";

export type MembershipColorSelection = {
  selectedPresetColor: string | null;
  customColor: string | null;
  hasInteractedWithCustomColor: boolean;
};

export const initialMembershipColorSelection: MembershipColorSelection = {
  selectedPresetColor: null,
  customColor: null,
  hasInteractedWithCustomColor: false,
};

export function normalizeMembershipColor(value: string) {
  return value.trim().toLowerCase();
}

export function getMembershipColorError(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Membership color is required.";
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmedValue)) {
    return "Membership color must be a valid hex value.";
  }

  return "";
}

export function toMembershipColorSelection(color?: string | null): MembershipColorSelection {
  if (!color) {
    return initialMembershipColorSelection;
  }

  const normalizedColor = color.toLowerCase();
  const presetMatch = MEMBERSHIP_COLOR_SWATCHES.find((item) => item.value === normalizedColor);

  if (presetMatch) {
    return {
      selectedPresetColor: presetMatch.value,
      customColor: null,
      hasInteractedWithCustomColor: false,
    };
  }

  return {
    selectedPresetColor: null,
    customColor: normalizedColor,
    hasInteractedWithCustomColor: true,
  };
}
