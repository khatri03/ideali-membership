import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface WizardSideNavStepRowProps {
  children: ReactNode;
  href?: string;
  isDisabled?: boolean;
  onNavigate?: () => void;
  rowClassName: string;
  stateClassName: string;
  stateLabel?: string;
}

const stateBaseRowClass =
  "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition";
const stateBadgeClass =
  "inline-flex h-6 min-w-14 items-center justify-center rounded-full px-2 text-[10px] font-semibold uppercase leading-none";

export function WizardSideNavStepRow({
  children,
  href,
  isDisabled,
  onNavigate,
  rowClassName,
  stateClassName,
  stateLabel,
}: WizardSideNavStepRowProps) {
  if (href) {
    return (
      <NavLink to={href} onClick={onNavigate} className={`${stateBaseRowClass} ${rowClassName}`}>
        <span className="flex min-w-0 items-center gap-3">{children}</span>
        {stateLabel ? <span className={`${stateBadgeClass} ${stateClassName}`}>{stateLabel}</span> : null}
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
      <span className="flex min-w-0 items-center gap-3">{children}</span>
      {stateLabel ? <span className={`${stateBadgeClass} ${stateClassName}`}>{stateLabel}</span> : null}
    </button>
  );
}
