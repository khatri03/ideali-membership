export interface MembershipTypeListItem {
  text: string;
  value: string;
  displayOrder: number;
  hasDiscountCoupons: boolean;
  discountsEnabled: boolean;
  availableForSignUp: boolean;
  setupState: string;
  isFree: boolean;
  membershipCharges: number;
  paymentCurrencyCode: string | null;
  paymentCurrencySymbol: string | null;
  tenureText: string | null;
  customExpiryDays: number | null;
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
}

export interface MembershipTypeOrderListItem {
  uniqueId: string;
  name: string;
  displayOrder: number;
}

export interface MembershipTitleInfo {
  uniqueId: string;
  name: string;
  stepNo: number;
}

export interface OrganizerPaymentAccountSelectionItem {
  uniqueId: string;
  name: string;
  paymentMerchant: string;
  paymentCurrency: string;
  tapToPayEnabled: boolean;
}

export interface MembershipPaymentMethodOption {
  text: string;
  value: number;
}

export interface MembershipQuestionsInfo {
  uniqueId: string;
  customFormUniqueIds: string[];
  customQuestions: MembershipCustomQuestionDraft[];
  stepNo: number;
}

export type DiscountCouponTypeValue = "FixedAmount" | "Percentage";

export interface DiscountCouponListItem {
  uniqueId: string;
  code: string;
  moduleType: string;
  discountType: DiscountCouponTypeValue;
  discountValue: number;
  maxDiscountAmount: number | null;
  totalCoupons: number | null;
  usageCount: number;
  isActive: boolean;
}

export interface MembershipDiscountCouponsInfo {
  discountsEnabled: boolean;
  coupons: DiscountCouponListItem[];
}

export interface MembershipDescriptionInfo {
  uniqueId: string;
  description: string;
  emailSubject: string;
  emailTemplate: string;
  notifyOrganizer: boolean;
  otherNotificationEmails: string;
  stepNo: number;
}

export interface MembershipAdvanceSettingsInfo {
  uniqueId: string;
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  requiresApproval: boolean;
  stepNo: number;
}

export interface MembershipReviewPaymentAccountInfo {
  name: string;
  merchant: string;
  currency: string;
}

export interface MembershipReviewInfo {
  uniqueId: string;
  name: string;
  color: string | null;
  paymentAccount: MembershipReviewPaymentAccountInfo | null;
  isFree: boolean;
  membershipCharges: number;
  tenure: number | null;
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
  customExpiryDays: number | null;
  discountsEnabled: boolean;
  hasQuestions: boolean;
  requiresApproval: boolean;
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  publishedAtUtc: string | null;
  setupState: string;
  availableForSignUp: boolean;
  stepNo: number;
}

export interface MembershipTypePlaceholderItem {
  id?: number;
  uniqueId: string;
  displayText: string;
  placeHolderText: string;
}

export interface MembershipTypePlaceholderGroup {
  label: string;
  items: MembershipTypePlaceholderItem[];
}

export interface MembershipCustomQuestionOptionDraft {
  id: string;
  displayText: string;
  value: string;
  isDefault: boolean;
}

export interface MembershipCustomQuestionDraft {
  id: string;
  controlId: number;
  controlName: string;
  controlType: string;
  iconClass: string;
  label: string;
  placeHolder: string | null;
  tooltip: string | null;
  required: boolean;
  minLength: string | null;
  maxLength: string | null;
  defaultValue: string | null;
  displayOrder: number;
  options: MembershipCustomQuestionOptionDraft[];
}

