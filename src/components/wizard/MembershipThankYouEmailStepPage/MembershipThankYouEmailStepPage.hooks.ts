import { useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { useNavigate, useParams } from "react-router-dom";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipThankYouEmailInfo,
  getMembershipTypePlaceholders,
  invalidateMembershipWizardThankYouEmailCache,
  saveMembershipThankYouEmailStep,
} from "../../../lib/membershipWizard";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
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
  emailSubject,
  emailTemplate,
  notifyOrganizer,
  otherNotificationEmails,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setValidationErrors,
  setIsSaving,
  onSuccess,
}: {
  emailSubject: string | null;
  emailTemplate: string | null;
  notifyOrganizer: boolean;
  otherNotificationEmails: string | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setValidationErrors: (value: { emailBody?: string; emailSubject?: string }) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setValidationErrors({});
  setIsSaving(true);

  try {
    const result = await saveMembershipThankYouEmailStep(
      {
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPlaceholderLabel(value: string) {
  return value
    .replace(/[{}]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPlaceholderLookup(placeholders: MembershipThankYouEmailStepState["placeholders"]) {
  const lookup = new Map<string, { label: string; token: string }>();

  placeholders.forEach((group) => {
    group.items.forEach((item) => {
      const token = item.placeHolderText;
      const label = item.displayText || getPlaceholderLabel(token) || token;
      const normalizedToken = token.trim().toLowerCase();
      const normalizedLabel = label.trim().toLowerCase();

      lookup.set(normalizedToken, { label, token });
      lookup.set(normalizedLabel, { label, token });
      lookup.set(getPlaceholderLabel(token).trim().toLowerCase(), { label, token });
    });
  });

  return lookup;
}

function normalizeSubjectTemplateText(template: string, placeholders: MembershipThankYouEmailStepState["placeholders"]) {
  const rawValue = template.trim();
  if (!rawValue) {
    return "";
  }

  const lookup = buildPlaceholderLookup(placeholders);
  const plainText = /<[^>]+>/.test(rawValue)
    ? (() => {
        const container = document.createElement("div");
        container.innerHTML = rawValue;
        return container.textContent || "";
      })()
    : rawValue;

  const tokenPattern = /\{\{[^}]+\}\}/g;
  const placeholderLabels = Array.from(lookup.values())
    .map((item) => item.label)
    .filter((item, index, array) => array.indexOf(item) === index)
    .sort((a, b) => b.length - a.length)
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const labelPattern = placeholderLabels.length > 0 ? `|${placeholderLabels.join("|")}` : "";
  const matcher = new RegExp(`(${tokenPattern.source}${labelPattern})`, "gi");

  return plainText.replace(matcher, (match) => {
    const normalized = match.trim().toLowerCase();
    return lookup.get(normalized)?.token || match;
  });
}

function buildSubjectEditorHtml(template: string, placeholders: MembershipThankYouEmailStepState["placeholders"]) {
  const normalizedText = normalizeSubjectTemplateText(template, placeholders);
  if (!normalizedText) {
    return "<p></p>";
  }

  const lookup = buildPlaceholderLookup(placeholders);
  const segments = normalizedText.split(/(\{\{[^}]+\}\})/g);

  const html = segments
    .map((segment) => {
      if (!segment) {
        return "";
      }

      const token = segment.trim();
      const placeholder = lookup.get(token.toLowerCase());
      if (placeholder) {
        return [
          "<span",
          ` data-placeholder-label=\"${escapeHtml(placeholder.label)}\"`,
          ` data-placeholder-token=\"${escapeHtml(placeholder.token)}\"`,
          " contenteditable=\"false\"",
          ' class="membership-placeholder-token inline-flex cursor-pointer items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs tracking-wide text-cyan-800 align-baseline transition-colors"',
          ` title=\"${escapeHtml(placeholder.label)}\"`,
          `>${escapeHtml(placeholder.label)}</span>`,
        ].join("");
      }

      return escapeHtml(segment).replace(/\n/g, "<br />");
    })
    .join("");

  return `<p>${html}</p>`;
}

function getPlainTextTemplate(editor: ReturnType<typeof useEditor> | null, fallback: string) {
  if (!editor) {
    return fallback;
  }

  return editor
    .getText({ blockSeparator: " " })
    .replace(/\s+/g, " ")
    .trim();
}

function validateThankYouEmailStep(
  subjectEditor: ReturnType<typeof useEditor> | null,
  editor: ReturnType<typeof useEditor> | null,
) {
  return {
    emailSubject: hasMeaningfulEditorContent(subjectEditor) ? "" : "Email subject is required.",
    emailBody: hasMeaningfulEditorContent(editor) ? "" : "Email body is required.",
  };
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
  const [emailSubjectHtml, setEmailSubjectHtml] = useState("<p></p>");
  const [validationErrors, setValidationErrors] = useState<{
    emailBody?: string;
    emailSubject?: string;
  }>({});
  const [emailTemplateHtml, setEmailTemplateHtml] = useState("<p></p>");
  const [notifyOrganizer, setNotifyOrganizer] = useState(false);
  const [otherNotificationEmails, setOtherNotificationEmails] = useState("");
  const [placeholders, setPlaceholders] = useState<MembershipThankYouEmailStepState["placeholders"]>([]);
  const emailSubjectRef = useRef("<p></p>");
  const emailTemplateRef = useRef("<p></p>");

  const subjectEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSizeExtension,
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
        placeholder: "Write the thank you email subject here...",
      }),
    ],
    content: emailSubjectHtml,
    onUpdate: ({ editor: currentEditor }) => {
      emailSubjectRef.current = getPlainTextTemplate(currentEditor, "");
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[1.75rem] text-sm leading-6 text-slate-900 outline-none",
        "data-wizard-focus": "true",
      },
    },
  });

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
          getMembershipThankYouEmailInfo(currentMembershipTypeUniqueId),
          getMembershipTypePlaceholders(),
        ]);
        if (!isMounted) {
          return;
        }

        emailSubjectRef.current = normalizeSubjectTemplateText(info.emailSubject || "<p></p>", placeholderItems);
        setEmailSubjectHtml(buildSubjectEditorHtml(info.emailSubject || "<p></p>", placeholderItems));
        emailTemplateRef.current = info.emailTemplate || "<p></p>";
        setEmailTemplateHtml(info.emailTemplate || "<p></p>");
        setNotifyOrganizer(info.notifyOrganizer ?? false);
        setOtherNotificationEmails(info.otherNotificationEmails || "");
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
    if (!subjectEditor) {
      return;
    }

    subjectEditor.commands.setContent(emailSubjectHtml, { emitUpdate: false });
  }, [subjectEditor, emailSubjectHtml]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(emailTemplateHtml, { emitUpdate: false });
  }, [editor, emailTemplateHtml]);

  useEffect(() => {
    const persistWithValidation = (onSuccess: (savedMembershipTypeUniqueId: string) => void | Promise<void>) => {
      const nextValidationErrors = validateThankYouEmailStep(subjectEditor, editor);
      setValidationErrors(nextValidationErrors);

      if (nextValidationErrors.emailSubject || nextValidationErrors.emailBody) {
        return;
      }

      const currentEmailSubject = getPlainTextTemplate(subjectEditor, emailSubjectRef.current);
      const currentEmailTemplate = editor?.getHTML() ?? emailTemplateRef.current;

      void persistThankYouEmailStepWithFeedback({
        emailSubject: currentEmailSubject,
        emailTemplate: currentEmailTemplate,
        notifyOrganizer,
        otherNotificationEmails,
        stepNumber: MEMBERSHIP_THANK_YOU_EMAIL_STEP_NUMBER,
        membershipTypeUniqueId: currentMembershipTypeUniqueId,
        setError,
        setValidationErrors,
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
          emailSubject: null,
          emailTemplate: null,
          notifyOrganizer,
          otherNotificationEmails,
          stepNumber: MEMBERSHIP_THANK_YOU_EMAIL_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationErrors: () => setValidationErrors({}),
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
  }, [
    currentMembershipTypeUniqueId,
    editor,
    isSaving,
    navigate,
    notifyOrganizer,
    otherNotificationEmails,
    setFooterActions,
    subjectEditor,
  ]);

  return {
    editor,
    error,
    isLoading,
    isSaving,
    validationErrors,
    notifyOrganizer,
    otherNotificationEmails,
    setNotifyOrganizer,
    setOtherNotificationEmails,
    placeholders,
    subjectEditor,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardThankYouEmailCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
  };
}

