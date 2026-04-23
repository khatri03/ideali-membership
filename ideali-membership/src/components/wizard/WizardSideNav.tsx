import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { buildMembershipWizardStepPath } from "../../routes";
import { MEMBERSHIP_WIZARD_STEPS } from "./membershipWizardSteps";

interface WizardSideNavProps {
  isNavVisible: boolean;
  currentStepIndex: number;
  completedStepNo: number;
  membershipTypeUniqueId?: string;
  onNavToggle: () => void;
  onNavigate?: () => void;
}

export function WizardSideNav({
  isNavVisible,
  currentStepIndex,
  completedStepNo,
  membershipTypeUniqueId,
  onNavToggle,
  onNavigate,
}: WizardSideNavProps) {
  const stateBadgeClass =
    "inline-flex h-6 min-w-14 items-center justify-center rounded-full px-2 text-[10px] font-semibold uppercase leading-none";
  const stateBaseRowClass =
    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition";

  function getStepPath(stepPath: (typeof MEMBERSHIP_WIZARD_STEPS)[number]["to"]) {
    const stepIndex = MEMBERSHIP_WIZARD_STEPS.findIndex((step) => step.to === stepPath);
    return buildMembershipWizardStepPath(
      stepPath,
      membershipTypeUniqueId,
      stepIndex >= 0 ? stepIndex + 1 : undefined,
    );
  }

  function StepRow({
    children,
    stateLabel,
    stateClassName,
    rowClassName,
    href,
    isDisabled,
  }: {
    children: ReactNode;
    stateLabel?: string;
    stateClassName: string;
    rowClassName: string;
    href?: string;
    isDisabled?: boolean;
  }) {
    if (href) {
      return (
        <NavLink
          to={href}
          onClick={onNavigate}
          className={`${stateBaseRowClass} ${rowClassName}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            {children}
          </span>
          {stateLabel ? (
            <span className={`${stateBadgeClass} ${stateClassName}`}>
              {stateLabel}
            </span>
          ) : null}
        </NavLink>
      );
    }

    return (
      <button
        type="button"
        disabled={isDisabled}
        title="Complete previous steps first"
        className={`${stateBaseRowClass} cursor-not-allowed opacity-60 text-slate-400`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {children}
        </span>
        {stateLabel ? (
          <span className={`${stateBadgeClass} ${stateClassName}`}>
            {stateLabel}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <aside className="relative fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-200 bg-white/95 p-5 shadow-xl lg:relative lg:inset-y-auto lg:top-auto lg:h-auto lg:shadow-none">
      <div className="flex items-center justify-between gap-3 pr-12">
        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-700 uppercase">
          Wizard steps
        </p>
      </div>

      <button
        type="button"
        onClick={onNavToggle}
        className="absolute -right-3 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
        aria-label={isNavVisible ? "Hide wizard sidebar" : "Show wizard sidebar"}
        aria-pressed={isNavVisible}
      >
        {isNavVisible ? (
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M12.5 4.5 8 10l4.5 5.5 1.5-1.2L10.5 10l3.5-4.3z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M7.5 4.5 12 10l-4.5 5.5-1.5-1.2L9.5 10 6 5.7z" />
          </svg>
        )}
      </button>

      <nav className="mt-4 space-y-3">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-2">
          <p className="px-4 py-3 text-sm font-semibold text-slate-900">Membership setup</p>
          <div className="space-y-2">
            {MEMBERSHIP_WIZARD_STEPS.map((step, index) => {
              const badgeNumber = index + 1;
              const stepPath = getStepPath(step.to);
              const isActive = index === currentStepIndex;
              const isDone = index < completedStepNo && !isActive;
              const isNext = index === completedStepNo;

              if (isDone) {
                return (
                  <StepRow
                    key={step.to}
                    href={stepPath}
                    stateLabel="Done"
                    stateClassName="bg-emerald-600 text-white"
                    rowClassName="border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white shadow-sm">
                      ✓
                    </span>
                    <span className="min-w-0 truncate text-emerald-900">{step.label}</span>
                  </StepRow>
                );
              }

              if (isActive) {
                const isRevisitedCompletedStep = index < completedStepNo;
                return (
                  <StepRow
                    key={step.to}
                    href={stepPath}
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
                  </StepRow>
                );
              }

              if (isNext) {
                return (
                  <StepRow
                    key={step.to}
                    href={stepPath}
                    stateLabel="Next"
                    stateClassName="bg-cyan-600 text-white"
                    rowClassName="border border-cyan-200 bg-cyan-50 text-cyan-900 hover:bg-cyan-100"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-600 text-xs font-semibold text-white shadow-sm">
                      {badgeNumber}
                    </span>
                    <span className="min-w-0 truncate text-cyan-900">{step.label}</span>
                  </StepRow>
                );
              }

              return (
                <StepRow
                  key={step.to}
                  stateLabel="Locked"
                  stateClassName="bg-slate-200 text-slate-500"
                  rowClassName="bg-transparent text-slate-400"
                  isDisabled
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-slate-300 shadow-sm">
                    {badgeNumber}
                  </span>
                  <span className="min-w-0 truncate">{step.label}</span>
                </StepRow>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}
