import type { CustomFormControl, CustomFormListItem } from "../../../../types/customForms";
import type { MembershipCustomQuestionDraft } from "../../../../types/membership";

export interface MembershipQuestionsStepState {
  customFormControls: CustomFormControl[];
  customForms: CustomFormListItem[];
  selectedCustomFormUniqueIds: string[];
  customQuestions: MembershipCustomQuestionDraft[];
  isCustomFormDropdownOpen: boolean;
  isCustomQuestionModalOpen: boolean;
  customQuestionDraft: MembershipCustomQuestionDraft | null;
  editingCustomQuestionId: string | null;
  previewCustomFormUniqueId: string;
  previewCustomFormName: string;
  previewCustomFormLoading: boolean;
  previewCustomFormError: string;
  previewCustomFormLayoutColumn: number;
  previewCustomFormFields: Array<{
    id: number;
    displayOrder: number;
    layoutColumn: number | null;
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
  pendingCustomQuestionRemoval: {
    id: string;
    label: string;
  } | null;
  pendingSelectedCustomFormRemoval: {
    id: string;
    label: string;
  } | null;
  reload: () => void;
  toggleCustomForm: (customFormUniqueId: string) => void;
  reorderSelectedCustomFormUniqueIds: (activeCustomFormUniqueId: string, overCustomFormUniqueId: string) => void;
  addCustomQuestion: (draft: MembershipCustomQuestionDraft) => void;
  requestCustomQuestionRemoval: (customQuestionId: string) => void;
  confirmCustomQuestionRemoval: () => void;
  cancelCustomQuestionRemoval: () => void;
  requestSelectedCustomFormRemoval: (customFormUniqueId: string) => void;
  confirmSelectedCustomFormRemoval: () => void;
  cancelSelectedCustomFormRemoval: () => void;
  reorderCustomQuestions: (activeCustomQuestionId: string, overCustomQuestionId: string) => void;
  openCustomQuestionModal: (customQuestionId?: string) => void;
  closeCustomQuestionModal: () => void;
  addCustomQuestionAndContinue: (draft: MembershipCustomQuestionDraft) => void;
  updateCustomQuestionDraft: (updater: (draft: MembershipCustomQuestionDraft) => MembershipCustomQuestionDraft) => void;
  selectCustomQuestionControl: (controlId: number) => void;
  setCustomFormDropdownOpen: (isOpen: boolean) => void;
  openCustomFormPreview: (customFormUniqueId: string) => void;
  closeCustomFormPreview: () => void;
}

