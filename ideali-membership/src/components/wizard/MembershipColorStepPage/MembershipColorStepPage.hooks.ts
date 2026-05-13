import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipColorInfo,
  invalidateMembershipWizardColorCache,
  saveMembershipColorStep,
} from "../../../lib/membershipWizard";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import { MEMBERSHIP_COLOR_NEXT_STEP_NUMBER, MEMBERSHIP_COLOR_STEP_NUMBER } from "./MembershipColorStepPage.fields";
import {
  getMembershipColorError,
  initialMembershipColorSelection,
  normalizeMembershipColor,
  toMembershipColorSelection,
} from "./MembershipColorStepPage.schema";
import type { MembershipColorStepState } from "./MembershipColorStepPage.types";

async function persistMembershipColorStepWithFeedback({
  color,
  allowEmpty,
  stepNumber,
  membershipTypeUniqueId,
  setError,
  setIsSaving,
  onSuccess,
}: {
  color: string | null;
  allowEmpty: boolean;
  stepNumber: number;
  membershipTypeUniqueId?: string;
  setError: (value: string) => void;
  setIsSaving: (value: boolean) => void;
  onSuccess: (membershipTypeUniqueId: string) => void | Promise<void>;
}) {
  if (!allowEmpty) {
    const nextError = color ? getMembershipColorError(color) : "Please select a theme color first.";
    if (nextError) {
      setError(nextError);
      return;
    }
  }

  setError("");
  setIsSaving(true);

  try {
    const result = await saveMembershipColorStep(color ? normalizeMembershipColor(color) : null, stepNumber, membershipTypeUniqueId);
    await onSuccess(result.membershipTypeUniqueId);
  } catch (saveError) {
    setError(saveError instanceof Error ? saveError.message : "Unable to save membership color.");
  } finally {
    setIsSaving(false);
  }
}

export function useMembershipColorStep(): MembershipColorStepState {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const { setFooterActions } = useWizardFooterActions();
  const customColorInputRef = useRef<HTMLInputElement>(null!);
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const [selection, setSelection] = useState(initialMembershipColorSelection);
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

    async function loadMembershipColor() {
      setIsLoading(true);
      setError("");

      try {
        const info = await getMembershipColorInfo(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setSelection(toMembershipColorSelection(info.color));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSelection(initialMembershipColorSelection);
        setError(loadError instanceof Error ? loadError.message : "Unable to load membership color.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMembershipColor();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, reloadTick]);

  useEffect(() => {
    const selectedColor = selection.customColor ?? selection.selectedPresetColor;

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
        void persistMembershipColorStepWithFeedback({
          color: null,
          allowEmpty: true,
          stepNumber: MEMBERSHIP_COLOR_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardBanner,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_COLOR_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveNext: () =>
        void persistMembershipColorStepWithFeedback({
          color: selectedColor,
          allowEmpty: false,
          stepNumber: MEMBERSHIP_COLOR_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async (savedMembershipTypeUniqueId) => {
            navigate(
              buildMembershipWizardStepPath(
                APP_ROUTES.membershipWizardBanner,
                savedMembershipTypeUniqueId,
                MEMBERSHIP_COLOR_NEXT_STEP_NUMBER,
              ),
              { replace: true },
            );
          },
        }),
      onSaveExit: () =>
        void persistMembershipColorStepWithFeedback({
          color: selectedColor,
          allowEmpty: true,
          stepNumber: MEMBERSHIP_COLOR_STEP_NUMBER,
          membershipTypeUniqueId: currentMembershipTypeUniqueId,
          setError,
          setIsSaving,
          onSuccess: async () => {
            navigate(APP_ROUTES.membershipTypes, { replace: true });
          },
        }),
    });
  }, [currentMembershipTypeUniqueId, navigate, selection.customColor, selection.selectedPresetColor, setFooterActions, isSaving]);

  return {
    selectedPresetColor: selection.selectedPresetColor,
    customColor: selection.customColor,
    hasInteractedWithCustomColor: selection.hasInteractedWithCustomColor,
    error,
    isLoading,
    isSaving,
    reload: () => {
      if (currentMembershipTypeUniqueId) {
        invalidateMembershipWizardColorCache(currentMembershipTypeUniqueId);
      }
      setReloadTick((current) => current + 1);
    },
    selectPresetColor: (value: string) =>
      setSelection((current) => ({
        selectedPresetColor: value,
        customColor: null,
        hasInteractedWithCustomColor: current.hasInteractedWithCustomColor,
      })),
    openCustomColorPicker: () => {
      setSelection((current) => ({
        selectedPresetColor: current.selectedPresetColor,
        customColor: current.customColor,
        hasInteractedWithCustomColor: true,
      }));
      customColorInputRef.current?.click();
    },
    updateCustomColor: (value: string) => {
      const normalizedColor = normalizeMembershipColor(value);
      if (!/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
        return;
      }

      setSelection((current) => ({
        selectedPresetColor: null,
        customColor: normalizedColor,
        hasInteractedWithCustomColor: true,
      }));
    },
    customColorInputRef,
  };
}

