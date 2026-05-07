import type { DonationCampaignListItem } from "../../../../types/donation";

export interface MembershipAdvanceSettingsStepState {
  registrationWindowEnabled: boolean;
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  requiresApproval: boolean;
  donationCampaignEnabled: boolean;
  donationCampaigns: DonationCampaignListItem[];
  selectedDonationCampaignUniqueId: string;
  error: string;
  validationError: string;
  isLoading: boolean;
  isSaving: boolean;
  isDonationCampaignsLoading: boolean;
  reload: () => void;
  setRegistrationWindowEnabled: (value: boolean) => void;
  setRegistrationStartDateUtc: (value: Date | null) => void;
  setRegistrationEndDateUtc: (value: Date | null) => void;
  setRequiresApproval: (value: boolean) => void;
  setDonationCampaignEnabled: (value: boolean) => void;
  setSelectedDonationCampaignUniqueId: (value: string) => void;
}
