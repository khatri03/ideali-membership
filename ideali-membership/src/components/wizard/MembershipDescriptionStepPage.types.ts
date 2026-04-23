import type { Editor } from "@tiptap/react";

export interface MembershipDescriptionStepState {
  editor: Editor | null;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => void;
}
