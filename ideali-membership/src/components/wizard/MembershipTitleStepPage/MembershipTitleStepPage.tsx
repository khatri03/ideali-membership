import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import { useWizardMembershipTitle } from "../WizardMembershipTitleContext/WizardMembershipTitleContext";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipTitleInfo,
  invalidateMembershipWizardTitleCache,
  saveMembershipTitleStep,
} from "../../../lib/membershipWizard";
import { MembershipTitleError, MembershipTitleStepPageContent } from "./MembershipTitleStepPage.content";

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
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const { setMembershipTitle } = useWizardMembershipTitle();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setMembershipTitle(title);
  }, [setMembershipTitle, title]);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setTitle("");
      setLoadError("");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMembershipTitle() {
      setIsLoading(true);
      setLoadError("");

      try {
        const info = await getMembershipTitleInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setTitle(info.name);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setLoadError(loadError instanceof Error ? loadError.message : "Unable to load membership title.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipTitle();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

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
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
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
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, navigate, setFooterActions, title, isSaving]);

  if (loadError) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipTitleError
          message={loadError}
          onRetry={() => {
            invalidateMembershipWizardTitleCache(currentMembershipTypeUniqueId);
            setReloadTick((current) => current + 1);
          }}
        />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Membership Title</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Set the title for the membership type. This value will be saved as the membership type name.
        </p>
      </div>

      <MembershipTitleStepPageContent error={error} isLoading={isLoading} title={title} onChangeTitle={setTitle} />
    </section>
  );
}

