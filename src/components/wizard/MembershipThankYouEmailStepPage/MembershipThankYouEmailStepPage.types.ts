import type { Editor } from "@tiptap/react";
import type { MembershipTypePlaceholderGroup } from "../../../types/membership";

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
  notifyOrganizer: boolean;
  otherNotificationEmails: string;
  setNotifyOrganizer: (value: boolean) => void;
  setOtherNotificationEmails: (value: string) => void;
  reload: () => void;
  placeholders: MembershipTypePlaceholderGroup[];
}

