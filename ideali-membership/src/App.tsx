import { useAuth } from "./auth/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import { ProtectedShell } from "./components/ProtectedShell";

function App() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full border border-cyan-400/40 bg-cyan-400/10" />
          <p className="text-sm text-slate-300">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return <ProtectedShell />;
  }

  return <LoginScreen />;
}

export default App;

