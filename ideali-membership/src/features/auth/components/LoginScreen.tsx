import { useState } from "react";
import { useAuth } from "../AuthContext";
import { PasswordInput } from "../../../components/inputs/PasswordInput/PasswordInput";

export function LoginScreen() {
  const { status, loginError, pendingChallenge, signIn, verifyTwoFactor } = useAuth();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");

  const isSubmitting = status === "loading";
  const isTwoFactorStep = status === "pending-2fa" && pendingChallenge;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-8rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-10rem] top-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-700">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            Secure access for membership operations
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
              Sign in to manage members, billing, and operations.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              The rest of the application stays protected until a user is authenticated. If 2FA is enabled, we will guide them through that
              step before unlocking the dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "JWT + refresh token flow",
              "2FA verification support",
              "Protected app shell",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-slate-200/40 backdrop-blur sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Welcome back</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                {isTwoFactorStep ? "Verify your code" : "Sign in to continue"}
              </h2>
            </div>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700">
              Protected
            </span>
          </div>

          {loginError ? (
            <div className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loginError}
            </div>
          ) : null}

          {!isTwoFactorStep ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await signIn(userName, password);
              }}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </span>
                <input
                  type="email"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="name@company.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </span>
                <PasswordInput
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter your password"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await verifyTwoFactor(emailCode);
              }}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email code
                </span>
                <input
                  type="text"
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter the code sent to your email"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Verifying..." : "Verify code"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
