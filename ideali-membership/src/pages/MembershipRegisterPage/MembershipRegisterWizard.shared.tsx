import { useEffect, useRef, useState, type ReactNode } from "react";

export type MembershipTheme = {
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

function formatStepNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
    </svg>
  );
}

export function MembershipDescriptionPanel({
  description,
  theme,
}: {
  description: string;
  theme: MembershipTheme;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const trimmedDescription = description.trim();

  useEffect(() => {
    if (!trimmedDescription || !previewRef.current) {
      setIsOverflowing(false);
      return;
    }

    const element = previewRef.current;
    const updateOverflowState = () => {
      setIsOverflowing(element.scrollHeight > element.clientHeight + 2);
    };

    updateOverflowState();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateOverflowState);
    observer.observe(element);

    return () => observer.disconnect();
  }, [trimmedDescription]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  if (!trimmedDescription) {
    return null;
  }

  return (
    <>
      <div
        className="space-y-2 rounded-3xl border p-4 text-left sm:p-5"
        style={{
          borderColor: theme.cardBorder,
          background: theme.cardBackground,
          boxShadow: `0 18px 42px -28px ${theme.cardShadow}`,
        }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: theme.level1 }}>
          About This Membership
        </p>
        <div
          ref={previewRef}
          className="max-h-44 overflow-hidden text-base leading-7 [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:ml-6 sm:max-h-52 lg:max-h-60"
          style={{ color: theme.bodyColor }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {isOverflowing ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
            style={{ color: theme.level1 }}
          >
            More
          </button>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close description modal"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="About This Membership"
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-4xl border p-5 shadow-2xl sm:p-6"
            style={{
              borderColor: theme.cardBorder,
              background: "rgba(255, 255, 255, 0.98)",
              boxShadow: `0 30px 80px -30px ${theme.cardShadow}, 0 0 0 1px rgba(255, 255, 255, 0.7) inset`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: theme.level1 }}>
                  About This Membership
                </p>
                <p className="text-sm" style={{ color: theme.bodyColor }}>
                  Full description
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border px-3 py-1 text-sm font-semibold text-white transition hover:opacity-80"
                style={{
                  borderColor: theme.cardBorder,
                  background: theme.level1,
                }}
              >
                Close
              </button>
            </div>
            <div
              className="mt-5 max-h-[70vh] overflow-y-auto text-base leading-7 [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:ml-6"
              style={{ color: "#0f172a" }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}

export function FieldTooltip({ text, theme }: { text: string; theme: MembershipTheme }) {
  return (
    <span className="inline-flex shrink-0 align-middle text-current" style={{ color: theme.bodyColor }}>
      <button
        type="button"
        aria-label="Show additional field help"
        title={text}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-current transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current opacity-70">
          <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 2a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2.25A1.25 1.25 0 1 0 10 8a1.25 1.25 0 0 0 0-2.5Zm-1 4.1h2V14h-2V9.85Z" />
        </svg>
      </button>
    </span>
  );
}

export function StepBadge({
  index,
  title,
  active,
  completed,
  disabled,
  onClick,
  theme,
}: {
  index: number;
  title: string;
  active: boolean;
  completed: boolean;
  disabled: boolean;
  onClick: () => void;
  theme: MembershipTheme;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative flex min-w-30 flex-1 flex-col items-center gap-1.5 rounded-none border-0 px-2 py-2 text-center transition sm:min-w-40 sm:gap-2 sm:px-3",
        disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-100",
      ].join(" ")}
      style={{
        background: "transparent",
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-4 ring-white transition sm:h-10 sm:w-10"
        style={{
          background: completed || active ? theme.level1 : "rgba(71, 85, 105, 0.18)",
          color: completed || active ? "#ffffff" : "#020617",
          boxShadow: active ? `0 0 0 6px ${theme.barBackground}` : "none",
        }}
      >
        {completed && !active ? <CheckIcon className="h-4 w-4" /> : formatStepNumber(index)}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold leading-5 sm:text-base" style={{ color: active ? theme.level1 : theme.titleColor }}>
          {title}
        </p>
      </div>
      <div
        className="mt-1 h-1 w-full rounded-full transition"
        style={{
          background: completed || active ? theme.level1 : "rgba(148, 163, 184, 0.1)",
        }}
      />
    </button>
  );
}

export function SectionTitle({
  title,
  description,
  theme,
}: {
  title: string;
  description: string;
  theme: MembershipTheme;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.titleColor }}>
        {title}
      </h2>
      <p className="text-base leading-6" style={{ color: theme.bodyColor }}>
        {description}
      </p>
    </div>
  );
}

export function WizardField({
  label,
  children,
  error,
  theme,
  required = false,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  theme: MembershipTheme;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-base text-rose-600">{error}</span> : null}
    </label>
  );
}

export function CameraIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.5 3.5 6.4 5H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2.4L12.5 3.5h-5Zm2.5 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    </svg>
  );
}

export function AvatarSilhouetteIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.79-8 6.23V21h16v-.77C20 16.79 16.42 14 12 14Z" />
    </svg>
  );
}
