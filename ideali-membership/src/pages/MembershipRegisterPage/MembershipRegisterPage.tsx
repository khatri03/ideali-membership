import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import { useMembershipRegisterPage } from "./MembershipRegisterPage.hooks";
import { MembershipRegisterWizard } from "./MembershipRegisterWizard";
import { buildMembershipRegisterCountdownPath } from "../../routes";

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

type DecorativeShape = {
  kind: "circle" | "square" | "diamond" | "hex" | "ring" | "shield";
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number;
  opacity: number;
  rotate: number;
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

function blendWithWhite(rgb: { r: number; g: number; b: number }, ratio: number) {
  const whiteRatio = 1 - ratio;
  const mix = {
    r: Math.round(rgb.r * ratio + 255 * whiteRatio),
    g: Math.round(rgb.g * ratio + 255 * whiteRatio),
    b: Math.round(rgb.b * ratio + 255 * whiteRatio),
  };

  return `rgb(${mix.r}, ${mix.g}, ${mix.b})`;
}

function hashSeed(value: string | null | undefined) {
  const source = value?.trim() || "ideali-membership";
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function seededValue(seed: number, offset: number) {
  const value = (seed * 1103515245 + offset * 12345) >>> 0;
  return value % 1000;
}

function isEnabledFlag(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

function buildDecorativeShapes(seed: number): DecorativeShape[] {
  const kinds: DecorativeShape["kind"][] = ["circle", "square", "diamond", "hex", "ring", "shield"];
  const shapeIndex = seed % kinds.length;
  const kind = kinds[shapeIndex] ?? "circle";
  const size = (42 + (seededValue(seed, 1) % 12)) * 2;
  const rotateBase = (seededValue(seed, 21) % 32) - 16;

  return [
    {
      kind,
      top: "4%",
      left: "0%",
      size,
      opacity: 1,
      rotate: rotateBase,
    },
    {
      kind,
      top: "4%",
      right: "0%",
      size,
      opacity: 1,
      rotate: -rotateBase,
    },
    {
      kind,
      bottom: "4%",
      left: "0%",
      size,
      opacity: 1,
      rotate: -rotateBase,
    },
    {
      kind,
      bottom: "4%",
      right: "0%",
      size,
      opacity: 1,
      rotate: rotateBase,
    },
  ];
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
    pageBackground: blendWithWhite(accentRgb, 0.1),
    cardBackground: "transparent",
    cardBorder: rgba(accentRgb, 0.58),
    cardShadow: rgba(accentRgb, 0.18),
    iconBackground: rgba(accentRgb, 0.18),
    iconBorder: rgba(accentRgb, 0.46),
    iconColor: level1,
    titleColor: "#020617",
    bodyColor: "#334155",
    labelColor: level1,
    mutedLabelColor: level2,
    tileBorder: rgba(accentRgb, 0.5),
    tileBackground: "transparent",
    tileLabelColor: level2,
    tileValueColor: "#020617",
    barBackground: rgba(accentRgb, 0.18),
  };
}

function DecorativeShapeGlyph({ kind, size }: { kind: DecorativeShape["kind"]; size: number }) {
  const strokeWidth = Math.max(2, Math.round(size / 16));
  const fillOpacity = kind === "ring" ? 0 : 1;
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    "aria-hidden": true as const,
    fill: "currentColor",
  };

  switch (kind) {
    case "square":
      return (
        <svg {...commonProps}>
          <rect x="10" y="10" width="44" height="44" rx="10" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...commonProps}>
          <path d="M32 8 56 32 32 56 8 32Z" />
        </svg>
      );
    case "hex":
      return (
        <svg {...commonProps}>
          <path d="M22 10h20l14 22-14 22H22L8 32Z" />
        </svg>
      );
    case "ring":
      return (
        <svg {...commonProps} fill="none">
          <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth={strokeWidth} fillOpacity={fillOpacity} />
          <circle cx="32" cy="32" r="10" fill="currentColor" fillOpacity="0.26" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M32 8 52 14v16c0 13-8 22-20 26-12-4-20-13-20-26V14Z" />
        </svg>
      );
    case "circle":
    default:
      return (
        <svg {...commonProps}>
          <circle cx="32" cy="32" r="22" />
        </svg>
      );
  }
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7 fill-current">
      <path d="M10 2.5 18 17.5H2L10 2.5Zm0 4.1a.75.75 0 0 0-.75.75v4.3a.75.75 0 0 0 1.5 0v-4.3A.75.75 0 0 0 10 6.6Zm0 8.1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
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

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-rose-50/95 p-8 text-center shadow-xl shadow-rose-200/30 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600">
        <WarningIcon />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-rose-950">We could not load registration</h1>
      <p className="mt-3 text-sm leading-6 text-rose-900/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Try again
      </button>
    </section>
  );
}

