import type { FormEvent } from "react";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
} from "../../../../types/membershipRegistration";

export interface MembershipRegisterPageViewModel {
  info: MembershipRegistrationInfo | null;
  form: MembershipRegistrationFormState;
  isLoading: boolean;
  loadError: string;
  registrationState: MembershipRegistrationInfo["registrationState"];
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  submitError: string;
  submitMessage: string;
  isSubmitting: boolean;
  isRegistrationUnavailable: boolean;
  errors: Partial<Record<keyof MembershipRegistrationFormState, string>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRetry: () => void;
  setField: <T extends keyof MembershipRegistrationFormState>(field: T, value: MembershipRegistrationFormState[T]) => void;
}

