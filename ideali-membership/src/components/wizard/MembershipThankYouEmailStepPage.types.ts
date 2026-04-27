import type { Editor } from "@tiptap/react";
import type { MembershipTypePlaceholderGroup } from "../../types/membership";

export interface MembershipThankYouEmailStepState {
  editor: Editor | null;
  subjectEditor: Editor | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  validationErrors: {
    emailBody?: string;
    emailSubject?: string;
  };
  reload: () => void;
  placeholders: MembershipTypePlaceholderGroup[];
}
