import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { matchPath, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import { getMembershipTitleInfo, getMembershipWizardProgress } from "../../../lib/membershipWizard";
import {
  defaultWizardFooterActions,
  WizardFooterActionsProvider,
} from "../WizardFooterActionsContext/WizardFooterActionsContext";
import { WizardMembershipTitleProvider } from "../WizardMembershipTitleContext/WizardMembershipTitleContext";
import { WizardSideNav } from "../WizardSideNav/WizardSideNav";
import { WizardTopBar } from "../WizardTopBar/WizardTopBar";
import { MEMBERSHIP_WIZARD_STEPS, type MembershipWizardStep } from "../membershipWizardSteps";

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
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [footerActions, setFooterActions] = useState(defaultWizardFooterActions);
  const [membershipTitle, setMembershipTitle] = useState("");
  const [isMembershipTitleLoading, setIsMembershipTitleLoading] = useState(true);
  const mainRef = useRef<HTMLElement | null>(null);
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
    const handleEnterKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.defaultPrevented || footerActions.isSaving) {
        return;
      }

      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement)) {
        return;
      }

      if (activeElement.closest('[data-wizard-enter-block="true"]')) {
        return;
      }

      const tagName = activeElement.tagName.toLowerCase();
      if (tagName === "button" || tagName === "a" || tagName === "textarea") {
        return;
      }

      if (tagName === "input") {
        const input = activeElement as HTMLInputElement;
        const eligibleTypes = new Set(["text", "search", "email", "tel", "url", "password", "number"]);

        if (!eligibleTypes.has(input.type)) {
          return;
        }
      } else if (tagName !== "select") {
        return;
      }

      if (footerActions.onSaveNext) {
        event.preventDefault();
        footerActions.onSaveNext();
        return;
      }

      if (footerActions.onSaveExit) {
        event.preventDefault();
        footerActions.onSaveExit();
      }
    };

    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, [footerActions]);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setCompletedStepNo(0);
      setIsProgressLoading(false);
      return;
    }

    let isMounted = true;

    async function loadWizardProgress() {
      setIsProgressLoading(true);

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

      if (isMounted) {
        setIsProgressLoading(false);
      }
    }

    void loadWizardProgress();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId, location.pathname]);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setMembershipTitle("");
      setIsMembershipTitleLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMembershipTitle() {
      setIsMembershipTitleLoading(true);

      try {
        const info = await getMembershipTitleInfo(currentMembershipTypeUniqueId);
        if (isMounted) {
          setMembershipTitle(info.name);
        }
      } catch {
        if (isMounted) {
          setMembershipTitle("");
        }
      } finally {
        if (isMounted) {
          setIsMembershipTitleLoading(false);
        }
      }
    }

    void loadMembershipTitle();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId]);

  useEffect(() => {
    if (!isResumeRoute || isProgressLoading || !currentMembershipTypeUniqueId) {
      return;
    }

    const nextStepNo = Math.min(
      Math.max(completedStepNo + 1, 1),
      MEMBERSHIP_WIZARD_STEPS.length,
    );
    const step = MEMBERSHIP_WIZARD_STEPS[nextStepNo - 1] ?? MEMBERSHIP_WIZARD_STEPS[0]!;

    navigate(
      buildMembershipWizardStepPath(step.to, currentMembershipTypeUniqueId, nextStepNo),
      { replace: true },
    );
  }, [completedStepNo, currentMembershipTypeUniqueId, isProgressLoading, isResumeRoute, navigate]);

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
      setFooterActions((current) => ({
        ...defaultWizardFooterActions,
        ...current,
        showBack: false,
        showSkip: false,
        showSaveNext: false,
        showSaveExit: false,
        isSaving: false,
      }));
      return;
    }

    setFooterActions((current) => ({
      ...defaultWizardFooterActions,
      ...current,
      showBack: !isFirstStep,
      showSkip: false,
      showSaveNext: !isLastStep,
      showSaveExit: true,
      isSaving: current.isSaving,
    }));
  }, [currentStepIndex, isFirstStep, isLastStep, isResumeRoute, setFooterActions]);

  useEffect(() => {
    const focusFirstInteractiveElement = () => {
      const mainElement = mainRef.current;
      if (!mainElement) {
        return false;
      }

      const preferredTarget = mainElement.querySelector<HTMLElement>('[data-wizard-focus="true"]');
      if (preferredTarget) {
        preferredTarget.focus();
        return true;
      }

      const selector = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");

      const firstFocusable = mainElement.querySelector<HTMLElement>(selector);
      if (!firstFocusable) {
        return false;
      }

      firstFocusable.focus();
      return true;
    };

    let cancelled = false;
    let attempts = 0;
    let timeoutId: number | undefined;

    const tryFocus = () => {
      if (cancelled) {
        return;
      }

      attempts += 1;
      const didFocus = focusFirstInteractiveElement();
      if (didFocus || attempts >= 100) {
        return;
      }

      timeoutId = window.setTimeout(tryFocus, 50);
    };

    timeoutId = window.setTimeout(tryFocus, 0);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentStepIndex, location.pathname, isProgressLoading, isMembershipTitleLoading]);

  return (
    <WizardFooterActionsProvider footerActions={footerActions} setFooterActions={setFooterActions}>
      <WizardMembershipTitleProvider
        membershipTitle={membershipTitle}
        setMembershipTitle={setMembershipTitle}
      >
        <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900">
        <WizardTopBar
          isNavVisible={isNavVisible}
          onNavToggle={() => setIsNavVisible((current) => !current)}
          membershipTitle={membershipTitle}
          isMembershipTitleLoading={isMembershipTitleLoading}
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
                isProgressLoading={isProgressLoading}
                membershipTypeUniqueId={membershipTypeUniqueId}
                onNavToggle={() => setIsNavVisible((current) => !current)}
                onNavigate={() => {
                  if (window.innerWidth < 1024) {
                    setIsNavVisible(false);
                  }
                }}
              />
            ) : null}

            <main ref={mainRef} className="min-w-0 flex-1 self-start space-y-6">
              {children ?? <Outlet />}

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
            </main>
          </div>
        </div>
      </WizardMembershipTitleProvider>
    </WizardFooterActionsProvider>
  );
}

