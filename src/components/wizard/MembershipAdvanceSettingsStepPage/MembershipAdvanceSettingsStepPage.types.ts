import type {
  MembershipTypeListItem,
  MembershipTypeUpgradePathDraft,
  MembershipTypeUpgradePathListItem,
  MembershipUpgradeChargeRule,
} from "../../../types/membership";

export interface MembershipAdvanceSettingsStepState {
  registrationWindowEnabled: boolean;
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  requiresApproval: boolean;
  error: string;
  validationError: string;
  isLoading: boolean;
  isSaving: boolean;
  isUpgradePathLoading: boolean;
  upgradePaths: MembershipTypeUpgradePathDraft[];
  membershipTypeOptions: MembershipTypeListItem[];
  upgradePathError: string;
  upgradePathValidationError: string;
  isUpgradePathModalOpen: boolean;
  upgradePathDraft: MembershipTypeUpgradePathDraft | null;
  editingUpgradePathId: string | null;
  pendingUpgradePathRemoval: { id: string; label: string } | null;
  reload: () => void;
  setRegistrationWindowEnabled: (value: boolean) => void;
  setRegistrationStartDateUtc: (value: Date | null) => void;
  setRegistrationEndDateUtc: (value: Date | null) => void;
  setRequiresApproval: (value: boolean) => void;
  openUpgradePathModal: (uniqueId?: string) => void;
  closeUpgradePathModal: () => void;
  updateUpgradePathDraft: (updater: (draft: MembershipTypeUpgradePathDraft) => MembershipTypeUpgradePathDraft) => void;
  submitUpgradePathDraft: (keepModalOpen: boolean) => void;
  requestUpgradePathRemoval: (uniqueId: string) => void;
  confirmUpgradePathRemoval: () => void;
  cancelUpgradePathRemoval: () => void;
  resetUpgradePathDraft: () => void;
}
