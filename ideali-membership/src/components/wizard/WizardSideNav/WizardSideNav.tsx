import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import { MEMBERSHIP_WIZARD_STEPS } from "../membershipWizardSteps";
import { WizardSideNavSkeleton } from "./WizardSideNav.skeleton";
import { WizardSideNavStepRow } from "./WizardSideNav.step-row";

interface WizardSideNavProps {
  isNavVisible: boolean;
  currentStepIndex: number;
  completedStepNo: number;
  isProgressLoading: boolean;
  membershipTypeUniqueId?: string;
  onNavToggle: () => void;
  onNavigate?: () => void;
}

function getStepPath(
  membershipTypeUniqueId: string | undefined,
  stepPath: (typeof MEMBERSHIP_WIZARD_STEPS)[number]["to"],
) {
  if (!membershipTypeUniqueId) {
    return stepPath === APP_ROUTES.membershipWizardTitle ? APP_ROUTES.membershipWizardTitle : undefined;
  }

  const stepIndex = MEMBERSHIP_WIZARD_STEPS.findIndex((step) => step.to === stepPath);
  return buildMembershipWizardStepPath(
    stepPath,
    membershipTypeUniqueId,
    stepIndex >= 0 ? stepIndex + 1 : undefined,
  );
}

export function WizardSideNav({
  isNavVisible,
  currentStepIndex,
  completedStepNo,
  isProgressLoading,
  membershipTypeUniqueId,
  onNavToggle,
  onNavigate,
}: WizardSideNavProps) {
  return (
    <aside className="relative fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-200 bg-white/95 p-5 shadow-xl lg:relative lg:inset-y-auto lg:top-auto lg:h-auto lg:shadow-none">
      <button
        type="button"
        onClick={onNavToggle}
        className="absolute -right-3 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
        aria-label={isNavVisible ? "Hide wizard sidebar" : "Show wizard sidebar"}
        aria-pressed={isNavVisible}
      >
        {isNavVisible ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      <nav className="mt-4 space-y-3">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-2">
          <div className="space-y-2">
            {isProgressLoading ? (
              <WizardSideNavSkeleton />
            ) : (
              MEMBERSHIP_WIZARD_STEPS.map((step, index) => {
                const badgeNumber = index + 1;
                const stepPath = getStepPath(membershipTypeUniqueId, step.to);
                const isActive = index === currentStepIndex;
                const isDone = index < completedStepNo && !isActive;
                const isNext = index === completedStepNo;

                if (isDone) {
                  return (
                    <WizardSideNavStepRow
                      key={step.to}
                      href={stepPath}
                      onNavigate={onNavigate}
                      stateLabel="Done"
                      stateClassName="bg-emerald-600 text-white"
                      rowClassName="border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 truncate text-emerald-900">{step.label}</span>
                    </WizardSideNavStepRow>
                  );
                }

                if (isActive) {
                  const isRevisitedCompletedStep = index < completedStepNo;
                  return (
                    <WizardSideNavStepRow
                      key={step.to}
                      href={stepPath}
                      onNavigate={onNavigate}
                      stateLabel={isRevisitedCompletedStep ? "Done" : undefined}
                      stateClassName={
                        isRevisitedCompletedStep ? "bg-emerald-800 text-white" : "bg-cyan-500 text-white"
                      }
                      rowClassName={
                        isRevisitedCompletedStep
                          ? "border border-emerald-400 bg-emerald-200 text-emerald-950 hover:bg-emerald-300"
                          : "border border-cyan-200 bg-cyan-500/10 text-cyan-800 hover:bg-cyan-500/15"
                      }
                    >
                      <span
                        className={[
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold text-white shadow-sm",
                          isRevisitedCompletedStep ? "bg-emerald-800" : "bg-cyan-600",
                        ].join(" ")}
                      >
                        {badgeNumber}
                      </span>
                      <span
                        className={
                          isRevisitedCompletedStep
                            ? "min-w-0 truncate text-emerald-950"
                            : "min-w-0 truncate text-cyan-800"
                        }
                      >
                        {step.label}
                      </span>
                    </WizardSideNavStepRow>
                  );
                }

                if (isNext) {
                  return (
                    <WizardSideNavStepRow
                      key={step.to}
                      href={stepPath}
                      onNavigate={onNavigate}
                      stateClassName="bg-cyan-600 text-white"
                      rowClassName="border border-cyan-200 bg-cyan-50 text-cyan-900 hover:bg-cyan-100"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-600 text-xs font-semibold text-white shadow-sm">
                        {badgeNumber}
                      </span>
                      <span className="min-w-0 truncate text-cyan-900">{step.label}</span>
                    </WizardSideNavStepRow>
                  );
                }

                return (
                  <WizardSideNavStepRow
                    key={step.to}
                    stateClassName="bg-slate-200 text-slate-500"
                    rowClassName="bg-transparent text-slate-400"
                    isDisabled
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-slate-300 shadow-sm">
                      {badgeNumber}
                    </span>
                    <span className="min-w-0 truncate">{step.label}</span>
                  </WizardSideNavStepRow>
                );
              })
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}