function SuccessCard({ message }: { message: string }) {
  return (
    <section className="w-full max-w-lg rounded-[2rem] border border-emerald-200 bg-emerald-50/95 p-8 text-center shadow-xl shadow-emerald-200/30 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-600">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7 fill-current">
          <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
        </svg>
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-emerald-950">Registration submitted</h1>
      <p className="mt-3 text-sm leading-6 text-emerald-900/80">{message}</p>
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900">
        The organizer can now review the registration details.
      </div>
    </section>
  );
}

export function MembershipRegisterPage() {
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const registration = useMembershipRegisterPage();
  const {
    isLoading,
    registrationState,
    registrationStartDateUtc,
    membershipColor,
    loadError,
    submitError,
    submitMessage,
    onRetry,
  } = registration;
  const theme = useMemo(() => buildMembershipTheme(membershipColor), [membershipColor]);
  const showBackgroundIcons = isEnabledFlag(import.meta.env.VITE_SHOW_REGISTRATION_BACKGROUND_ICONS);
  const decorativeIcons = useMemo(
    () => (showBackgroundIcons ? buildDecorativeShapes(hashSeed(membershipTypeUniqueId ?? membershipColor ?? theme.level1)) : []),
    [membershipTypeUniqueId, membershipColor, showBackgroundIcons, theme.level1],
  );
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

  return (
    <main
      className="relative flex min-h-screen items-start justify-center overflow-hidden px-4 py-6 text-slate-900"
      style={{ background: theme.pageBackground }}
    >
      {showBackgroundIcons ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {decorativeIcons.map(({ kind, top, left, right, bottom, size, opacity, rotate }, index) => (
            <div
              key={`${top ?? bottom}-${left ?? right ?? "x"}-${index}`}
              className="absolute flex items-center justify-center"
              style={{
                top,
                left,
                right,
                bottom,
                width: `${size}px`,
                height: `${size}px`,
                color: theme.level1,
                opacity,
                transform: `rotate(${rotate}deg) ${left ? "translateX(-48%)" : ""}`.trim(),
              }}
            >
              <DecorativeShapeGlyph kind={kind} size={size} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="relative z-10 flex w-full justify-center">
        {isLoading ? (
          <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white/95 p-8 text-center shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: theme.level1 }}>
              Loading
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Registration details</h1>
          </section>
        ) : loadError ? (
          <ErrorCard message={loadError} onRetry={onRetry} />
        ) : submitMessage ? (
          <SuccessCard message={submitMessage} />
        ) : effectiveRegistrationState === "Upcoming" && registrationStartDateUtc && membershipTypeUniqueId ? (
          <Navigate to={buildMembershipRegisterCountdownPath(membershipTypeUniqueId)} replace />
        ) : effectiveRegistrationState === "Open" ? (
          <MembershipRegisterWizard
            info={registration.info!}
            form={registration.form}
            errors={registration.errors}
            isSubmitting={registration.isSubmitting}
            onSubmit={registration.onSubmit}
            setField={registration.setField}
            formattedMembershipCharges={registration.formattedMembershipCharges}
            isFreeMembership={registration.isFreeMembership}
            theme={theme}
            membershipName={registration.membershipName}
            membershipDescription={registration.membershipDescription}
            submitError={submitError}
            couponValidation={registration.couponValidation}
            couponValidationError={registration.couponValidationError}
            isValidatingCoupon={registration.isValidatingCoupon}
            isCouponApplied={registration.isCouponApplied}
            onValidateCoupon={registration.onValidateCoupon}
            onClearCoupon={registration.onClearCoupon}
          />
        ) : (
          <UnavailableCard />
        )}
      </div>
    </main>
  );
}
