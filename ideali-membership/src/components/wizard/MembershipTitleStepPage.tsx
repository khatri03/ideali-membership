import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipTitleInfo,
  invalidateMembershipWizardTitleCache,
  saveMembershipTitleStep,
} from "../../lib/membershipWizard";

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

function MembershipTitleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function MembershipTitleError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-400/50 text-[10px] font-bold">
          !
        </div>
        <div className="space-y-2">
          <p>{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
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
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setLoadError("Membership type unique id is missing.");
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

      <div className="mt-8 max-w-2xl space-y-3">
        {isLoading ? (
          <MembershipTitleSkeleton />
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  );
}
