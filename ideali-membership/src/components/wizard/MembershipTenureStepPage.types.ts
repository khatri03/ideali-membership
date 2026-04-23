export interface MembershipTenureStepState {
  selectedTenure: number | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectTenure: (value: number) => void;
}
