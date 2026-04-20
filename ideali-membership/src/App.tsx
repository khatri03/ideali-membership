import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import { ProtectedShell } from "./components/ProtectedShell";
import { CustomFormCreatePage } from "./pages/CustomFormCreatePage";
import { CustomFormsPage } from "./pages/CustomFormsPage";
import { DashboardPage } from "./pages/DashboardPage";
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
      <Route path={APP_ROUTES.root} element={<AppHome />} />
      <Route path={APP_ROUTES.login} element={<LoginRoute />} />
      <Route
        path={APP_ROUTES.app}
        element={
          <RequireAuth>
            <ProtectedShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to={APP_ROUTES.membershipDashboard} replace />} />
        <Route path="dashboard" element={<Navigate to={APP_ROUTES.membershipDashboard} replace />} />
        <Route path="membership">
          <Route index element={<Navigate to={APP_ROUTES.membershipDashboard} replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="types" element={<SimplePage title="Types" description="Membership types will be managed here." />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="pending-approvals" element={<SimplePage title="Pending Approvals" description="Review and approve membership requests here." />} />
        </Route>
        <Route
          path="custom-forms"
        >
          <Route index element={<CustomFormsPage />} />
          <Route path="create" element={<CustomFormCreatePage />} />
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
