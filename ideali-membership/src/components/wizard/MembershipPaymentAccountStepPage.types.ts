import type { OrganizerPaymentAccountSummary } from "../../types/auth";

export interface MembershipPaymentAccountStepState {
  paymentAccounts: OrganizerPaymentAccountSummary[];
  selectedPaymentAccountUniqueId: string;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectPaymentAccount: (paymentAccountUniqueId: string) => void;
}
