import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipBannerInfo,
  invalidateMembershipWizardBannerCache,
  saveMembershipBannerStep,
} from "../../lib/membershipWizard";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import {
  MEMBERSHIP_BANNER_NEXT_STEP_NUMBER,
  MEMBERSHIP_BANNER_STEP_NUMBER,
} from "./MembershipBannerStepPage.fields";
import { normalizeMembershipBannerUrl } from "./MembershipBannerStepPage.schema";
import type { MembershipBannerStepState } from "./MembershipBannerStepPage.types";

async function persistMembershipBannerStepWithFeedback({
  bannerUrl,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  bannerUrl: string | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipBannerStep(
      normalizeMembershipBannerUrl(bannerUrl),
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership banner.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipBannerStep(): MembershipBannerStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [bannerUrl, setBannerUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMembershipBanner() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipBannerInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setBannerUrl(info.bannerUrl);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setBannerUrl("");
        setError(loadError instanceof Error ? loadError.message : "Unable to load membership banner.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipBanner();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useLayoutEffect(() => {
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
        void persistMembershipBannerStepWithFeedback({
          bannerUrl: null,
          stepNumber: MEMBERSHIP_BANNER_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardPricing,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_BANNER_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveNext: () =>
        void persistMembershipBannerStepWithFeedback({
          bannerUrl,
          stepNumber: MEMBERSHIP_BANNER_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardPricing,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_BANNER_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipBannerStepWithFeedback({
          bannerUrl,
          stepNumber: MEMBERSHIP_BANNER_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [bannerUrl, currentMembershipTypeUniqueId, navigate, isSaving, setFooterActions]);

  return {
    bannerUrl,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardBannerCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
  };
}
