import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { useNavigate, useParams } from "react-router-dom";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipDescriptionInfo,
  getMembershipTypePlaceholders,
  invalidateMembershipWizardDescriptionCache,
  saveMembershipDescriptionStep,
} from "../../lib/membershipWizard";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import {
  MEMBERSHIP_THANK_YOU_EMAIL_CONTENT,
  MEMBERSHIP_THANK_YOU_EMAIL_NEXT_STEP_NUMBER,
  MEMBERSHIP_THANK_YOU_EMAIL_STEP_NUMBER,
} from "./MembershipThankYouEmailStepPage.fields";
import {
  FontSizeExtension,
  LineHeightExtension,
  MembershipPlaceholderTokenExtension,
} from "./tiptapEmailComposerExtensions";
import type { MembershipThankYouEmailStepState } from "./MembershipThankYouEmailStepPage.types";

async function persistThankYouEmailStepWithFeedback({
  description,
  emailSubject,
  emailTemplate,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  description: string | null;
  emailSubject: string | null;
  emailTemplate: string | null;
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
        description,
        emailSubject,
        emailTemplate,
      },
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save thank you email.");
  } finally {
    setIsSaving(false);
  }
}

function hasMeaningfulEditorContent(editor: ReturnType<typeof useEditor> | null) {
  if (!editor) {
    return false;
  }

  return !editor.isEmpty && editor.getText().trim().length > 0;
}

function validateThankYouEmailStep(emailSubject: string, editor: ReturnType<typeof useEditor> | null) {
  if (emailSubject.trim().length === 0) {
    return "Email subject is required.";
  }

  if (!hasMeaningfulEditorContent(editor)) {
    return "Email body is required.";
  }

  return "";
}

export function useMembershipThankYouEmailStep(): MembershipThankYouEmailStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailTemplateHtml, setEmailTemplateHtml] = useState("<p></p>");
  const [placeholders, setPlaceholders] = useState<MembershipThankYouEmailStepState["placeholders"]>([]);
  const descriptionRef = useRef("<p></p>");
  const emailTemplateRef = useRef("<p></p>");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSizeExtension,
      LineHeightExtension,
      MembershipPlaceholderTokenExtension,
      Link.configure({
        autolink: true,
        defaultProtocol: "https",
        linkOnPaste: true,
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: MEMBERSHIP_THANK_YOU_EMAIL_CONTENT.placeholder,
      }),
    ],
    content: emailTemplateRef.current,
    onUpdate: ({ editor: currentEditor }) => {
      emailTemplateRef.current = currentEditor.getHTML();
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[18rem] rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100",
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

    async function loadThankYouEmail() {
      setIsLoading(true);
      setError("");

      try {
        const [info, placeholderItems] = await Promise.all([
          getMembershipDescriptionInfo(currentMembershipTypeUniqueId),
          getMembershipTypePlaceholders(),
        ]);
        if (!isMounted) {
          return;
        }

        descriptionRef.current = info.description || "<p></p>";
        setEmailSubject(info.emailSubject || "");
        emailTemplateRef.current = info.emailTemplate || "<p></p>";
        setEmailTemplateHtml(info.emailTemplate || "<p></p>");
        setPlaceholders(placeholderItems);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load thank you email.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadThankYouEmail();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(emailTemplateHtml, { emitUpdate: false });
  }, [editor, emailTemplateHtml]);

  useLayoutEffect(() => {
    const persistWithValidation = (onSuccess: (savedMembershipTypeUniqueId: string) => void | Promise<void>) => {
      const validationError = validateThankYouEmailStep(emailSubject, editor);
      if (validationError) {
        setError(validationError);
        return;
      }

      void persistThankYouEmailStepWithFeedback({
        description: descriptionRef.current,
        emailSubject: emailSubject.trim(),
        emailTemplate: emailTemplateRef.current,
        stepNumber: MEMBERSHIP_THANK_YOU_EMAIL_STEP_NUMBER,
        membershipTypeUniqueId: currentMembershipTypeUniqueId,
        setError,
        setIsSaving,
        onSuccess,
      });
    };

    setFooterActions({
      showBack: true,
      showSkip: true,
      showSaveNext: true,
      showSaveExit: true,
      skipLabel: "Skip",
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardQuestions,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_THANK_YOU_EMAIL_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSkip: () =>
        void persistThankYouEmailStepWithFeedback({
          description: descriptionRef.current,
          emailSubject: null,
          emailTemplate: null,
          stepNumber: MEMBERSHIP_THANK_YOU_EMAIL_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardAdvanceSettings,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_THANK_YOU_EMAIL_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveNext: () =>
        persistWithValidation(async (savedMembershipTypeUniqueId) => {
          navigate(
            buildMembershipWizardStepPath(
              APP_ROUTES.membershipWizardAdvanceSettings,
              savedMembershipTypeUniqueId,
              MEMBERSHIP_THANK_YOU_EMAIL_NEXT_STEP_NUMBER,
            ),
            { replace: true },
          );
        }),
      onSaveExit: () =>
        persistWithValidation(async () => {
          navigate(APP_ROUTES.membershipTypes, { replace: true });
        }),
    });
  }, [currentMembershipTypeUniqueId, editor, emailSubject, isSaving, navigate, setFooterActions]);

  return {
    emailSubject,
    editor,
    error,
    isLoading,
    isSaving,
    placeholders,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardDescriptionCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    setEmailSubject,
  };
}
