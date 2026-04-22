import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import { getMembershipTitleInfo, saveMembershipTitleStep } from "../../lib/membershipWizard";

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 80;

function getTitleError(title: string) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return "Membership title is required.";
  }

  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    return `Membership title must be at least ${MIN_TITLE_LENGTH} characters.`;
  }

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return `Membership title must be at most ${MAX_TITLE_LENGTH} characters.`;
  }

  return "";
}

async function saveMembershipTitleStepWithFeedback({
  title,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  title: string;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  const nextError = getTitleError(title);
  if (nextError) {
    setError(nextError);
    return;
  }

  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipTitleStep(title.trim(), stepNumber, membershipTypeUniqueId);
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership title.");
  } finally {
    setIsSaving(false);
  }
}

export function MembershipTitleStepPage() {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const { setFooterActions } = useWizardFooterActions();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!membershipTypeUniqueId) {
      return;
    }

    let isMounted = true;

    async function loadMembershipTitle() {
      try {
        const info = await getMembershipTitleInfo(membershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setTitle(info.name);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load membership title.");
      }
    }

    void loadMembershipTitle();

    return () => {
      isMounted = false;
    };
  }, [membershipTypeUniqueId]);

  useLayoutEffect(() => {
    setFooterActions({
      showBack: false,
      showSaveNext: true,
      showSaveExit: true,
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onSaveNext: async () =>
        saveMembershipTitleStepWithFeedback({
          title,
          stepNumber: 1,
          membershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardDescription,
                savedMembershipTypeUniqueId,
                2,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: async () =>
        saveMembershipTitleStepWithFeedback({
          title,
          stepNumber: 1,
          membershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [membershipTypeUniqueId, navigate, setFooterActions, title, isSaving]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700">
        <span className="h-2 w-2 rounded-full bg-cyan-500" />
        Membership wizard step
      </div>

      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Membership Title</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Set the title for the membership type. This value will be saved as the membership type name.
        </p>
      </div>

      <div className="mt-8 max-w-2xl space-y-3">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            Membership Title
            <span className="text-rose-600" aria-label="Required" title="Required">
              *
            </span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter membership title"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "membership-title-error" : undefined}
          />
        </label>

        <p className="text-xs text-slate-500">3-80 characters.</p>

        {error ? (
          <p id="membership-title-error" className="text-sm font-medium text-rose-600">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
