import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  getMembershipAdvanceSettingsInfo,
  invalidateMembershipWizardAdvanceSettingsCache,
  saveMembershipAdvanceSettingsStep,
} from "../../lib/membershipWizard";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import {
  MEMBERSHIP_ADVANCE_SETTINGS_CONTENT,
  MEMBERSHIP_ADVANCE_SETTINGS_NEXT_STEP_NUMBER,
  MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER,
} from "./MembershipAdvanceSettingsStepPage.fields";
import {
  formatUtcDate,
  getMembershipAdvanceSettingsValidationError,
  parseUtcDate,
} from "./MembershipAdvanceSettingsStepPage.schema";
import type { MembershipAdvanceSettingsStepState } from "./MembershipAdvanceSettingsStepPage.types";

async function persistMembershipAdvanceSettingsStepWithFeedback({
  registrationStartDateUtc,
  registrationEndDateUtc,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setValidationError,
  setIsSaving,
  onSuccess,
}: {
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setValidationError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  const nextValidationError = getMembershipAdvanceSettingsValidationError(
    registrationStartDateUtc,
    registrationEndDateUtc,
  );
  if (nextValidationError) {
    setValidationError(nextValidationError);
    return;
  }

  setError("");
  setValidationError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipAdvanceSettingsStep(
      {
        registrationStartDateUtc: formatUtcDate(registrationStartDateUtc),
        registrationEndDateUtc: formatUtcDate(registrationEndDateUtc),
      },
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save advance settings.");
  } finally {
    setIsSaving(false);
  }
}

async function persistMembershipAdvanceSettingsStepWithoutValidation({
  registrationStartDateUtc,
  registrationEndDateUtc,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipAdvanceSettingsStep(
      {
        registrationStartDateUtc: formatUtcDate(registrationStartDateUtc),
        registrationEndDateUtc: formatUtcDate(registrationEndDateUtc),
      },
      stepNumber,
      membershipTypeUniqueId,
    );
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save advance settings.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipAdvanceSettingsStep(): MembershipAdvanceSettingsStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [registrationStartDateUtc, setRegistrationStartDateUtc] = useState<Date | null>(null);
  const [registrationEndDateUtc, setRegistrationEndDateUtc] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
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

    async function loadAdvanceSettings() {
      setIsLoading(true);
      setError("");
      setValidationError("");

      try {
        const info = await getMembershipAdvanceSettingsInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setRegistrationStartDateUtc(parseUtcDate(info.registrationStartDateUtc));
        setRegistrationEndDateUtc(parseUtcDate(info.registrationEndDateUtc));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setRegistrationStartDateUtc(null);
        setRegistrationEndDateUtc(null);
        setError(loadError instanceof Error ? loadError.message : "Unable to load advance settings.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAdvanceSettings();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useEffect(() => {
    setValidationError("");
  }, [registrationEndDateUtc, registrationStartDateUtc]);

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
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardThankYouEmail,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSkip: () =>
        void persistMembershipAdvanceSettingsStepWithoutValidation({
          registrationStartDateUtc,
          registrationEndDateUtc,
          stepNumber: MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardReview,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_ADVANCE_SETTINGS_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveNext: () =>
        void persistMembershipAdvanceSettingsStepWithFeedback({
          registrationStartDateUtc,
          registrationEndDateUtc,
          stepNumber: MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardReview,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_ADVANCE_SETTINGS_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipAdvanceSettingsStepWithFeedback({
          registrationStartDateUtc,
          registrationEndDateUtc,
          stepNumber: MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [
    currentMembershipTypeUniqueId,
    isSaving,
    navigate,
    registrationEndDateUtc,
    registrationStartDateUtc,
    setFooterActions,
  ]);

  return {
    registrationStartDateUtc,
    registrationEndDateUtc,
    error,
    validationError,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardAdvanceSettingsCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    setRegistrationStartDateUtc,
    setRegistrationEndDateUtc,
  };
}
