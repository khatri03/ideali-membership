import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { matchPath, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import { getMembershipWizardProgress } from "../../lib/membershipWizard";
import {
  defaultWizardFooterActions,
  WizardFooterActionsProvider,
} from "./WizardFooterActionsContext";
import { WizardSideNav } from "./WizardSideNav";
import { WizardTopBar } from "./WizardTopBar";
import { MEMBERSHIP_WIZARD_STEPS, type MembershipWizardStep } from "./membershipWizardSteps";

interface WizardLayoutProps {
  children?: ReactNode;
}

function getCurrentWizardStep(pathname: string): MembershipWizardStep {
  if (
    matchPath({ path: APP_ROUTES.membershipWizardTitleWithId, end: true }, pathname) ||
    matchPath({ path: APP_ROUTES.membershipWizardTitle, end: true }, pathname)
  ) {
    return MEMBERSHIP_WIZARD_STEPS[0]!;
  }

  return (
    MEMBERSHIP_WIZARD_STEPS.find((step) => matchPath({ path: step.to, end: true }, pathname)) ??
    MEMBERSHIP_WIZARD_STEPS[0]!
  );
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const [isNavVisible, setIsNavVisible] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024,
  );
  const [completedStepNo, setCompletedStepNo] = useState(0);
  const [footerActions, setFooterActions] = useState(defaultWizardFooterActions);
  const isResumeRoute =
    matchPath({ path: APP_ROUTES.membershipWizardResume, end: true }, location.pathname) !== null;

  const currentStepIndex = useMemo(() => {
    if (
      matchPath({ path: APP_ROUTES.membershipWizardTitleWithId, end: true }, location.pathname) ||
      matchPath({ path: APP_ROUTES.membershipWizardTitle, end: true }, location.pathname)
    ) {
      return 0;
    }

    if (isResumeRoute) {
      return Math.min(completedStepNo > 0 ? completedStepNo : 0, MEMBERSHIP_WIZARD_STEPS.length - 1);
    }

    const index = MEMBERSHIP_WIZARD_STEPS.findIndex((step) =>
      matchPath({ path: step.to, end: true }, location.pathname),
    );
    return index >= 0 ? index : 0;
  }, [completedStepNo, isResumeRoute, location.pathname]);

  const currentStep = isResumeRoute
    ? MEMBERSHIP_WIZARD_STEPS[currentStepIndex] ?? MEMBERSHIP_WIZARD_STEPS[0]!
    : getCurrentWizardStep(location.pathname);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === MEMBERSHIP_WIZARD_STEPS.length - 1;
  const previousStep = MEMBERSHIP_WIZARD_STEPS[Math.max(currentStepIndex - 1, 0)] ?? MEMBERSHIP_WIZARD_STEPS[0]!;

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setCompletedStepNo(0);
      return;
    }

    let isMounted = true;

    async function loadWizardProgress() {
      try {
        const progress = await getMembershipWizardProgress(currentMembershipTypeUniqueId);
        if (isMounted) {
          setCompletedStepNo(progress);
        }
      } catch {
        if (isMounted) {
          setCompletedStepNo(0);
        }
      }
    }

    void loadWizardProgress();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, location.pathname]);

  useEffect(() => {
    const syncNavVisibility = () => {
      setIsNavVisible(window.innerWidth >= 1024);
    };

    syncNavVisibility();
    window.addEventListener("resize", syncNavVisibility);

    return () => {
      window.removeEventListener("resize", syncNavVisibility);
    };
  }, []);

  useEffect(() => {
    if (isResumeRoute) {
      setFooterActions({
        ...defaultWizardFooterActions,
        showBack: false,
        showSkip: false,
        showSaveNext: false,
        showSaveExit: false,
        isSaving: false,
      });
      return;
    }

    setFooterActions({
      ...defaultWizardFooterActions,
      showBack: !isFirstStep,
      showSkip: false,
      showSaveNext: !isLastStep,
      showSaveExit: true,
    });
  }, [currentStepIndex, isFirstStep, isLastStep, isResumeRoute, setFooterActions]);

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

        {!isNavVisible ? (
          <button
            type="button"
            onClick={() => setIsNavVisible(true)}
            className="fixed left-0 top-24 z-40 hidden h-10 w-10 items-center justify-center rounded-r-2xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-100 lg:flex"
            aria-label="Show wizard sidebar"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
              <path d="M7.5 4.5 12 10l-4.5 5.5-1.5-1.2L9.5 10 6 5.7z" />
            </svg>
          </button>
        ) : null}

        <div className="flex w-full flex-1 items-start gap-6 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          {isNavVisible ? (
            <WizardSideNav
              isNavVisible={isNavVisible}
              currentStepIndex={currentStepIndex}
              completedStepNo={completedStepNo}
              membershipTypeUniqueId={membershipTypeUniqueId}
              onNavToggle={() => setIsNavVisible((current) => !current)}
              onNavigate={() => {
                if (window.innerWidth < 1024) {
                  setIsNavVisible(false);
                }
              }}
            />
          ) : null}

          <main className="min-w-0 flex-1 self-start space-y-6">
            {children ?? <Outlet />}

            <footer className="rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-center gap-3">
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
                      className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
                        onClick={footerActions.onSaveNext}
                        disabled={footerActions.isSaving || !footerActions.onSaveNext}
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
          </main>
        </div>
      </div>
    </WizardFooterActionsProvider>
  );
}
