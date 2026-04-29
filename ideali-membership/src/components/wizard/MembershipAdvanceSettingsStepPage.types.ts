export interface MembershipAdvanceSettingsStepState {
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  error: string;
  validationError: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  setRegistrationStartDateUtc: (value: Date | null) => void;
  setRegistrationEndDateUtc: (value: Date | null) => void;
}
