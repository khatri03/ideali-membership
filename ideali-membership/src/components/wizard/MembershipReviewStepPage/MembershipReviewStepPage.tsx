import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import { getMembershipReviewInfo, saveMembershipReviewStep } from "../../../lib/membershipWizard";
import type { MembershipReviewInfo } from "../../../types/membership";
import {
  defaultWizardFooterActions,
  useWizardFooterActions,
} from "../WizardFooterActionsContext/WizardFooterActionsContext";
import {
  MEMBERSHIP_REVIEW_STEP_NUMBER,
} from "./MembershipReviewStepPage.fields";
import { MembershipReviewContent } from "./MembershipReviewStepPage.content";

export function MembershipReviewStepPage() {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [reviewInfo, setReviewInfo] = useState<MembershipReviewInfo | null>(null);
  const [availableForSignUp, setAvailableForSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function saveReviewAndExit() {
    if (!currentMembershipTypeUniqueId) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await saveMembershipReviewStep(
        { availableForSignUp },
        MEMBERSHIP_REVIEW_STEP_NUMBER,
        currentMembershipTypeUniqueId,
      );
      navigate(APP_ROUTES.membershipTypes, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save review settings.");
    } finally {
      setIsSaving(false);
      setIsConfirmOpen(false);
    }
  }

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadReviewInfo() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipReviewInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setReviewInfo(info);
        setAvailableForSignUp(info.availableForSignUp);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setReviewInfo(null);
        setAvailableForSignUp(false);
        setError(loadError instanceof Error ? loadError.message : "Unable to load review data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadReviewInfo();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useLayoutEffect(() => {
    setFooterActions({
      ...defaultWizardFooterActions,
      showBack: true,
      showSkip: false,
      showSaveNext: false,
      showSaveExit: true,
      saveExitLabel: "Save & Exit",
      isSaving,
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardAdvanceSettings,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_REVIEW_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSaveExit: () => {
        setError("");
        setIsConfirmOpen(true);
      },
    });
  }, [currentMembershipTypeUniqueId, isSaving, navigate, setFooterActions]);

  return (
    <MembershipReviewContent
      reviewInfo={reviewInfo}
      availableForSignUp={availableForSignUp}
      isLoading={isLoading}
      error={error}
      isSaving={isSaving}
      isConfirmOpen={isConfirmOpen}
      onToggleAvailableForSignUp={() => setAvailableForSignUp((current) => !current)}
      onRetry={() => {
        if (currentMembershipTypeUniqueId) {
          setReloadTick((current) => current + 1);
        }
      }}
      onCancelConfirm={() => setIsConfirmOpen(false)}
      onConfirmSave={() => void saveReviewAndExit()}
    />
  );
}
