export interface MembershipTypeListItem {
  text: string;
  value: string;
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
