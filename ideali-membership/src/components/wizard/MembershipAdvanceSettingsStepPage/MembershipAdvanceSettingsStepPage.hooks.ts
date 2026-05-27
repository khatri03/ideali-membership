import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipAdvanceSettingsInfo,
  getMembershipTypeUpgradePaths,
  getMembershipTypes,
  invalidateMembershipWizardAdvanceSettingsCache,
  invalidateMembershipWizardUpgradePathsCache,
  saveMembershipTypeUpgradePath,
  saveMembershipAdvanceSettingsStep,
} from "../../../lib/membershipWizard";
import type {
  MembershipTypeListItem,
  MembershipTypeUpgradePathDraft,
  MembershipTypeUpgradePathListItem,
} from "../../../types/membership";
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
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setValidationError,
  setIsSaving,
  onPostSave,
  onSuccess,
}: {
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  requiresApproval: boolean;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setValidationError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onPostSave?: () => Promise<void> | void;
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
        requiresApproval,
      },
      stepNumber,
      membershipTypeUniqueId,
    );
    await onPostSave?.();
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
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setValidationError,
  setIsSaving,
  onPostSave,
  onSuccess,
}: {
  registrationStartDateUtc: Date | null;
  registrationEndDateUtc: Date | null;
  requiresApproval: boolean;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setValidationError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onPostSave?: () => Promise<void> | void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipAdvanceSettingsStep(
      {
        registrationStartDateUtc: formatUtcDate(registrationStartDateUtc),
        registrationEndDateUtc: formatUtcDate(registrationEndDateUtc),
        requiresApproval,
      },
      stepNumber,
      membershipTypeUniqueId,
    );
    await onPostSave?.();
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save advance settings.");
  } finally {
    setIsSaving(false);
  }
}

function createEmptyUpgradePathDraft(): MembershipTypeUpgradePathDraft {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `upgrade-path-${Date.now()}`,
    uniqueId: null,
    toMembershipTypeUniqueId: "",
    toMembershipTypeName: "",
    chargeRule: "FullPrice",
    fixedUpgradeAmount: "",
    requiresApproval: false,
    isActive: true,
  };
}

function cloneUpgradePathDraft(path: MembershipTypeUpgradePathDraft): MembershipTypeUpgradePathDraft {
  return { ...path };
}

function normalizeUpgradePathDraft(
  draft: MembershipTypeUpgradePathDraft,
  currentMembershipTypeUniqueId: string,
) {
  if (!draft.toMembershipTypeUniqueId) {
    return "Select a target membership type.";
  }

  if (draft.toMembershipTypeUniqueId === currentMembershipTypeUniqueId) {
    return "Upgrade target must be different from the current membership type.";
  }

  if (draft.chargeRule === "FixedAmount") {
    if (!draft.fixedUpgradeAmount.trim()) {
      return "Enter a fixed upgrade amount.";
    }

    const amount = Number(draft.fixedUpgradeAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return "Fixed upgrade amount must be zero or greater.";
    }
    return "";
  }

  if (draft.fixedUpgradeAmount.trim()) {
    return "Fixed upgrade amount is only allowed when the charge rule is FixedAmount.";
  }

  return "";
}

function toUpgradePathDraft(path: MembershipTypeUpgradePathListItem): MembershipTypeUpgradePathDraft {
  return {
    id: path.uniqueId,
    uniqueId: path.uniqueId,
    toMembershipTypeUniqueId: path.toMembershipTypeUniqueId,
    toMembershipTypeName: path.toMembershipTypeName,
    chargeRule: path.chargeRule,
    fixedUpgradeAmount:
      path.fixedUpgradeAmount === null || path.fixedUpgradeAmount === undefined
        ? ""
        : String(path.fixedUpgradeAmount),
    requiresApproval: path.requiresApproval,
    isActive: path.isActive,
  };
}

