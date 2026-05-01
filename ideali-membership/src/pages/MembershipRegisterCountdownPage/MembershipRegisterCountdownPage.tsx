import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "../MembershipRegisterPage/MembershipRegisterPage.fields";
import { useMembershipRegisterPage } from "../MembershipRegisterPage/MembershipRegisterPage.hooks";
import { APP_ROUTES, buildMembershipRegisterPath } from "../../routes";

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

type MembershipTheme = {
  accentRgb: { r: number; g: number; b: number };
  level1: string;
  level2: string;
  level3: string;
  pageBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  iconBackground: string;
  iconBorder: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  labelColor: string;
  mutedLabelColor: string;
  tileBorder: string;
  tileBackground: string;
  tileLabelColor: string;
  tileValueColor: string;
  barBackground: string;
};

function normalizeHexColor(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("#")) {
    trimmed = `#${trimmed}`;
  }

  const hex = trimmed.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
      .toLowerCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }

  return null;
}

function hexToRgb(value: string) {
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgba(rgb: { r: number; g: number; b: number }, alpha: number) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function buildMembershipTheme(color: string | null | undefined): MembershipTheme {
  const level1 = normalizeHexColor(color) ?? "#0ea5e9";
  const accentRgb = hexToRgb(level1) ?? { r: 14, g: 165, b: 233 };
  const level2 = rgba(accentRgb, 0.87);
  const level3 = rgba(accentRgb, 0.63);

  return {
    accentRgb,
    level1,
    level2,
    level3,
    pageBackground: rgba(accentRgb, 0.18),
    cardBackground: "#ffffff",
    cardBorder: rgba(accentRgb, 0.32),
    cardShadow: rgba(accentRgb, 0.18),
    iconBackground: rgba(accentRgb, 0.18),
    iconBorder: rgba(accentRgb, 0.46),
    iconColor: level1,
    titleColor: "#020617",
    bodyColor: "#334155",
    labelColor: level1,
    mutedLabelColor: level2,
    tileBorder: rgba(accentRgb, 0.28),
    tileBackground: "#ffffff",
    tileLabelColor: level2,
    tileValueColor: "#020617",
    barBackground: rgba(accentRgb, 0.18),
  };
}

function CountdownTile({ label, value, theme }: { label: string; value: number; theme: MembershipTheme }) {
  return (
    <div
      className="rounded-2xl border px-3 py-4 shadow-sm"
      style={{
        borderColor: theme.tileBorder,
        background: theme.tileBackground,
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.tileLabelColor }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: theme.tileValueColor }}>
        {formatCountdownValue(value)}
      </p>
    </div>
  );
}

function UpcomingCard({ targetUtc, theme }: { targetUtc: string; theme: MembershipTheme }) {
  const countdown = useCountdown(targetUtc);

  if (!countdown) {
    return null;
  }

  const countdownTiles = [
    countdown.days > 0 ? { label: "Days", value: countdown.days } : null,
    countdown.hours > 0 ? { label: "Hours", value: countdown.hours } : null,
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ].filter(Boolean) as Array<{ label: string; value: number }>;

  return (
    <section
      className="w-full max-w-2xl rounded-[2rem] border p-8 text-center"
      style={{
        borderColor: theme.cardBorder,
        background: theme.cardBackground,
      }}
    >
      <h1 className="mt-3 text-3xl font-bold tracking-tight" style={{ color: theme.level1 }}>
        {MEMBERSHIP_REGISTER_PAGE_COPY.openingSoonTitle}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6" style={{ color: theme.bodyColor }}>
        {MEMBERSHIP_REGISTER_PAGE_COPY.openingSoonBody}
      </p>
      <div
        className="mx-auto mt-6 grid max-w-xl gap-3"
        style={{ gridTemplateColumns: `repeat(${countdownTiles.length}, minmax(0, 1fr))` }}
      >
        {countdownTiles.map((tile) => (
          <CountdownTile key={tile.label} theme={theme} label={tile.label} value={tile.value} />
        ))}
      </div>
      <div
        className="mt-6 rounded-2xl border px-4 py-3 text-sm shadow-sm"
        style={{
          borderColor: theme.cardBorder,
          background: theme.barBackground,
          color: theme.bodyColor,
        }}
      >
        <span className="text-slate-500">Registration opens at</span>{" "}
        <strong className="font-semibold text-slate-900">
          {new Intl.DateTimeFormat(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(targetUtc))}
        </strong>
      </div>
    </section>
  );
}

function LoadingCard({ theme }: { theme: MembershipTheme }) {
  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white/95 p-8 text-center shadow-xl shadow-slate-200/50 backdrop-blur-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: theme.level1 }}>
        Loading
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Registration details</h1>
    </section>
  );
}

export function MembershipRegisterCountdownPage() {
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { isLoading, registrationState, registrationStartDateUtc, membershipColor } = useMembershipRegisterPage();
  const theme = useMemo(() => buildMembershipTheme(membershipColor), [membershipColor]);
  const countdown = useCountdown(registrationStartDateUtc);

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

    if (registrationState === "Upcoming") {
      return "Open" as const;
    }

    return registrationState;
  }, [registrationStartDateUtc, registrationState]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-900" style={{ background: theme.pageBackground }}>
        <LoadingCard theme={theme} />
      </main>
    );
  }

  if (effectiveRegistrationState !== "Upcoming" || !registrationStartDateUtc) {
    return <Navigate to={currentMembershipTypeUniqueId ? buildMembershipRegisterPath(currentMembershipTypeUniqueId) : APP_ROUTES.root} replace />;
  }

  if (countdown && countdown.remaining === 0) {
    return <Navigate to={currentMembershipTypeUniqueId ? buildMembershipRegisterPath(currentMembershipTypeUniqueId) : APP_ROUTES.root} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-900" style={{ background: theme.pageBackground }}>
      <UpcomingCard targetUtc={registrationStartDateUtc} theme={theme} />
    </main>
  );
}
