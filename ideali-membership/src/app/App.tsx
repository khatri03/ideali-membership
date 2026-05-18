import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "../shared/components/toast/Toast";
import { ProtectedShell } from "../features/auth/components/ProtectedShell";
import { AppLayout } from "../shared/components/layout/AppLayout/AppLayout";
import { WizardLayout } from "../features/membership/wizard/WizardLayout";
import { MembershipRegisterPage } from "../features/membership/pages/MembershipRegisterPage";
import { ErrorBoundary } from "../shared/components/ErrorBoundary/ErrorBoundary";
import {
  APP_ROUTES,
  buildMembershipMembersPath,
  buildMembershipRegisterPath,
} from "./router/routes";
import {
  LoginRoute,
  RequireAuth,
} from "./router/authGuards";
import {
  CustomFormCreatePage,
  CustomFormsPage,
  DashboardPage,
  DnDGridSortExamplePage,
  MemberDetailPage,
  MembersPage,
  MembershipAdvanceSettingsStepPage,
  MembershipBannerStepPage,
  MembershipColorStepPage,
  MembershipDescriptionStepPage,
  MembershipDiscountCouponsStepPage,
  MembershipPaymentAccountStepPage,
  MembershipPricingStepPage,
  MembershipQuestionsStepPage,
  MembershipRegisterCountdownPage,
  MembershipReviewStepPage,
  MembershipThankYouEmailStepPage,
  MembershipTitleStepPage,
  MembershipTypesPage,
  MembershipWizardResumePage,
} from "./router/lazyPages";

function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
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

function AppHome() {
  const defaultMembershipTypeUniqueId = import.meta.env.VITE_DEFAULT_MEMBERSHIP_TYPE_UNIQUE_ID?.trim();

  if (defaultMembershipTypeUniqueId) {
    return <Navigate to={buildMembershipRegisterPath(defaultMembershipTypeUniqueId)} replace />;
  }

  return <MembershipLaunchFallback />;
}

function RouterApp() {
  return (
    <ErrorBoundary>
      <ToastContainer />
      <Suspense fallback={<PageSpinner />}>
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
                <Route path="members/:memberUniqueId/detail" element={<MemberDetailPage />} />
                <Route path="members/:memberUniqueId" element={<MemberDetailPage />} />
                <Route
                  path="pending-approvals"
                  element={<Navigate to={buildMembershipMembersPath({ membershipStatuses: ["PendingApproval"] })} replace />}
                />
              </Route>
              <Route path="organizer/custom-form/list" element={<CustomFormsPage />} />
              <Route path="organizer/custom-form">
                <Route path="create-form" element={<CustomFormCreatePage />} />
                <Route path=":customFormUniqueId/edit" element={<CustomFormCreatePage />} />
              </Route>
              {import.meta.env.DEV ? (
                <Route
                  path={APP_ROUTES.dndPlayground}
                  element={<DnDGridSortExamplePage />}
                />
              ) : null}
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
    </ErrorBoundary>
  );
}

export default function App() {
  return <RouterApp />;
}
