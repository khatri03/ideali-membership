import type { CustomFormListItem } from "../../types/customForms";

export interface MembershipQuestionsStepState {
  customForms: CustomFormListItem[];
  selectedCustomFormUniqueIds: string[];
  isCustomFormDropdownOpen: boolean;
  previewCustomFormUniqueId: string;
  previewCustomFormName: string;
  previewCustomFormLoading: boolean;
  previewCustomFormError: string;
  previewCustomFormLayoutColumn: number;
  previewCustomFormFields: Array<{
    id: number;
    displayOrder: number;
    controlLabel: string;
    placeHolder: string | null;
    tooltip: string | null;
    isMandatory: boolean;
    defaultValue: string | null;
    options: Array<{
      id: number;
      displayText: string;
      value: string;
    }>;
    controlType: string;
    iconClass: string;
  }>;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  toggleCustomForm: (customFormUniqueId: string) => void;
  reorderSelectedCustomFormUniqueIds: (activeCustomFormUniqueId: string, overCustomFormUniqueId: string) => void;
  setCustomFormDropdownOpen: (isOpen: boolean) => void;
  openCustomFormPreview: (customFormUniqueId: string) => void;
  closeCustomFormPreview: () => void;
}
