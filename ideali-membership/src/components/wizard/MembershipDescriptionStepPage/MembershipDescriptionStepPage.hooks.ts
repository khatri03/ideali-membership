import { useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { useNavigate, useParams } from "react-router-dom";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipDescriptionInfo,
  invalidateMembershipWizardDescriptionCache,
  saveMembershipDescriptionStep,
} from "../../../lib/membershipWizard";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import {
  MEMBERSHIP_DESCRIPTION_CONTENT,
  MEMBERSHIP_DESCRIPTION_NEXT_STEP_NUMBER,
  MEMBERSHIP_DESCRIPTION_STEP_NUMBER,
} from "./MembershipDescriptionStepPage.fields";
import { normalizeMembershipDescription } from "./MembershipDescriptionStepPage.schema";
import type { MembershipDescriptionStepState } from "./MembershipDescriptionStepPage.types";

async function persistMembershipDescriptionStepWithFeedback({
  description,
  emailSubject,
  emailTemplate,
  notifyOrganizer,
  otherNotificationEmails,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  description: string | null;
  emailSubject: string | null;
  emailTemplate: string | null;
  notifyOrganizer: boolean;
  otherNotificationEmails: string | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipDescriptionStep(
      {
        description: normalizeMembershipDescription(description),
        emailSubject,
        emailTemplate,
        notifyOrganizer,
        otherNotificationEmails,
      },
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership description.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipDescriptionStep(): MembershipDescriptionStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [descriptionHtml, setDescriptionHtml] = useState("<p></p>");
  const editorContentRef = useRef<string>("<p></p>");
  const emailSubjectRef = useRef<string>("");
  const emailTemplateRef = useRef<string>("<p></p>");
  const notifyOrganizerRef = useRef(false);
  const otherNotificationEmailsRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: MEMBERSHIP_DESCRIPTION_CONTENT.placeholder,
      }),
    ],
    content: editorContentRef.current,
    onUpdate: ({ editor: currentEditor }) => {
      editorContentRef.current = currentEditor.getHTML();
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[18rem] rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100",
        "data-wizard-focus": "true",
      },
    },
  });

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMembershipDescription() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipDescriptionInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        const nextDescriptionHtml = info.description || "<p></p>";
        editorContentRef.current = nextDescriptionHtml;
        emailSubjectRef.current = info.emailSubject || "";
        emailTemplateRef.current = info.emailTemplate || "<p></p>";
        notifyOrganizerRef.current = info.notifyOrganizer ?? false;
        otherNotificationEmailsRef.current = info.otherNotificationEmails || "";
        setDescriptionHtml(nextDescriptionHtml);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load membership description.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipDescription();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(descriptionHtml, { emitUpdate: false });
  }, [descriptionHtml, editor]);

  useEffect(() => {
    setFooterActions({
      showBack: true,
      showSkip: true,
      showSaveNext: true,
      showSaveExit: true,
      skipLabel: "Skip",
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onSkip: () =>
        void persistMembershipDescriptionStepWithFeedback({
          description: null,
          emailSubject: emailSubjectRef.current.trim().length > 0 ? emailSubjectRef.current : null,
          emailTemplate: emailTemplateRef.current.trim().length > 0 ? emailTemplateRef.current : null,
          notifyOrganizer: notifyOrganizerRef.current,
          otherNotificationEmails: otherNotificationEmailsRef.current.trim().length > 0 ? otherNotificationEmailsRef.current : null,
          stepNumber: MEMBERSHIP_DESCRIPTION_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardColor,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_DESCRIPTION_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveNext: () =>
        void persistMembershipDescriptionStepWithFeedback({
          description: editorContentRef.current,
          emailSubject: emailSubjectRef.current.trim().length > 0 ? emailSubjectRef.current : null,
          emailTemplate: emailTemplateRef.current.trim().length > 0 ? emailTemplateRef.current : null,
          notifyOrganizer: notifyOrganizerRef.current,
          otherNotificationEmails: otherNotificationEmailsRef.current.trim().length > 0 ? otherNotificationEmailsRef.current : null,
          stepNumber: MEMBERSHIP_DESCRIPTION_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardColor,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_DESCRIPTION_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipDescriptionStepWithFeedback({
          description: editorContentRef.current,
          emailSubject: emailSubjectRef.current.trim().length > 0 ? emailSubjectRef.current : null,
          emailTemplate: emailTemplateRef.current.trim().length > 0 ? emailTemplateRef.current : null,
          notifyOrganizer: notifyOrganizerRef.current,
          otherNotificationEmails: otherNotificationEmailsRef.current.trim().length > 0 ? otherNotificationEmailsRef.current : null,
          stepNumber: MEMBERSHIP_DESCRIPTION_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, editor, isSaving, navigate, setFooterActions]);

  return {
    editor,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardDescriptionCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
  };
}

