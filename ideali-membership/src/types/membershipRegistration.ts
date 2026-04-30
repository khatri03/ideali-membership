export interface MembershipRegistrationCustomFormSummary {
  uniqueId: string;
  name: string;
  description: string;
  headerText: string;
  layoutColumn: number | null;
  fieldCount: number;
}

export interface MembershipRegistrationDetail {
  uniqueId: string;
  name: string;
  description: string;
  organizerName: string;
  tenure: string | number | null;
  expiresCalendarYear: boolean;
  customExpiryDate: string | null;
  isFree: boolean;
  membershipCharges: number | null;
  allowPartialPayment: boolean;
  customForms: MembershipRegistrationCustomFormSummary[];
}

export interface MembershipRegistrationPaymentSettings {
  paymentAccountId: number | null;
  accountName: string;
  merchantName: string | number;
  paymentCurrencyCode: string | null;
  paymentCurrencySymbol: string | null;
  paymentProducts: number[];
}

export interface MembershipRegistrationInfo {
  uniqueId: string;
  organizerName: string;
  membershipDetail: MembershipRegistrationDetail;
  paymentSettings: MembershipRegistrationPaymentSettings;
  taxSettings: Record<string, unknown> | null;
}

export interface MembershipRegistrationContactAddress {
  streetLine1: string;
  streetLine2: string;
  zipCode: string;
}

export interface MembershipRegistrationFormState {
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  cellPhone: string;
  streetLine1: string;
  streetLine2: string;
  zipCode: string;
  paymentMethod: string;
  notes: string;
}

export interface MembershipRegistrationSubmitRequest {
  contactInfo: {
    prefix: string | null;
    firstName: string;
    middleName: string;
    lastName: string;
    primaryEmail: string;
    cellPhone: string;
    address: MembershipRegistrationContactAddress;
  };
  userInfo: {
    email: string;
    password: string;
    confirmPassword: string;
  };
  addressInfo: MembershipRegistrationContactAddress;
  invoiceDetail: {
    invoiceAmount: number;
    amountPaid: number;
    paymentMethod: number | null;
    notes: string;
    paymentMethodDetail: Record<string, unknown> | null;
    module: number;
    invoiceType: number;
    taxDetail: Record<string, unknown> | null;
    discountDetail: Record<string, unknown> | null;
    invoiceItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      itemType: number;
    }>;
  };
  discountDetail: Record<string, unknown> | null;
}
