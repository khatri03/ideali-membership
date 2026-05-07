import { useEffect, useRef } from "react";
import { useMembershipAdvanceSettingsStep } from "./MembershipAdvanceSettingsStepPage.hooks";
import { MembershipAdvanceSettingsContent } from "./MembershipAdvanceSettingsStepPage.content";

export function MembershipAdvanceSettingsStepPage() {
  const {
    registrationWindowEnabled,
    registrationStartDateUtc,
    registrationEndDateUtc,
    requiresApproval,
    donationCampaignEnabled,
    donationCampaigns,
    selectedDonationCampaignUniqueId,
    isDonationCampaignsLoading,
    error,
    validationError,
    isLoading,
    isSaving,
    reload,
    setRegistrationWindowEnabled,
    setRegistrationStartDateUtc,
    setRegistrationEndDateUtc,
    setRequiresApproval,
    setDonationCampaignEnabled,
    setSelectedDonationCampaignUniqueId,
  } = useMembershipAdvanceSettingsStep();

  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      focusRef.current?.querySelector<HTMLElement>('[data-wizard-focus="true"]')?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  return (
    <div ref={focusRef}>
      <MembershipAdvanceSettingsContent
        donationCampaignEnabled={donationCampaignEnabled}
        donationCampaigns={donationCampaigns}
        error={error}
        isDonationCampaignsLoading={isDonationCampaignsLoading}
        isLoading={isLoading}
        isSaving={isSaving}
        onRetry={reload}
        registrationEndDateUtc={registrationEndDateUtc}
        registrationStartDateUtc={registrationStartDateUtc}
        registrationWindowEnabled={registrationWindowEnabled}
        requiresApproval={requiresApproval}
        selectedDonationCampaignUniqueId={selectedDonationCampaignUniqueId}
        setDonationCampaignEnabled={setDonationCampaignEnabled}
        setRegistrationEndDateUtc={setRegistrationEndDateUtc}
        setRegistrationStartDateUtc={setRegistrationStartDateUtc}
        setRegistrationWindowEnabled={setRegistrationWindowEnabled}
        setRequiresApproval={setRequiresApproval}
        setSelectedDonationCampaignUniqueId={setSelectedDonationCampaignUniqueId}
        validationError={validationError}
      />
    </div>
  );
}
