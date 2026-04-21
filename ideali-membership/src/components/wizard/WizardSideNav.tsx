import { NavLink } from "react-router-dom";
import { buildMembershipWizardStepPath } from "../../routes";
import { MEMBERSHIP_WIZARD_STEPS } from "./membershipWizardSteps";

interface WizardSideNavProps {
  currentStepIndex: number;
  membershipTypeUniqueId?: string;
  onNavigate?: () => void;
}

export function WizardSideNav({
  currentStepIndex,
  membershipTypeUniqueId,
  onNavigate,
}: WizardSideNavProps) {
  function getStepPath(stepPath: string) {
    const stepIndex = MEMBERSHIP_WIZARD_STEPS.findIndex((step) => step.to === stepPath);
    return buildMembershipWizardStepPath(
      stepPath as (typeof MEMBERSHIP_WIZARD_STEPS)[number]["to"],
      membershipTypeUniqueId,
      stepIndex >= 0 ? stepIndex + 1 : undefined,
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-200 bg-white/95 p-5 shadow-xl lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] lg:shadow-none">
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-700 uppercase">
          Wizard steps
        </p>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
        >
          Close
        </button>
      </div>

      <nav className="mt-6 space-y-3 lg:mt-0">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-2">
          <p className="px-4 py-3 text-sm font-semibold text-slate-900">Membership setup</p>
          <div className="space-y-2">
            {MEMBERSHIP_WIZARD_STEPS.map((step, index) => (
              index <= currentStepIndex ? (
                <NavLink
                  key={step.to}
                  to={getStepPath(step.to)}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                      isActive
                        ? "bg-cyan-500/10 text-cyan-800"
                        : "text-slate-700 hover:bg-white",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                          {index + 1}
                        </span>
                        <span className="min-w-0 truncate">{step.label}</span>
                      </span>
                      {isActive ? (
                        <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          Active
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ) : (
                <button
                  key={step.to}
                  type="button"
                  disabled
                  title="Complete previous steps first"
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition cursor-not-allowed opacity-60"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-slate-300 shadow-sm">
                      {index + 1}
                    </span>
                    <span className="min-w-0 truncate">{step.label}</span>
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                    Locked
                  </span>
                </button>
              )
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
