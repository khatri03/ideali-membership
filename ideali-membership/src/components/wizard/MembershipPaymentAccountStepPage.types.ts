import type {
  MembershipPaymentMethodOption,
  OrganizerPaymentAccountSelectionItem,
} from "../../types/membership";

export interface MembershipPaymentAccountStepState {
  paymentAccounts: OrganizerPaymentAccountSelectionItem[];
  selectedPaymentAccountUniqueId: string;
  paymentMethods: MembershipPaymentMethodOption[];
  selectedPaymentMethods: number[];
  error: string;
  validationError: string;
  isLoading: boolean;
  isMethodsLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectPaymentAccount: (paymentAccountUniqueId: string) => void;
  togglePaymentMethod: (paymentMethodId: number) => void;
}
