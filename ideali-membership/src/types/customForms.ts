export interface CustomFormControl {
  id: number;
  name: string;
  controlType: string;
  iconClass: string;
  defaultLabel: string;
  canBeRequired: boolean;
  hasOptions: boolean;
  canHavePlaceHolder: boolean;
  canHaveMinLength: boolean;
  canHaveMaxLength: boolean;
  acceptedFileTypes: CustomFormListItem[];
}

export interface CustomFormListItem {
  text: string;
  value: string;
}

export interface CustomFormPreviewOption {
  id: number;
  value: string;
  displayText: string;
}

export interface CustomFormPreviewField {
  id: number;
  uniqueId: string;
  formId: number;
  formControlTypeId: number;
  controlUniqueId: string | null;
  displayOrder: number;
  controlLabel: string;
  placeHolder: string | null;
  tooltip: string | null;
  isMandatory: boolean;
  requiredMessage: string | null;
  acceptedFileTypes: string[] | null;
  minLength: number | null;
  maxLength: number | null;
  defaultValue: string | null;
  options: CustomFormPreviewOption[];
  formControl: {
    id: number;
    name: string;
    canBeRequired: boolean;
    canHaveMaxLength: boolean;
    canHaveMinLength: boolean;
    canHavePlaceHolder: boolean;
    controlType: string;
    defaultLabel: string;
    hasOptions: boolean;
    iconClass: string;
  } | null;
}

export interface CustomFormPreview {
  uniqueId: string;
  name: string;
  headerText: string;
  description: string | null;
  layoutColumn: number;
  fields: CustomFormPreviewField[];
}

export interface CustomFormSummary {
  id: number;
  uniqueId: string;
  name: string;
  headerText: string;
  description: string | null;
  totalFields: number;
}

export interface CustomFormOptionDraft {
  id: string;
  displayText: string;
  value: string;
  isDefault: boolean;
}

export interface CustomFormFieldDraft {
  id: string;
  uniqueId: string;
  controlUniqueId: string;
  controlId: number;
  controlName: string;
  controlType: string;
  iconClass: string;
  label: string;
  placeholder: string;
  tooltip: string;
  required: boolean;
  requiredMessage: string;
  acceptedFileTypes: string[];
  minLength: string;
  maxLength: string;
  defaultValue: string;
  displayOrder: number;
  options: CustomFormOptionDraft[];
}

export interface CustomFormDraft {
  name: string;
  headerText: string;
  description: string;
  layoutColumn: number;
}
