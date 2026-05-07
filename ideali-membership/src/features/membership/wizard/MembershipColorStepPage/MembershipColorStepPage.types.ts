import type { RefObject } from "react";

export interface MembershipColorStepState {
  selectedPresetColor: string | null;
  customColor: string | null;
  hasInteractedWithCustomColor: boolean;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectPresetColor: (value: string) => void;
  openCustomColorPicker: () => void;
  updateCustomColor: (value: string) => void;
  customColorInputRef: RefObject<HTMLInputElement>;
}
