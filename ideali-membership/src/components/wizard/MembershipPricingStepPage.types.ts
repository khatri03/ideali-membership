export interface MembershipPricingStepState {
  selectedPricing: number | null;
  selectedCustomExpiryMonth: number | null;
  selectedCustomExpiryDay: number | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectPricing: (value: number) => void;
  selectCustomExpiryMonth: (value: number | null) => void;
  selectCustomExpiryDay: (value: number | null) => void;
}
