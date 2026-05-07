import { BadgeInfo, Check, ChevronRight, Info, X } from "lucide-react";

export function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M13.586 3a2 2 0 0 1 2.828 0l.586.586a2 2 0 0 1 0 2.828l-8.95 8.95a2 2 0 0 1-.878.514l-3.18.795a1 1 0 0 1-1.212-1.212l.795-3.18a2 2 0 0 1 .515-.878zM12 4.586 4.332 12.254l-.456 1.823 1.823-.456L13.414 5.586z" />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return <ChevronRight className="h-4 w-4" />;
}

export function CheckBadgeIcon() {
  return <Check className="h-4 w-4" />;
}

export function MenuCheckIcon() {
  return <Check className="h-4 w-4" />;
}

export function StatusIcon() {
  return <BadgeInfo className="h-4 w-4" />;
}

export function XBadgeIcon() {
  return <X className="h-4 w-4" />;
}

export function InfoIcon() {
  return <Info className="h-5 w-5" />;
}

export function AvailabilityBadge({ value }: { value: boolean }) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckBadgeIcon />
        Yes
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
      <XBadgeIcon />
      No
    </span>
  );
}

export function MembershipMetaPill({
  value,
  tone = "neutral",
}: {
  value: string | null | undefined;
  tone?: "neutral" | "success" | "warning";
}) {
  if (!value) {
    return null;
  }

  const toneClasses = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses}`}>{value}</span>;
}

export function InlineSeparator() {
  return <span className="text-slate-300">|</span>;
}
