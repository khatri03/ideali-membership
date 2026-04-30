import { useEffect, useMemo, useState } from "react";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import { useMembershipRegisterPage } from "./MembershipRegisterPage.hooks";

function formatCountdownValue(value: number) {
  return String(value).padStart(2, "0");
}

function useCountdown(targetUtc: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetUtc) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [targetUtc]);

  return useMemo(() => {
    if (!targetUtc) {
      return null;
    }

    const targetTime = new Date(targetUtc).getTime();
    if (!Number.isFinite(targetTime)) {
      return null;
    }

    const remaining = Math.max(targetTime - now, 0);
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      remaining,
      targetTime,
    };
  }, [now, targetUtc]);
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7 fill-current">
      <path d="M10 2.5 18 17.5H2L10 2.5Zm0 4.1a.75.75 0 0 0-.75.75v4.3a.75.75 0 0 0 1.5 0v-4.3A.75.75 0 0 0 10 6.6Zm0 8.1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7 fill-current">
      <path d="M10 1.75a8.25 8.25 0 1 0 8.25 8.25A8.26 8.26 0 0 0 10 1.75Zm3.68 6.62-4.18 4.75a.9.9 0 0 1-.67.3.87.87 0 0 1-.63-.26L6.3 10.58l1.3-1.3 1.17 1.17 3.57-4.06Z" />
    </svg>
  );
}

function CountdownTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-amber-950">{formatCountdownValue(value)}</p>
    </div>
  );
}

function UpcomingCard({
  targetUtc,
}: {
  targetUtc: string;
}) {
  const countdown = useCountdown(targetUtc);

  if (!countdown) {
    return null;
  }

  return (
    <section className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-amber-50/95 p-8 text-amber-950 shadow-xl shadow-amber-200/40 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-700">
        <WarningIcon />
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
        {MEMBERSHIP_REGISTER_PAGE_COPY.openingSoonTitle}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-amber-950">
        {MEMBERSHIP_REGISTER_PAGE_COPY.openingSoonTitle}
      </h1>
      <p className="mt-3 text-sm leading-6 text-amber-900/80">
        {MEMBERSHIP_REGISTER_PAGE_COPY.openingSoonBody}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CountdownTile label="Days" value={countdown.days} />
        <CountdownTile label="Hours" value={countdown.hours} />
        <CountdownTile label="Minutes" value={countdown.minutes} />
        <CountdownTile label="Seconds" value={countdown.seconds} />
      </div>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900 shadow-sm">
        Registration opens at {new Intl.DateTimeFormat(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(new Date(targetUtc))}
      </div>
    </section>
  );
}

function OpenCard() {
  return (
    <section className="w-full max-w-2xl rounded-[2rem] border border-emerald-200 bg-emerald-50/95 p-8 text-emerald-950 shadow-xl shadow-emerald-200/30 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-700">
        <OpenIcon />
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
        {MEMBERSHIP_REGISTER_PAGE_COPY.openTitle}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950">
        {MEMBERSHIP_REGISTER_PAGE_COPY.openBody}
      </h1>
      <p className="mt-3 text-sm leading-6 text-emerald-900/80">
        You can continue with public registration now.
      </p>
    </section>
  );
}

function UnavailableCard() {
  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-amber-200 bg-amber-50/95 p-8 text-center shadow-xl shadow-amber-200/40 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
        <WarningIcon />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-amber-950">
        {MEMBERSHIP_REGISTER_PAGE_COPY.unavailableTitle}
      </h1>
      <p className="mt-3 text-sm leading-6 text-amber-900/80">
        {MEMBERSHIP_REGISTER_PAGE_COPY.unavailableBody}
      </p>
    </section>
  );
}

export function MembershipRegisterPage() {
  const { isLoading, registrationState, registrationStartDateUtc, onRetry } = useMembershipRegisterPage();
  const effectiveRegistrationState = useMemo(() => {
    if (!registrationStartDateUtc) {
      return registrationState;
    }

    const startTime = new Date(registrationStartDateUtc).getTime();
    if (!Number.isFinite(startTime)) {
      return registrationState;
    }

    if (startTime > Date.now()) {
      return "Upcoming" as const;
    }

    return registrationState;
  }, [registrationStartDateUtc, registrationState]);

  useEffect(() => {
    if (effectiveRegistrationState !== "Upcoming" || !registrationStartDateUtc) {
      return;
    }

    const targetTime = new Date(registrationStartDateUtc).getTime();
    if (!Number.isFinite(targetTime)) {
      return;
    }

    const now = Date.now();
    const timeout = window.setTimeout(() => {
      void onRetry();
    }, Math.max(targetTime - now, 1000));

    return () => {
      window.clearTimeout(timeout);
    };
  }, [effectiveRegistrationState, onRetry, registrationStartDateUtc]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef6fb_100%)] px-4 py-10 text-slate-900">
      {isLoading ? (
        <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white/95 p-8 text-center shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Loading</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Registration details</h1>
        </section>
      ) : effectiveRegistrationState === "Upcoming" && registrationStartDateUtc ? (
        <UpcomingCard targetUtc={registrationStartDateUtc} />
      ) : effectiveRegistrationState === "Open" ? (
        <OpenCard />
      ) : (
        <UnavailableCard />
      )}
    </main>
  );
}
