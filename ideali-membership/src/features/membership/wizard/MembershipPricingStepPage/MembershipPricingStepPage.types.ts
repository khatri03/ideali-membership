export interface MembershipPricingStepState {
  selectedPricing: number | null;
  selectedMembershipCharges: string;
  selectedAnnualExpiryMode: "renewal" | "custom";
  selectedCustomExpiryMonth: number | null;
  selectedCustomExpiryDay: number | null;
  selectedCustomExpiryDays: number | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectPricing: (value: number) => void;
  selectMembershipCharges: (value: string) => void;
  selectAnnualExpiryMode: (value: "renewal" | "custom") => void;
  selectCustomExpiryMonth: (value: number | null) => void;
  selectCustomExpiryDay: (value: number | null) => void;
  selectCustomExpiryDays: (value: number | null) => void;
}
