export interface MembershipRegistrationCustomFormOption {
  uniqueId: string;
  displayText: string;
  value: string;
  isDefault: boolean;
}

export interface MembershipRegistrationCustomFormField {
  id: number;
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
  isFree: boolean;
  membershipCharges: number | null;
  allowPartialPayment: boolean;
  discountsEnabled: boolean;
  color: string | null;
  bannerUrl: string | null;
  customForms: MembershipRegistrationCustomFormSummary[];
  customQuestions: MembershipRegistrationCustomQuestion[];
}

export interface MembershipRegistrationPaymentSettings {
  paymentAccountId: number | null;
  paymentAccountUniqueId: string | null;
  accountName: string;
  merchantName: string | number;
  paymentCurrencyCode: string | null;
  paymentCurrencySymbol: string | null;
  paymentProducts: MembershipRegistrationPaymentProduct[];
}

export interface MembershipRegistrationPaymentProduct {
  name: string;
  displayName: string;
}

export interface MembershipRegistrationPresetTip {
  percent: number;
  isDefault: boolean;
}

export interface MembershipRegistrationStripeCredentials {
  publishableKey: string;
  stripeAccount: string;
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
  presetTips: MembershipRegistrationPresetTip[];
  taxSettings: Record<string, unknown> | null;
  discountsEnabled: boolean;
  hasActiveCoupons: boolean;
}

export interface DiscountCouponValidationResult {
  isValid: boolean;
  errorMessage: string | null;
  couponUniqueId: string | null;
  code: string | null;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
  finalAmount: number;
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
  tipPresetPercent: string;
  tipAmount: string;
  paymentMethod: string;
  couponCode: string;
  notes: string;
}

export interface MembershipRegistrationPaymentMethodDetail {
  paymentMethodId: string;
  cardHolderName?: string | null;
}

export interface MembershipRegistrationCustomFormResponse {
  fieldId: number;
  value: string;
  file?: File | null;
}

export interface MembershipRegistrationCustomQuestionResponse {
  questionUniqueId: string;
  optionUniqueId?: string | null;
  fileStorageId?: number | null;
  file?: File | null;
  value?: string | null;
}

export interface MembershipRegistrationSubmitContext {
  paymentMethodDetail: MembershipRegistrationPaymentMethodDetail | null;
  customFormResponses: MembershipRegistrationCustomFormResponse[];
  customQuestionResponses: MembershipRegistrationCustomQuestionResponse[];
  submissionPreferences: MembershipRegistrationSubmissionPreferences;
  couponUniqueId: string | null;
  discountType: string | null;
  discountAmount: number | null;
}

export interface MembershipRegistrationSubmissionPreferences {
  logToConsole: boolean;
  submitToApi: boolean;
}
