import type { CustomFormListItem } from "../../types/customForms";

export interface MembershipQuestionsStepState {
  customForms: CustomFormListItem[];
  selectedCustomFormUniqueId: string;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  selectCustomForm: (customFormUniqueId: string) => void;
}
