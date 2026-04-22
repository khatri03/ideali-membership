import { createContext, useContext } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

export interface WizardFooterActions {
  showBack: boolean;
  showSkip?: boolean;
  showSaveNext: boolean;
  showSaveExit: boolean;
  skipLabel?: string;
  saveNextLabel: string;
  saveExitLabel: string;
  isSaving: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  onSaveNext?: () => void;
  onSaveExit?: () => void;
}

export const defaultWizardFooterActions: WizardFooterActions = {
  showBack: true,
  showSkip: false,
  showSaveNext: true,
  showSaveExit: true,
  skipLabel: "Skip",
  saveNextLabel: "Save & Next",
  saveExitLabel: "Save & Exit",
  isSaving: false,
};

interface WizardFooterActionsContextValue {
  footerActions: WizardFooterActions;
  setFooterActions: Dispatch<SetStateAction<WizardFooterActions>>;
}

const WizardFooterActionsContext = createContext<WizardFooterActionsContextValue | undefined>(
  undefined,
);

export function WizardFooterActionsProvider({
  footerActions,
  setFooterActions,
  children,
}: WizardFooterActionsContextValue & { children: ReactNode }) {
  return (
    <WizardFooterActionsContext.Provider value={{ footerActions, setFooterActions }}>
      {children}
    </WizardFooterActionsContext.Provider>
  );
}

export function useWizardFooterActions() {
  const context = useContext(WizardFooterActionsContext);
  if (!context) {
    throw new Error("useWizardFooterActions must be used inside WizardFooterActionsProvider.");
  }

  return context;
}
