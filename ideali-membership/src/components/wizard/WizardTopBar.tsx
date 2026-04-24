import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../routes";

interface WizardTopBarProps {
  isNavVisible: boolean;
  onNavToggle: () => void;
  membershipTitle: string;
  isMembershipTitleLoading: boolean;
  currentStepLabel: string;
  currentStepIndex: number;
  totalSteps: number;
}

export function WizardTopBar({
  isNavVisible,
  onNavToggle,
  membershipTitle,
  isMembershipTitleLoading,
  currentStepLabel,
  currentStepIndex,
  totalSteps,
}: WizardTopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[96rem] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onNavToggle}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label={isNavVisible ? "Hide wizard sidebar" : "Show wizard sidebar"}
          aria-pressed={isNavVisible}
        >
          <span className="space-y-1">
            <span className="block h-0.5 w-4 rounded-full bg-current" />
            <span className="block h-0.5 w-4 rounded-full bg-current" />
            <span className="block h-0.5 w-4 rounded-full bg-current" />
          </span>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700">
            <span className="text-sm font-bold">W</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">
              {isMembershipTitleLoading ? (
                <span className="inline-block h-4 w-[min(18rem,62vw)] animate-pulse rounded-full bg-slate-200 align-middle" />
              ) : (
                membershipTitle.trim() || "Untitled membership"
              )}
            </p>
            <p className="truncate text-sm text-slate-500">
              {currentStepIndex + 1} of {totalSteps} - {currentStepLabel}
            </p>
          </div>
        </div>

        <Link
          to={APP_ROUTES.membershipTypes}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Exit wizard
        </Link>
      </div>
    </header>
  );
}
