import { Link } from "react-router-dom";
import { APP_ROUTES } from "../app/routes";

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

export function DashboardPage() {
  return (
    <section className="grid w-full gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-700">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            Protected dashboard
          </div>

          <div className="mt-5 space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Welcome to the dashboard.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              This area is only available after authentication. The route now
              stays visible in the URL so navigation works like a real app.
            </p>
            <Link
              to={APP_ROUTES.membershipWizardTitle}
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Open membership wizard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{metric.label}</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <span className="text-3xl font-semibold text-slate-900">
                  {metric.value}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
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
              type="button"
              className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-5 text-left text-sm text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <aside className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Overview</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Today&apos;s summary
            </h2>
          </div>
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700">
            Live
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {activity.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-50 p-5">
          <p className="text-sm text-cyan-700">Session status</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Authenticated and ready.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your access token and refresh token are stored locally for the
            current session.
          </p>
        </div>
      </aside>
    </section>
  );
}

