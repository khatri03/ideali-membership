import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext } from "react";

interface WizardMembershipTitleContextValue {
  membershipTitle: string;
  setMembershipTitle: Dispatch<SetStateAction<string>>;
}

const WizardMembershipTitleContext = createContext<WizardMembershipTitleContextValue | null>(null);

interface WizardMembershipTitleProviderProps extends WizardMembershipTitleContextValue {
  children: ReactNode;
}

export function WizardMembershipTitleProvider({
  children,
  membershipTitle,
  setMembershipTitle,
}: WizardMembershipTitleProviderProps) {
  return (
    <WizardMembershipTitleContext.Provider value={{ membershipTitle, setMembershipTitle }}>
      {children}
    </WizardMembershipTitleContext.Provider>
  );
}

export function useWizardMembershipTitle() {
  const context = useContext(WizardMembershipTitleContext);

  if (!context) {
    throw new Error("useWizardMembershipTitle must be used within WizardMembershipTitleProvider.");
  }

  return context;
}
