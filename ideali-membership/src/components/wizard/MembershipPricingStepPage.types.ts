export interface MembershipPricingStepState {
  selectedPricing: number | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectPricing: (value: number) => void;
}
