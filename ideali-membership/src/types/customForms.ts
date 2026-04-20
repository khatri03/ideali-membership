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
}

export interface CustomFormOptionDraft {
  id: string;
  displayText: string;
  value: string;
}

export interface CustomFormFieldDraft {
  id: string;
  controlId: number;
  controlName: string;
  controlType: string;
  iconClass: string;
  label: string;
  placeholder: string;
  tooltip: string;
  required: boolean;
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
