export interface MembershipTypeListItem {
  text: string;
  value: string;
  hasDiscountCoupons: boolean;
  discountsEnabled: boolean;
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

