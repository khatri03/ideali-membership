import type { Editor } from "@tiptap/react";
import type { MembershipTypePlaceholderGroup } from "../../types/membership";

export interface MembershipThankYouEmailStepState {
  emailSubject: string;
  editor: Editor | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
  setEmailSubject: (value: string) => void;
  placeholders: MembershipTypePlaceholderGroup[];
}