function normalizeMembershipTypeOptions(items: MembershipTypeListItem[], currentMembershipTypeUniqueId: string) {
  return items.filter((item) => item.value && item.value !== currentMembershipTypeUniqueId);
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
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [isUpgradePathLoading, setIsUpgradePathLoading] = useState(true);
  const [upgradePaths, setUpgradePaths] = useState<MembershipTypeUpgradePathDraft[]>([]);
  const [membershipTypeOptions, setMembershipTypeOptions] = useState<MembershipTypeListItem[]>([]);
  const [upgradePathError, setUpgradePathError] = useState("");
  const [upgradePathValidationError, setUpgradePathValidationError] = useState("");
  const [isUpgradePathModalOpen, setIsUpgradePathModalOpen] = useState(false);
  const [upgradePathDraft, setUpgradePathDraft] = useState<MembershipTypeUpgradePathDraft | null>(null);
  const [editingUpgradePathId, setEditingUpgradePathId] = useState<string | null>(null);
  const [pendingUpgradePathRemoval, setPendingUpgradePathRemoval] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [removedUpgradePaths, setRemovedUpgradePaths] = useState<MembershipTypeUpgradePathDraft[]>([]);

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
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setRegistrationWindowEnabled(false);
        setRegistrationStartDateUtc(null);
        setRegistrationEndDateUtc(null);
        setRequiresApproval(false);
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
    if (!currentMembershipTypeUniqueId) {
      setUpgradePathError("Membership type unique id is missing.");
      setIsUpgradePathLoading(false);
      return;
    }

    let isMounted = true;

    async function loadUpgradePathData() {
      setIsUpgradePathLoading(true);
      setUpgradePathError("");

      try {
        const [pathItems, membershipTypes] = await Promise.all([
          getMembershipTypeUpgradePaths(currentMembershipTypeUniqueId),
          getMembershipTypes(),
        ]);

        if (!isMounted) {
          return;
        }

        setUpgradePaths(pathItems.map(toUpgradePathDraft));
        setMembershipTypeOptions(normalizeMembershipTypeOptions(membershipTypes, currentMembershipTypeUniqueId));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setUpgradePaths([]);
        setMembershipTypeOptions([]);
        setUpgradePathError(loadError instanceof Error ? loadError.message : "Unable to load upgrade paths.");
      } finally {
        if (isMounted) {
          setIsUpgradePathLoading(false);
        }
      }
    }

    void loadUpgradePathData();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useEffect(() => {
    setValidationError("");
  }, [registrationEndDateUtc, registrationStartDateUtc]);

  useEffect(() => {
    if (!upgradePathDraft) {
      setUpgradePathValidationError("");
      return;
    }

    setUpgradePathValidationError("");
  }, [
    upgradePathDraft?.chargeRule,
    upgradePathDraft?.fixedUpgradeAmount,
    upgradePathDraft?.isActive,
    upgradePathDraft?.requiresApproval,
    upgradePathDraft?.toMembershipTypeUniqueId,
  ]);

  function resetUpgradePathDraft() {
    setEditingUpgradePathId(null);
    setUpgradePathDraft(createEmptyUpgradePathDraft());
    setUpgradePathValidationError("");
  }

  function closeUpgradePathModal() {
    setIsUpgradePathModalOpen(false);
    setEditingUpgradePathId(null);
    setUpgradePathDraft(null);
    setUpgradePathValidationError("");
  }

  function openUpgradePathModal(uniqueId?: string) {
    if (uniqueId) {
      const selectedPath = upgradePaths.find((path) => path.id === uniqueId) ?? null;
      if (!selectedPath) {
        return;
      }

      setEditingUpgradePathId(uniqueId);
      setUpgradePathDraft(cloneUpgradePathDraft(selectedPath));
      setUpgradePathValidationError("");
      setIsUpgradePathModalOpen(true);
      return;
    }

    setEditingUpgradePathId(null);
    setUpgradePathDraft(createEmptyUpgradePathDraft());
    setUpgradePathValidationError("");
    setIsUpgradePathModalOpen(true);
  }

  function updateUpgradePathDraft(updater: (draft: MembershipTypeUpgradePathDraft) => MembershipTypeUpgradePathDraft) {
    setUpgradePathDraft((current) => (current ? updater(current) : current));
  }

  function submitUpgradePathDraft(keepModalOpen: boolean) {
    if (!upgradePathDraft) {
      return;
    }

    const nextValidationError = normalizeUpgradePathDraft(upgradePathDraft, currentMembershipTypeUniqueId);
    if (nextValidationError) {
      setUpgradePathValidationError(nextValidationError);
      return;
    }

    const duplicatePath = upgradePaths.find(
      (path) =>
        path.toMembershipTypeUniqueId === upgradePathDraft.toMembershipTypeUniqueId &&
        path.id !== editingUpgradePathId,
    );
    if (duplicatePath) {
      setUpgradePathValidationError("This target membership type is already configured.");
      return;
    }

    const resolvedDraft = {
      ...upgradePathDraft,
      fixedUpgradeAmount:
        upgradePathDraft.chargeRule === "FixedAmount" ? upgradePathDraft.fixedUpgradeAmount : "",
    };

    setUpgradePaths((current) => {
      if (editingUpgradePathId) {
        return current.map((path) => (path.id === editingUpgradePathId ? { ...resolvedDraft, id: path.id } : path));
      }

      return [...current, resolvedDraft];
    });

    setRemovedUpgradePaths((current) => current.filter((path) => path.id !== resolvedDraft.id));
    setUpgradePathValidationError("");

    if (keepModalOpen) {
      setEditingUpgradePathId(null);
      setUpgradePathDraft(createEmptyUpgradePathDraft());
      setIsUpgradePathModalOpen(true);
      return;
    }

    closeUpgradePathModal();
  }

  function requestUpgradePathRemoval(uniqueId: string) {
    const targetPath = upgradePaths.find((path) => path.id === uniqueId);
    if (!targetPath) {
      return;
    }

    setPendingUpgradePathRemoval({ id: uniqueId, label: targetPath.toMembershipTypeName });
  }

  function confirmUpgradePathRemoval() {
    if (!pendingUpgradePathRemoval) {
      return;
    }

    const targetPath = upgradePaths.find((path) => path.id === pendingUpgradePathRemoval.id) ?? null;

    setUpgradePaths((current) => current.filter((path) => path.id !== pendingUpgradePathRemoval.id));

    if (targetPath?.uniqueId) {
      setRemovedUpgradePaths((current) =>
        current.some((path) => path.id === targetPath.id) ? current : [...current, targetPath],
      );
    }

    if (editingUpgradePathId === pendingUpgradePathRemoval.id) {
      closeUpgradePathModal();
    }

    setPendingUpgradePathRemoval(null);
  }

  function cancelUpgradePathRemoval() {
    setPendingUpgradePathRemoval(null);
  }

  async function persistUpgradePathsToBackend() {
    if (!currentMembershipTypeUniqueId) {
      throw new Error("Membership type unique id is missing.");
    }

    const savedUpgradePaths = upgradePaths;

    for (const path of savedUpgradePaths) {
      await saveMembershipTypeUpgradePath(currentMembershipTypeUniqueId, {
        toMembershipTypeUniqueId: path.toMembershipTypeUniqueId,
        chargeRule: path.chargeRule,
        fixedUpgradeAmount: path.chargeRule === "FixedAmount" ? Number(path.fixedUpgradeAmount || 0) : null,
        requiresApproval: path.requiresApproval,
        isActive: path.isActive,
      });
    }

    for (const path of removedUpgradePaths) {
      await saveMembershipTypeUpgradePath(currentMembershipTypeUniqueId, {
        toMembershipTypeUniqueId: path.toMembershipTypeUniqueId,
        chargeRule: path.chargeRule,
        fixedUpgradeAmount: path.chargeRule === "FixedAmount" ? Number(path.fixedUpgradeAmount || 0) : null,
        requiresApproval: path.requiresApproval,
        isActive: false,
      });
    }

    invalidateMembershipWizardUpgradePathsCache(currentMembershipTypeUniqueId);
    const refreshed = await getMembershipTypeUpgradePaths(currentMembershipTypeUniqueId);
    setUpgradePaths(refreshed.map(toUpgradePathDraft));
    setRemovedUpgradePaths([]);
  }

  useEffect(() => {
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
          stepNumber: MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationError,
          setIsSaving,
          onPostSave: persistUpgradePathsToBackend,
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
          stepNumber: MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationError,
          setIsSaving,
          onPostSave: persistUpgradePathsToBackend,
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
          stepNumber: MEMBERSHIP_ADVANCE_SETTINGS_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setValidationError,
          setIsSaving,
          onPostSave: persistUpgradePathsToBackend,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [
    currentMembershipTypeUniqueId,
    isSaving,
    navigate,
    registrationWindowEnabled,
    registrationEndDateUtc,
    registrationStartDateUtc,
    requiresApproval,
    removedUpgradePaths,
    upgradePaths,
    setFooterActions,
  ]);

  return {
    registrationWindowEnabled,
    registrationStartDateUtc,
    registrationEndDateUtc,
    requiresApproval,
    error,
    validationError,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardAdvanceSettingsCache(currentMembershipTypeUniqueId);
        invalidateMembershipWizardUpgradePathsCache(currentMembershipTypeUniqueId);
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
    isUpgradePathLoading,
    upgradePaths,
    membershipTypeOptions,
    upgradePathError,
    upgradePathValidationError,
    isUpgradePathModalOpen,
    upgradePathDraft,
    editingUpgradePathId,
    pendingUpgradePathRemoval,
    openUpgradePathModal,
    closeUpgradePathModal,
    updateUpgradePathDraft,
    submitUpgradePathDraft,
    requestUpgradePathRemoval,
    confirmUpgradePathRemoval,
    cancelUpgradePathRemoval,
    resetUpgradePathDraft,
  };
}

