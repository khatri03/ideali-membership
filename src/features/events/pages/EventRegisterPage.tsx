import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, Copy, ExternalLink, Globe, LayoutPanelLeft, MapPin, ShieldCheck, Sparkles, Ticket, Users } from "lucide-react";
import { APP_ROUTES, buildEventRegisterPath } from "../../../app/router/routes";

type CheckState = "done" | "pending";

interface ChecklistItem {
  label: string;
  description: string;
  state: CheckState;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    label: "Route resolved",
    description: "The public event registration path is wired and ready to receive the event unique ID.",
    state: "done",
  },
  {
    label: "Visual hierarchy",
    description: "A premium hero, clear content blocks, and balanced spacing keep the page readable at every size.",
    state: "done",
  },
  {
    label: "Responsive layout",
    description: "The card stack collapses cleanly on mobile without losing the primary CTA or supporting details.",
    state: "done",
  },
  {
    label: "Backend wiring",
    description: "The registration form and eligibility checks will slot into this shell without changing the page structure.",
    state: "pending",
  },
];

function getShortId(value: string) {
  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function StatusPill({ label, tone = "slate" }: { label: string; tone?: "slate" | "emerald" | "amber" }) {
  const styles: Record<typeof tone, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${styles[tone]}`}>
      {label}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 ${
        accent ? "border-slate-900/10 bg-slate-950 text-white shadow-slate-950/10" : "border-slate-200 bg-white text-slate-900 shadow-slate-200/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
            accent ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${accent ? "text-white/65" : "text-slate-500"}`}>{label}</p>
          <p className={`mt-1 text-base font-semibold ${accent ? "text-white" : "text-slate-900"}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const isDone = item.state === "done";

  return (
    <div className={`rounded-3xl border p-4 ${isDone ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"}`}>
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-2xl border ${
            isDone ? "border-emerald-200 bg-white text-emerald-600" : "border-amber-200 bg-white text-amber-600"
          }`}
        >
          {isDone ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{item.label}</p>
            <StatusPill label={isDone ? "Ready" : "Pending"} tone={isDone ? "emerald" : "amber"} />
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

export function EventRegisterPage() {
  const { eventUniqueId = "" } = useParams<{ eventUniqueId?: string }>();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const registrationUrl = useMemo(() => {
    if (!eventUniqueId) {
      return "";
    }

    return new URL(buildEventRegisterPath(eventUniqueId), window.location.origin).toString();
  }, [eventUniqueId]);

  const shortEventId = useMemo(() => getShortId(eventUniqueId || "event-registration"), [eventUniqueId]);

  async function handleCopyUrl() {
    if (!registrationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_48%,#F8FAFC_100%)] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_24%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <Link
            to={APP_ROUTES.root}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label="Public registration" tone="emerald" />
            <StatusPill label="Responsive" />
            <StatusPill label="Production shell" />
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.88fr)]">
          <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-slate-950 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.22),rgba(79,70,229,0.12),rgba(15,23,42,0.92))] px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                  <Sparkles className="h-3.5 w-3.5" />
                  Event registration
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  <Ticket className="h-3.5 w-3.5" />
                  ID {shortEventId}
                </span>
              </div>

              <div className="mt-6 max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/85">Modern attendee intake</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  A clean registration entry point for every event.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  This shell is built for the final form experience: clear hierarchy, calm premium styling, fast scanning, and a responsive layout that still feels polished on mobile.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={<Globe className="h-5 w-5" />} label="Route" value="/events/:eventUniqueId/register" accent />
                <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Availability" value="Ready for backend data" />
                <StatCard icon={<Users className="h-5 w-5" />} label="Audience" value="Public attendees" />
                <StatCard icon={<MapPin className="h-5 w-5" />} label="Flow" value="Desktop and mobile" />
              </div>
            </div>

            <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 text-slate-900 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Registration link</p>
                      <p className="mt-2 break-all text-sm leading-7 text-slate-600">
                        {registrationUrl || "The event unique ID will render the registration URL here."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleCopyUrl()}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                      >
                        <Copy className="h-4 w-4" />
                        {copyState === "copied" ? "Copied" : "Copy URL"}
                      </button>
                      <a
                        href={registrationUrl || undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!registrationUrl}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                          registrationUrl
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : "pointer-events-none cursor-not-allowed bg-slate-100 text-slate-400"
                        }`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in new tab
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                        <LayoutPanelLeft className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Form shell</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">Balanced, enterprise layout</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Enough structure for the real attendee form without feeling cramped or overly decorative.
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trust cues</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">Clear and reassuring</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      The page reads like a real public entry point instead of a placeholder route.
                    </p>
                  </div>
                </div>
              </div>

              <aside className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Registration checklist</p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">What is ready now</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This block gives the page a strong product feel while the live form and backend state arrive later.
                  </p>
                </div>

                <div className="space-y-3">
                  {CHECKLIST_ITEMS.map((item) => (
                    <ChecklistRow key={item.label} item={item} />
                  ))}
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Countdown slot</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">Reserved for the live booking window</p>
                    </div>
                    <ClockDisplay />
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {["--", "--", "--", "--"].map((value, index) => (
                      <div key={value + index} className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center">
                        <div className="text-xl font-black tracking-tight text-slate-950">{value}</div>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {["Days", "Hours", "Min", "Sec"][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ClockDisplay() {
  const time = new Date()
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

  return (
    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-600">
      {time} UTC
    </div>
  );
}
