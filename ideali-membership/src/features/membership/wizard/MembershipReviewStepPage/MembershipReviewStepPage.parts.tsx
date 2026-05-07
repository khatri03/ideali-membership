import type { ReactNode } from "react";

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
    </svg>
  );
}

function CircleCheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M10 1.75a8.25 8.25 0 1 0 8.25 8.25A8.26 8.26 0 0 0 10 1.75Zm3.68 6.62-4.18 4.75a.9.9 0 0 1-.67.3.87.87 0 0 1-.63-.26L6.3 10.58l1.3-1.3 1.17 1.17 3.57-4.06Z" />
    </svg>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  focusTarget,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  focusTarget?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      data-wizard-focus={focusTarget ? "true" : undefined}
      className={[
        "relative inline-flex h-8 w-14 items-center rounded-full border transition",
        checked ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-slate-200",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-7" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function ReviewGridRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 border-b border-slate-200 last:border-b-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 lg:px-5 lg:py-4">{label}</div>
      <div className="px-5 pb-4 pt-2 lg:px-5 lg:py-4">{children}</div>
    </div>
  );
}

export function CheckPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
        <CheckIcon className="h-4 w-4" />
      </span>
      Yes
    </span>
  );
}

export function NoPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-white">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="currentColor">
          <path d="M5.7 4.3 4.3 5.7 8.6 10l-4.3 4.3 1.4 1.4L10 11.4l4.3 4.3 1.4-1.4-4.3-4.3 4.3-4.3-1.4-1.4-4.3 4.3z" />
        </svg>
      </span>
      No
    </span>
  );
}

export function ReviewLiveStatusConfirmModal({
  isLive,
  onCancel,
  onConfirm,
}: {
  isLive: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Review membership</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Confirm live status</h3>
        </div>

        <div className="space-y-3 px-6 py-5">
          <p className="text-sm leading-6 text-slate-600">
            You are about to save the review and {isLive ? "publish this membership for signup." : "keep this membership in review."}
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Publish state</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{isLive ? "Published" : "Ready To Go Live"}</p>
          </div>
          <p className="text-sm leading-6 text-slate-600">Please confirm this before saving the membership review.</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-cyan-200 bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Save &amp; Exit
          </button>
        </div>
      </div>
    </div>
  );
}
