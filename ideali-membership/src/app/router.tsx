import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppLayout, LoginScreen, ProtectedShell } from "../components/shared";
import { WizardLayout } from "../features/membership/wizard/WizardLayout/WizardLayout";
import { APP_ROUTES, buildMembershipRegisterPath } from "./routes";

const MembershipRegisterCountdownPage = lazy(() =>
  import("../features/membership/pages/MembershipRegisterCountdownPage").then((module) => ({ default: module.MembershipRegisterCountdownPage })),
);
const MembershipRegisterPage = lazy(() =>
  import("../features/membership/pages/MembershipRegisterPage").then((module) => ({ default: module.MembershipRegisterPage })),
);
const CustomFormCreatePage = lazy(() =>
  import("../pages/CustomFormCreatePage").then((module) => ({ default: module.CustomFormCreatePage })),
);
const CustomFormsPage = lazy(() =>
  import("../pages/CustomFormsPage").then((module) => ({ default: module.CustomFormsPage })),
);
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const MembershipTypesPage = lazy(() =>
  import("../features/membership/pages/MembershipTypesPage").then((module) => ({ default: module.MembershipTypesPage })),
);
const MembersPage = lazy(() => import("../pages/MembersPage").then((module) => ({ default: module.MembersPage })));
const DnDGridSortExamplePage = lazy(() =>
  import("../pages/DnDGridSortExamplePage").then((module) => ({ default: module.DnDGridSortExamplePage })),
);
const SimplePage = lazy(() => import("../pages/SimplePage").then((module) => ({ default: module.SimplePage })));
const MembershipDescriptionStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipDescriptionStepPage/MembershipDescriptionStepPage").then((module) => ({
    default: module.MembershipDescriptionStepPage,
  })),
);
const MembershipBannerStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipBannerStepPage/MembershipBannerStepPage").then((module) => ({
    default: module.MembershipBannerStepPage,
  })),
);
const MembershipColorStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipColorStepPage/MembershipColorStepPage").then((module) => ({
    default: module.MembershipColorStepPage,
  })),
);
const MembershipPaymentAccountStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipPaymentAccountStepPage/MembershipPaymentAccountStepPage").then((module) => ({
    default: module.MembershipPaymentAccountStepPage,
  })),
);
const MembershipPricingStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipPricingStepPage/MembershipPricingStepPage").then((module) => ({
    default: module.MembershipPricingStepPage,
  })),
);
const MembershipDiscountCouponsStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipDiscountCouponsStepPage/MembershipDiscountCouponsStepPage").then((module) => ({
    default: module.MembershipDiscountCouponsStepPage,
  })),
);
const MembershipAdvanceSettingsStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipAdvanceSettingsStepPage/MembershipAdvanceSettingsStepPage").then((module) => ({
    default: module.MembershipAdvanceSettingsStepPage,
  })),
);
const MembershipQuestionsStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage").then((module) => ({
    default: module.MembershipQuestionsStepPage,
  })),
);
const MembershipThankYouEmailStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipThankYouEmailStepPage/MembershipThankYouEmailStepPage").then((module) => ({
    default: module.MembershipThankYouEmailStepPage,
  })),
);
const MembershipReviewStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipReviewStepPage/MembershipReviewStepPage").then((module) => ({
    default: module.MembershipReviewStepPage,
  })),
);
const MembershipTitleStepPage = lazy(() =>
  import("../features/membership/wizard/MembershipTitleStepPage/MembershipTitleStepPage").then((module) => ({
    default: module.MembershipTitleStepPage,
  })),
);
const MembershipWizardResumePage = lazy(() =>
  import("../features/membership/wizard/MembershipWizardResumePage/MembershipWizardResumePage").then((module) => ({
    default: module.MembershipWizardResumePage,
  })),
);

function AppLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-900">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full border border-cyan-400/40 bg-cyan-400/20" />
        <p className="text-sm text-slate-500">Loading authentication state...</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (status !== "authenticated") {
    return <Navigate to={APP_ROUTES.login} replace state={{ from: location }} />;
  }

  return children;
}

function LoginRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (status === "authenticated") {
    return <Navigate to={APP_ROUTES.membershipDashboard} replace />;
  }

  return <LoginScreen />;
}

function MembershipLaunchFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Membership registration
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Point the app at a membership type to launch registration.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">VITE_DEFAULT_MEMBERSHIP_TYPE_UNIQUE_ID</code>
          in your environment, then refresh the app to send visitors straight to the public registration form.
        </p>
        <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Once the ID is set, the root route will open the membership registration form automatically.
        </div>
      </section>
    </main>
  );
}

function RouteFallback() {
  return <AppLoading />;
}

function AppHome() {
  const defaultMembershipTypeUniqueId = import.meta.env.VITE_DEFAULT_MEMBERSHIP_TYPE_UNIQUE_ID?.trim();

  if (defaultMembershipTypeUniqueId) {
    return <Navigate to={buildMembershipRegisterPath(defaultMembershipTypeUniqueId)} replace />;
  }

  return <MembershipLaunchFallback />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path={APP_ROUTES.membershipRegisterCountdown} element={<MembershipRegisterCountdownPage />} />
        <Route path={APP_ROUTES.membershipRegister} element={<MembershipRegisterPage />} />
        <Route path={APP_ROUTES.root} element={<AppHome />} />
        <Route path={APP_ROUTES.login} element={<LoginRoute />} />
        <Route
          path={APP_ROUTES.root}
          element={
            <RequireAuth>
              <ProtectedShell />
            </RequireAuth>
          }
        >
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={APP_ROUTES.membershipDashboard} replace />} />
            <Route path="organizer/membership/type">
              <Route index element={<Navigate to={APP_ROUTES.membershipDashboard} replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="list" element={<MembershipTypesPage />} />
              <Route path="types" element={<Navigate to={APP_ROUTES.membershipTypes} replace />} />
              <Route path="members" element={<MembersPage />} />
              <Route
                path="pending-approvals"
                element={
                  <SimplePage
                    title="Pending Approvals"
                    badgeLabel="Soon"
                    description="Pending approvals are coming soon. This area will handle review and approval workflows."
                  />
                }
              />
            </Route>
            <Route path="organizer/custom-form/list" element={<CustomFormsPage />} />
            <Route path="organizer/custom-form">
              <Route path="create-form" element={<CustomFormCreatePage />} />
              <Route path=":customFormUniqueId/edit" element={<CustomFormCreatePage />} />
            </Route>
            <Route path={APP_ROUTES.dndPlayground} element={<DnDGridSortExamplePage />} />
          </Route>

          <Route element={<WizardLayout />}>
            <Route path="organizer/membership/type/wizard">
              <Route index element={<Navigate to={APP_ROUTES.membershipWizardTitle} replace />} />
              <Route path="title" element={<MembershipTitleStepPage />} />
              <Route path=":membershipTypeUniqueId">
                <Route index element={<MembershipWizardResumePage />} />
                <Route path="title" element={<MembershipTitleStepPage />} />
                <Route path="description" element={<MembershipDescriptionStepPage />} />
                <Route path="tenure" element={<Navigate to="pricing" replace />} />
                <Route path="color" element={<MembershipColorStepPage />} />
                <Route path="banner" element={<MembershipBannerStepPage />} />
                <Route path="payment-account" element={<MembershipPaymentAccountStepPage />} />
                <Route path="pricing" element={<MembershipPricingStepPage />} />
                <Route path="discount-coupons" element={<MembershipDiscountCouponsStepPage />} />
                <Route path="questions" element={<MembershipQuestionsStepPage />} />
                <Route path="custom-forms" element={<Navigate to="questions" replace />} />
                <Route path="thank-you-email" element={<MembershipThankYouEmailStepPage />} />
                <Route path="advance-settings" element={<MembershipAdvanceSettingsStepPage />} />
                <Route path="review" element={<MembershipReviewStepPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={APP_ROUTES.root} replace />} />
      </Routes>
    </Suspense>
  );
}


