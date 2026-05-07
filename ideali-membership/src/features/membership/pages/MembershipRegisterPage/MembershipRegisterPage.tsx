import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useMembershipRegisterPage } from "./MembershipRegisterPage.hooks";
import { MembershipRegisterWizard } from "./MembershipRegisterWizard";
import { buildMembershipRegisterCountdownPath } from "../../../../app/routes";
import {
  DecorativeShapeGlyph,
  buildDecorativeShapes,
  buildMembershipTheme,
  hashSeed,
  isEnabledFlag,
} from "./MembershipRegisterPage.background";
import { ErrorCard, SuccessCard, UnavailableCard } from "./MembershipRegisterPage.cards";

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
          />
        ) : (
          <UnavailableCard />
        )}
      </div>
    </main>
  );
}


