import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import { ProtectedShell } from "./components/ProtectedShell";
import { AppLayout } from "./components/layout/AppLayout";
import { MembershipTitleStepPage } from "./components/wizard/MembershipTitleStepPage";
import { WizardLayout } from "./components/wizard/WizardLayout";
import { WizardStepPage } from "./components/wizard/WizardStepPage";
import { MEMBERSHIP_WIZARD_STEPS } from "./components/wizard/membershipWizardSteps";
import { CustomFormCreatePage } from "./pages/CustomFormCreatePage";
import { CustomFormsPage } from "./pages/CustomFormsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MembershipTypesPage } from "./pages/MembershipTypesPage";
import { MembersPage } from "./pages/MembersPage";
import { SimplePage } from "./pages/SimplePage";
import { APP_ROUTES, buildMembershipWizardStepPath } from "./routes";

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

function WizardDescriptionRedirect() {
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();

  if (!membershipTypeUniqueId) {
    return <Navigate to={APP_ROUTES.membershipWizardTitle} replace />;
  }

  return (
    <Navigate
      to={buildMembershipWizardStepPath(
        APP_ROUTES.membershipWizardDescription,
        membershipTypeUniqueId,
        2,
      )}
      replace
    />
  );
}

function getWizardStepSegment(stepPath: string) {
  return stepPath.slice(stepPath.lastIndexOf("/") + 1);
}

function RouterApp() {
  return (
    <Routes>
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
          <Route path="membership/type">
            <Route index element={<Navigate to={APP_ROUTES.membershipDashboard} replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="types" element={<MembershipTypesPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route
              path="pending-approvals"
              element={<SimplePage title="Pending Approvals" description="Review and approve membership requests here." />}
            />
          </Route>
          <Route path="organizer/custom-form/list" element={<CustomFormsPage />} />
          <Route path="organizer/custom-form">
            <Route path="create-form" element={<CustomFormCreatePage />} />
          </Route>
        </Route>

        <Route element={<WizardLayout />}>
          <Route path="membership/type/wizard">
            <Route index element={<Navigate to={APP_ROUTES.membershipWizardTitle} replace />} />
            <Route path="title" element={<MembershipTitleStepPage />} />
            <Route path=":membershipTypeUniqueId">
              <Route index element={<WizardDescriptionRedirect />} />
              {MEMBERSHIP_WIZARD_STEPS.slice(1).map((step) => (
                <Route
                  key={step.to}
                  path={getWizardStepSegment(step.to)}
                  element={<WizardStepPage title={step.label} description={step.description} />}
                />
              ))}
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
    <BrowserRouter>
      <RouterApp />
    </BrowserRouter>
  );
}
