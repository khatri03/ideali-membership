export interface MembershipAdvanceSettingsStepState {
  registrationWindowEnabled: boolean;
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  error: string;
  validationError: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  setRegistrationWindowEnabled: (value: boolean) => void;
  setRegistrationStartDateUtc: (value: Date | null) => void;
  setRegistrationEndDateUtc: (value: Date | null) => void;
}
