import { useAuth } from "../auth/AuthContext";

const metrics = [
  { label: "Active members", value: "4,218", delta: "+12.4%" },
  { label: "Renewal rate", value: "96.2%", delta: "+3.1%" },
  { label: "Monthly revenue", value: "$84.9k", delta: "+9.8%" },
];

const activity = [
  { title: "12 renewals completed", detail: "Today at 09:42" },
  { title: "New enterprise plan purchased", detail: "Today at 11:15" },
  { title: "7 members updated profiles", detail: "Today at 12:08" },
];

const quickActions = [
  "Review pending applications",
  "Adjust membership plans",
  "Export today's activity",
];

export function ProtectedShell() {
  const { session, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-300 uppercase">
              Ideali
            </p>
            <p className="text-xs text-slate-400">
              Signed in as {session?.userDetail.name || session?.userDetail.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {session?.organizerDetail.emailBrandingEnabled ? (
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                Branding enabled
              </span>
            ) : null}
            <button
              onClick={signOut}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 py-10 lg:py-16">
          <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Protected dashboard
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
                  Welcome, {session?.userDetail.name || "member"}.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  This area is only available after authentication. Use it for
                  admin workflows, member operations, and the rest of the
                  protected experience.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur"
                  >
                    <p className="text-sm text-slate-400">{metric.label}</p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <span className="text-3xl font-semibold text-white">
                        {metric.value}
                      </span>
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        {metric.delta}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {quickActions.map((item) => (
                  <button
                    key={item}
                    className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-left text-sm text-slate-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Overview</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Today&apos;s summary
                  </h2>
                </div>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  Live
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {activity.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                <p className="text-sm text-cyan-200">Session status</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Authenticated and ready.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Your access token and refresh token are stored locally for the
                  current session. Swap this for a stricter storage policy if
                  your security model requires it.
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

