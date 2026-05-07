import type { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
