export interface MembershipRegistrationCustomFormOption {
  uniqueId: string;
  displayText: string;
  value: string;
  isDefault: boolean;
}

export interface MembershipRegistrationCustomFormField {
  uniqueId: string;
  formId: number;
  formControlTypeId: number;
  controlUniqueId: string | null;
  displayOrder: number;
  layoutColumn: number | null;
  controlLabel: string;
  placeHolder: string | null;
  tooltip: string | null;
  isMandatory: boolean;
  requiredMessage: string | null;
  acceptedFileTypes: string | null;
  minLength: number | null;
  maxLength: number | null;
  defaultValue: string | null;
  options: MembershipRegistrationCustomFormOption[];
}

export interface MembershipRegistrationCustomFormSummary {
  uniqueId: string;
  name: string;
  description: string;
  headerText: string;
  layoutColumn: number | null;
  fieldCount: number;
  fields: MembershipRegistrationCustomFormField[];
}

export interface MembershipRegistrationCustomQuestionOption {
  uniqueId: string;
  displayText: string;
  value: string;
  isDefault: boolean;
}

export interface MembershipRegistrationCustomQuestion {
  uniqueId: string;
  controlId: number;
  controlName: string;
  controlType: string;
  iconClass: string;
  label: string;
  placeHolder: string | null;
  tooltip: string | null;
  required: boolean;
  requiredMessage: string | null;
  minLength: string | null;
  maxLength: string | null;
  acceptedFileTypes: string | null;
  defaultValue: string | null;
  displayOrder: number;
  options: MembershipRegistrationCustomQuestionOption[];
}

export interface MembershipRegistrationDetail {
  uniqueId: string;
  name: string;
  description: string;
  organizerName: string;
  tenure: string | number | null;
  expiresCalendarYear: boolean;
  customExpiryDate: string | null;
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
  customExpiryDays: number | null;
  donationCampaignUniqueId: string | null;
  donationCampaignName: string | null;
  isFree: boolean;
  membershipCharges: number | null;
  allowPartialPayment: boolean;
  color: string | null;
  customForms: MembershipRegistrationCustomFormSummary[];
  customQuestions: MembershipRegistrationCustomQuestion[];
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
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  registrationState: "Open" | "Upcoming" | "Closed" | "Unavailable";
  canRegister: boolean;
  membershipDetail: MembershipRegistrationDetail;
  paymentSettings: MembershipRegistrationPaymentSettings;
  taxSettings: Record<string, unknown> | null;
}

export interface MembershipRegistrationContactAddress {
  addressType: string | null;
  streetLine1: string | null;
  streetLine2: string | null;
  zipCode: string | null;
  cityName: string | null;
  countryId: number | null;
  stateId: number | null;
}

export interface MembershipRegistrationFormState {
  profilePhotoFile: File | null;
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
  addressType: string;
  cityName: string;
  countryId: string;
  stateId: string;
  donationAmount: string;
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
    profilePhotoFileStorageId: number | null;
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
