import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthSession, LoginChallenge } from "../../types/auth";
import { postForm, postJson } from "../../lib/api";
import { readResponseData, readText, readNumber, readBoolean } from "../../lib/parseUtils";
import { AUTH_STORAGE_KEY } from "./authStorage";

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
    return toAuthSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

function isExpired(session: AuthSession) {
  return new Date(session.expiresOnUtc).getTime() <= Date.now();
}

function toAuthSession(raw: unknown): AuthSession | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const userDetail = (candidate.UserDetail ?? candidate.userDetail) as
    | Record<string, unknown>
    | undefined;
  const organizerDetail = (candidate.OrganizerDetail ?? candidate.organizerDetail) as
    | Record<string, unknown>
    | undefined;

  if (!candidate.AccessToken && !candidate.accessToken) {
    return null;
  }

  return {
    accessToken: readText(candidate.AccessToken ?? candidate.accessToken),
    refreshToken: readText(candidate.RefreshToken ?? candidate.refreshToken),
    expiresOnUtc: readText(candidate.ExpiresOnUtc ?? candidate.expiresOnUtc),
    expiresInMinutes: readNumber(candidate.ExpiresInMinutes ?? candidate.expiresInMinutes) ?? 0,
    userDetail: {
      email: readText(userDetail?.Email ?? userDetail?.email),
      name: readText(userDetail?.Name ?? userDetail?.name),
      logoUrl: (userDetail?.LogoUrl ?? userDetail?.logoUrl) as string | null | undefined,
      userId: readNumber(userDetail?.UserId ?? userDetail?.userId) ?? 0,
      roles: Array.isArray(userDetail?.Roles ?? userDetail?.roles)
        ? ((userDetail?.Roles ?? userDetail?.roles) as string[])
        : [],
    },
    organizerDetail: {
      email: readText(organizerDetail?.Email ?? organizerDetail?.email),
      name: readText(organizerDetail?.Name ?? organizerDetail?.name),
      organizerId: readNumber(organizerDetail?.OrganizerId ?? organizerDetail?.organizerId) ?? 0,
      organizerUniqueId: readText(
        organizerDetail?.OrganizerUniqueId ?? organizerDetail?.organizerUniqueId,
      ),
      emailBrandingEnabled: readBoolean(
        organizerDetail?.EmailBrandingEnabled ?? organizerDetail?.emailBrandingEnabled,
      ),
      profiles: Array.isArray(organizerDetail?.Profiles ?? organizerDetail?.profiles)
        ? ((organizerDetail?.Profiles ?? organizerDetail?.profiles) as Array<Record<string, unknown>>).map(
            (profile) => ({
              name: readText(profile.Name ?? profile.name),
              uniqueId: readText(profile.UniqueId ?? profile.uniqueId),
            }),
          )
        : [],
      paymentAccounts: Array.isArray(
        organizerDetail?.PaymentAccounts ?? organizerDetail?.paymentAccounts,
      )
        ? ((organizerDetail?.PaymentAccounts ?? organizerDetail?.paymentAccounts) as Array<
            Record<string, unknown>
          >).map((account) => ({
            name: readText(account.Name ?? account.name),
            uniqueId: readText(account.UniqueId ?? account.uniqueId),
            stripeAccountNo: (account.StripeAccountNo ?? account.stripeAccountNo) as
              | string
              | null
              | undefined,
            stripePublishableKey: (account.StripePublishableKey ?? account.stripePublishableKey) as
              | string
              | null
              | undefined,
          }))
        : [],
    },
  };
}

function toChallenge(payload: unknown): LoginChallenge | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  if (!(candidate.requiresTwoFactor ?? candidate.RequiresTwoFactor)) {
    return null;
  }

  const twoFaToken = readText(candidate.twoFaToken ?? candidate.TwoFaToken);
  return twoFaToken ? { requiresTwoFactor: true, twoFaToken } : null;
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

      const responseData = readResponseData(payload);
      const challenge = toChallenge(responseData);
      if (challenge) {
        setPendingChallenge(challenge);
        setSession(null);
        setStatus("pending-2fa");
        return;
      }

      const nextSession = toAuthSession(responseData);
      if (!nextSession) {
        throw new Error("Unexpected login response.");
      }

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

      const responseData = readResponseData(payload);
      const nextSession = toAuthSession(responseData);
      if (!nextSession) {
        throw new Error("Unexpected verification response.");
      }

      setSession(nextSession);
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
