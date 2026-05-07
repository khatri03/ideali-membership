import type { NavigateFunction } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../../app/routes";
import type { WizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import type { MembershipWizardStep } from "../membershipWizardSteps";

interface WizardLayoutFooterProps {
  currentStepIndex: number;
  footerActions: WizardFooterActions;
  membershipTypeUniqueId: string;
  navigate: NavigateFunction;
  previousStep: MembershipWizardStep;
}

export function WizardLayoutFooter({
  currentStepIndex,
  footerActions,
  membershipTypeUniqueId,
  navigate,
  previousStep,
}: WizardLayoutFooterProps) {
  return (
    <footer className="rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full items-stretch sm:w-auto">
          {footerActions.showBack ? (
            <button
              type="button"
              onClick={
                footerActions.onBack ??
                (() =>
                  navigate(
                    buildMembershipWizardStepPath(
                      previousStep.to,
                      membershipTypeUniqueId,
                      currentStepIndex,
                    ),
                  ))
              }
              className="w-full rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              Back
            </button>
          ) : null}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end lg:justify-end">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {footerActions.showSkip ? (
              <button
                type="button"
                onClick={footerActions.onSkip}
                disabled={footerActions.isSaving}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {footerActions.isSaving ? (
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-transparent align-[-3px]" />
                ) : null}
                {footerActions.skipLabel}
              </button>
            ) : null}
            {footerActions.showSaveNext ? (
              <button
                type="button"
                onClick={footerActions.onSaveNext ?? (() => {})}
                disabled={footerActions.isSaving}
                className="rounded-full border border-cyan-200 bg-cyan-50 px-5 py-2.5 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {footerActions.isSaving ? (
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-700 border-t-transparent align-[-3px]" />
                ) : null}
                {footerActions.saveNextLabel}
              </button>
            ) : null}
            {footerActions.showSaveExit ? (
              <button
                type="button"
                onClick={footerActions.onSaveExit ?? (() => navigate(APP_ROUTES.membershipTypes))}
                disabled={footerActions.isSaving}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {footerActions.isSaving ? (
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-[-3px]" />
                ) : null}
                {footerActions.saveExitLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

