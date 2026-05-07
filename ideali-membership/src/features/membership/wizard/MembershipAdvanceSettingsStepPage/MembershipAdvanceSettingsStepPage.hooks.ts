import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../../app/routes";
import { getCurrentOrganizerDonationCampaigns } from "../../../../services/donationCampaigns";
import {
  getMembershipAdvanceSettingsInfo,
  invalidateMembershipWizardAdvanceSettingsCache,
  saveMembershipAdvanceSettingsStep,
} from "../../../../services/membershipWizard";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
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
  requiresApproval,
  donationCampaignEnabled,
  donationCampaignUniqueId,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setValidationError,
  setIsSaving,
  onSuccess,
}: {
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  requiresApproval: boolean;
  donationCampaignEnabled: boolean;
  donationCampaignUniqueId: string | null;
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

  if (donationCampaignEnabled && !donationCampaignUniqueId) {
    setValidationError("Please select a donation campaign before continuing.");
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
        requiresApproval,
        donationCampaignUniqueId,
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
  requiresApproval,
  donationCampaignEnabled,
  donationCampaignUniqueId,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setValidationError,
  setIsSaving,
  onSuccess,
}: {
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  requiresApproval: boolean;
  donationCampaignEnabled: boolean;
  donationCampaignUniqueId: string | null;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setValidationError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");

  if (donationCampaignEnabled && !donationCampaignUniqueId) {
    setValidationError("Please select a donation campaign before saving.");
    return;
  }

  setIsSaving(true);

  try {
    const result = await saveMembershipAdvanceSettingsStep(
      {
        registrationStartDateUtc: formatUtcDate(registrationStartDateUtc),
        registrationEndDateUtc: formatUtcDate(registrationEndDateUtc),
        requiresApproval,
        donationCampaignUniqueId,
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
  const [registrationWindowEnabled, setRegistrationWindowEnabled] = useState(false);
  const [registrationStartDateUtc, setRegistrationStartDateUtc] = useState<Date | null>(null);
  const [registrationEndDateUtc, setRegistrationEndDateUtc] = useState<Date | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [donationCampaignEnabled, setDonationCampaignEnabled] = useState(false);
  const [savedDonationCampaignUniqueId, setSavedDonationCampaignUniqueId] = useState("");
  const [donationCampaigns, setDonationCampaigns] = useState<Array<{ uniqueId: string; name: string }>>([]);
  const [selectedDonationCampaignUniqueId, setSelectedDonationCampaignUniqueId] = useState("");
  const [isDonationCampaignsLoading, setIsDonationCampaignsLoading] = useState(true);
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

        const loadedStartDateUtc = parseUtcDate(info.registrationStartDateUtc);
        const loadedEndDateUtc = parseUtcDate(info.registrationEndDateUtc);

        setRegistrationStartDateUtc(loadedStartDateUtc);
        setRegistrationEndDateUtc(loadedEndDateUtc);
        setRegistrationWindowEnabled(Boolean(loadedStartDateUtc || loadedEndDateUtc));
        setRequiresApproval(info.requiresApproval);
        setDonationCampaignEnabled(Boolean(info.donationCampaignUniqueId));
        setSavedDonationCampaignUniqueId(info.donationCampaignUniqueId ?? "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setRegistrationWindowEnabled(false);
        setRegistrationStartDateUtc(null);
        setRegistrationEndDateUtc(null);
        setRequiresApproval(false);
        setDonationCampaignEnabled(false);
        setSavedDonationCampaignUniqueId("");
        setSelectedDonationCampaignUniqueId("");
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

  useEffect(() => {
    let isMounted = true;

    async function loadDonationCampaigns() {
      setIsDonationCampaignsLoading(true);

      try {
        const campaigns = await getCurrentOrganizerDonationCampaigns();
        if (!isMounted) {
          return;
        }

        setDonationCampaigns(campaigns);
        setSelectedDonationCampaignUniqueId((current) =>
          campaigns.some((campaign) => campaign.uniqueId === current)
            ? current
            : campaigns[0]?.uniqueId || current || "",
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setDonationCampaigns([]);
        setDonationCampaignEnabled(false);
        setSelectedDonationCampaignUniqueId("");
      } finally {
        if (isMounted) {
          setIsDonationCampaignsLoading(false);
        }
      }
    }

    void loadDonationCampaigns();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (savedDonationCampaignUniqueId) {
      setDonationCampaignEnabled(true);
      setSelectedDonationCampaignUniqueId((current) => {
        if (donationCampaigns.some((campaign) => campaign.uniqueId === current)) {
          return current;
        }

        if (donationCampaigns.some((campaign) => campaign.uniqueId === savedDonationCampaignUniqueId)) {
          return savedDonationCampaignUniqueId;
        }

        return donationCampaigns[0]?.uniqueId || current;
      });
      return;
    }

    if (donationCampaigns.length > 0) {
      setSelectedDonationCampaignUniqueId((current) =>
        donationCampaigns.some((campaign) => campaign.uniqueId === current)
          ? current
          : donationCampaigns[0]?.uniqueId || "",
      );
    }
  }, [donationCampaigns, savedDonationCampaignUniqueId]);

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
          registrationStartDateUtc: registrationWindowEnabled ? registrationStartDateUtc : null,
          registrationEndDateUtc: registrationWindowEnabled ? registrationEndDateUtc : null,
          requiresApproval,
          donationCampaignEnabled,
          donationCampaignUniqueId:
            donationCampaignEnabled && selectedDonationCampaignUniqueId
              ? selectedDonationCampaignUniqueId
              : null,
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
      onSaveNext: () =>
        void persistMembershipAdvanceSettingsStepWithFeedback({
          registrationStartDateUtc: registrationWindowEnabled ? registrationStartDateUtc : null,
          registrationEndDateUtc: registrationWindowEnabled ? registrationEndDateUtc : null,
          requiresApproval,
          donationCampaignEnabled,
          donationCampaignUniqueId:
            donationCampaignEnabled && selectedDonationCampaignUniqueId
              ? selectedDonationCampaignUniqueId
              : null,
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
          registrationStartDateUtc: registrationWindowEnabled ? registrationStartDateUtc : null,
          registrationEndDateUtc: registrationWindowEnabled ? registrationEndDateUtc : null,
          requiresApproval,
          donationCampaignEnabled,
          donationCampaignUniqueId:
            donationCampaignEnabled && selectedDonationCampaignUniqueId
              ? selectedDonationCampaignUniqueId
              : null,
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
    donationCampaignEnabled,
    isSaving,
    navigate,
    selectedDonationCampaignUniqueId,
    registrationWindowEnabled,
    registrationEndDateUtc,
    registrationStartDateUtc,
    setFooterActions,
  ]);

  return {
    registrationWindowEnabled,
    registrationStartDateUtc,
    registrationEndDateUtc,
    requiresApproval,
    donationCampaignEnabled,
    donationCampaigns,
    selectedDonationCampaignUniqueId,
    error,
    validationError,
    isLoading,
    isSaving,
    isDonationCampaignsLoading,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardAdvanceSettingsCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    setRegistrationWindowEnabled: (value: boolean) => {
      setRegistrationWindowEnabled(value);
      if (!value) {
        setRegistrationStartDateUtc(null);
        setRegistrationEndDateUtc(null);
      }
    },
    setRegistrationStartDateUtc,
    setRegistrationEndDateUtc,
    setRequiresApproval,
    setDonationCampaignEnabled,
    setSelectedDonationCampaignUniqueId,
  };
}


