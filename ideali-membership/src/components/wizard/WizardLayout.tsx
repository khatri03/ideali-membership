import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  defaultWizardFooterActions,
  WizardFooterActionsProvider,
} from "./WizardFooterActionsContext";
import { WizardSideNav } from "./WizardSideNav";
import { WizardTopBar } from "./WizardTopBar";
import { MEMBERSHIP_WIZARD_STEPS } from "./membershipWizardSteps";

interface WizardLayoutProps {
  children?: ReactNode;
}

function getCurrentWizardStep(pathname: string) {
  return (
    MEMBERSHIP_WIZARD_STEPS.find((step) => pathname.startsWith(step.to)) ??
    MEMBERSHIP_WIZARD_STEPS[0]
  );
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [footerActions, setFooterActions] = useState(defaultWizardFooterActions);

  const currentStepIndex = useMemo(() => {
    const index = MEMBERSHIP_WIZARD_STEPS.findIndex((step) =>
      location.pathname.startsWith(step.to),
    );
    return index >= 0 ? index : 0;
  }, [location.pathname]);

  const currentStep = getCurrentWizardStep(location.pathname);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === MEMBERSHIP_WIZARD_STEPS.length - 1;
  const previousStep = MEMBERSHIP_WIZARD_STEPS[currentStepIndex - 1];

  useEffect(() => {
    setFooterActions((current) => ({
      ...defaultWizardFooterActions,
      ...current,
      showBack: !isFirstStep,
      showSaveNext: !isLastStep,
      showSaveExit: true,
    }));
  }, [currentStepIndex, isFirstStep, isLastStep, setFooterActions]);

  return (
    <WizardFooterActionsProvider footerActions={footerActions} setFooterActions={setFooterActions}>
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900">
        <WizardTopBar
          isNavVisible={isNavVisible}
          onNavToggle={() => setIsNavVisible((current) => !current)}
          currentStepLabel={currentStep.label}
          currentStepIndex={currentStepIndex}
          totalSteps={MEMBERSHIP_WIZARD_STEPS.length}
        />

        <div className="flex w-full flex-1 gap-6 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          {isNavVisible ? (
            <WizardSideNav
              currentStepIndex={currentStepIndex}
              locationSearch={location.search}
              onNavigate={() => {
                if (window.innerWidth < 1024) {
                  setIsNavVisible(false);
                }
              }}
            />
          ) : null}

          <main className="min-w-0 flex-1 space-y-6">
            {children ?? <Outlet />}

            <footer className="rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-center gap-3">
                  {footerActions.showBack ? (
                    <button
                      type="button"
                      onClick={footerActions.onBack ?? (() => navigate(previousStep.to))}
                      className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Back
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end lg:justify-end">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {footerActions.showSaveNext ? (
                      <button
                        type="button"
                        onClick={footerActions.onSaveNext}
                        disabled={footerActions.isSaving || !footerActions.onSaveNext}
                        className="rounded-full border border-cyan-200 bg-cyan-50 px-5 py-2.5 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {footerActions.saveNextLabel}
                      </button>
                    ) : null}
                    {footerActions.showSaveExit ? (
                      <button
                        type="button"
                        onClick={footerActions.onSaveExit}
                        disabled={footerActions.isSaving || !footerActions.onSaveExit}
                        className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {footerActions.saveExitLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </WizardFooterActionsProvider>
  );
}
