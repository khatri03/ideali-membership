import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { LoginScreen } from "./components/LoginScreen/LoginScreen";
import { ProtectedShell } from "./components/ProtectedShell/ProtectedShell";
import { AppLayout } from "./components/layout/AppLayout/AppLayout";
import { MembershipDescriptionStepPage } from "./components/wizard/MembershipDescriptionStepPage/MembershipDescriptionStepPage";
import { MembershipBannerStepPage } from "./components/wizard/MembershipBannerStepPage/MembershipBannerStepPage";
import { MembershipColorStepPage } from "./components/wizard/MembershipColorStepPage/MembershipColorStepPage";
import { MembershipPaymentAccountStepPage } from "./components/wizard/MembershipPaymentAccountStepPage/MembershipPaymentAccountStepPage";
import { MembershipPricingStepPage } from "./components/wizard/MembershipPricingStepPage/MembershipPricingStepPage";
import { MembershipDiscountCouponsStepPage } from "./components/wizard/MembershipDiscountCouponsStepPage/MembershipDiscountCouponsStepPage";
import { MembershipAdvanceSettingsStepPage } from "./components/wizard/MembershipAdvanceSettingsStepPage/MembershipAdvanceSettingsStepPage";
import { MembershipQuestionsStepPage } from "./components/wizard/MembershipQuestionsStepPage/MembershipQuestionsStepPage";
import { MembershipThankYouEmailStepPage } from "./components/wizard/MembershipThankYouEmailStepPage/MembershipThankYouEmailStepPage";
import { MembershipReviewStepPage } from "./components/wizard/MembershipReviewStepPage/MembershipReviewStepPage";
import { MembershipTitleStepPage } from "./components/wizard/MembershipTitleStepPage/MembershipTitleStepPage";
import { MembershipWizardResumePage } from "./components/wizard/MembershipWizardResumePage/MembershipWizardResumePage";
import { WizardLayout } from "./components/wizard/WizardLayout/WizardLayout";
import { MembershipRegisterPage } from "./pages/MembershipRegisterPage";
import { CustomFormCreatePage } from "./pages/CustomFormCreatePage";
import { CustomFormsPage } from "./pages/CustomFormsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MembershipTypesPage } from "./pages/MembershipTypesPage";
import { MembersPage } from "./pages/MembersPage";
import { SimplePage } from "./pages/SimplePage";
import { APP_ROUTES } from "./routes";

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

function AppHome() {
  return <Navigate to={APP_ROUTES.membershipDashboard} replace />;
}

function RouterApp() {
  return (
    <Routes>
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
          </Route>
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
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RouterApp />
    </BrowserRouter>
  );
}

