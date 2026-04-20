import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthSession, LoginChallenge } from "../types/auth";
import { postForm, postJson } from "../lib/api";

const AUTH_STORAGE_KEY = "ideali-membership.auth";

type AuthStatus = "loading" | "anonymous" | "pending-2fa" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  pendingChallenge: LoginChallenge | null;
  loginError: string | null;
  signIn: (userName: string, password: string) => Promise<void>;
  verifyTwoFactor: (emailCode: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed;
  } catch {
    return null;
  }
}

function isExpired(session: AuthSession) {
  return new Date(session.expiresOnUtc).getTime() <= Date.now();
}

function resolveResponseData(payload: unknown) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: unknown }).data;
  }

  return payload;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<LoginChallenge | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const storedSession = readStoredSession();
    if (storedSession && !isExpired(storedSession)) {
      setSession(storedSession);
      setStatus("authenticated");
      return;
    }

    if (storedSession) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    setStatus("anonymous");
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  }, [session, status]);

  const signOut = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
    setPendingChallenge(null);
    setLoginError(null);
    setStatus("anonymous");
  };

  const signIn = async (userName: string, password: string) => {
    setLoginError(null);
    setStatus("loading");

    try {
      const payload = await postForm<unknown>("/api/identity/account/authenticate", {
        userName,
        password,
      });

      const data = resolveResponseData(payload) as
        | (AuthSession & { requiresTwoFactor?: boolean; twoFaToken?: string })
        | undefined;

      if (!data) {
        throw new Error("Unexpected login response.");
      }

      if (data.requiresTwoFactor && data.twoFaToken) {
        setPendingChallenge({
          requiresTwoFactor: true,
          twoFaToken: data.twoFaToken,
        });
        setSession(null);
        setStatus("pending-2fa");
        return;
      }

      const nextSession: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresOnUtc: data.expiresOnUtc,
        expiresInMinutes: data.expiresInMinutes,
        userDetail: data.userDetail,
        organizerDetail: data.organizerDetail,
      };

      setSession(nextSession);
      setPendingChallenge(null);
      setStatus("authenticated");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in.");
      setStatus("anonymous");
    }
  };

  const verifyTwoFactor = async (emailCode: string) => {
    if (!pendingChallenge) {
      setLoginError("A 2FA challenge is required before verification.");
      return;
    }

    setLoginError(null);
    setStatus("loading");

    try {
      const payload = await postJson<unknown>(
        `/api/identity/account/2fa/${pendingChallenge.twoFaToken}/verify`,
        { emailCode },
      );

      const data = resolveResponseData(payload) as AuthSession | undefined;
      if (!data?.accessToken) {
        throw new Error("Unexpected verification response.");
      }

      setSession(data);
      setPendingChallenge(null);
      setStatus("authenticated");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to verify 2FA code.");
      setStatus("pending-2fa");
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      pendingChallenge,
      loginError,
      signIn,
      verifyTwoFactor,
      signOut,
    }),
    [loginError, pendingChallenge, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
