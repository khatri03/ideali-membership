import { createPortal } from "react-dom";
import { ArrowUpDown, BadgeInfo, Check, ChevronRight, GripVertical, Info, Link2, UserPlus, Users, X } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { Modifier } from "@dnd-kit/core";
import type { MembershipTypeListItem, MembershipTypeOrderListItem } from "../types/membership";
import type { CSSProperties } from "react";

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
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="m7.25 4.5 5.75 5.5-5.75 5.5a1 1 0 1 0 1.4 1.42l6.5-6.22a1 1 0 0 0 0-1.4l-6.5-6.22A1 1 0 1 0 7.25 4.5Z" />
    </svg>
  );
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

export function showToast(message: string) {
  const existingToast = document.getElementById("membership-order-toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.id = "membership-order-toast";
  toast.className =
    "fixed right-6 top-6 z-[1300] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl";
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}

export const constrainOrderDragToParent: Modifier = ({ activeNodeRect, containerNodeRect, transform }) => {
  if (!activeNodeRect || !containerNodeRect) {
    return transform;
  }

  const minX = containerNodeRect.left - activeNodeRect.left;
  const maxX = containerNodeRect.right - activeNodeRect.right;
  const minY = containerNodeRect.top - activeNodeRect.top;
  const maxY = containerNodeRect.bottom - activeNodeRect.bottom;

  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
};

export function OrderListSkeletonRow() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="block h-3 w-20 rounded-full bg-slate-200/80 animate-pulse" />
      <span className="mt-2 block h-4 w-40 max-w-full rounded-full bg-slate-200/80 animate-pulse" />
    </div>
  );
}

export function SortableOrderItem({ item }: { item: MembershipTypeOrderListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.uniqueId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-3 shadow-sm",
        isDragging ? "border-cyan-300 bg-cyan-50/70 opacity-80 shadow-lg" : "border-slate-200",
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
      <button
        type="button"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 active:cursor-grabbing"
        aria-label={`Drag ${item.name} to sort`}
        title="Drag to sort"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </div>
  );
}

export function formatCurrencyAmount(value: number, currencyCode: string | null, currencySymbol: string | null) {
  if (!value) {
    return "Free";
  }

  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const resolvedCurrencyPrefix = currencyCode?.trim()
    ? currencyCode.trim().toUpperCase()
    : currencySymbol?.trim() ?? "";

  return `${resolvedCurrencyPrefix}${amount}`;
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

export function formatSetupStateLabel(value: string) {
  if (!value) {
    return "Draft";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "Ready To Go Live";
  }

  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
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

export function getSetupStatePillValue(value: string) {
  if (value === "Published") {
    return "Live";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "Ready For Review";
  }

  return formatSetupStateLabel(value);
}

export function getSetupStatePillTone(value: string): "neutral" | "success" | "warning" {
  if (value === "Published") {
    return "success";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "warning";
  }

  return "neutral";
}

export function getTenureLabel(value: string | null) {
  return value || "â€”";
}

export function isLifetimeTenure(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "lifetime" || normalized === "life time";
}

export function formatUtcDateLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = monthLabels[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  if (!month) {
    return null;
  }

  return `${day}-${month}-${year}`;
}

export function getTenureDisplayLabel(item: MembershipTypeListItem) {
  return getTenureLabel(item.tenureText);
}

export function getTenureExpiryCaseLabel(item: MembershipTypeListItem) {
  if (item.tenureText === "Monthly") {
    return "Requires monthly renewal";
  }

  if (item.tenureText === "Annual") {
    if (item.annualExpiryMonth && item.annualExpiryDay) {
      const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLabel = monthLabels[item.annualExpiryMonth - 1];

      if (monthLabel) {
        return `Renewal due on ${String(item.annualExpiryDay).padStart(2, "0")}-${monthLabel}`;
      }
    }

    return "Every Year";
  }

  if (isLifetimeTenure(item.tenureText)) {
    return "No Expiry";
  }

  if (item.tenureText === "Custom" && item.customExpiryDays) {
    return `${item.customExpiryDays} Days`;
  }

  return null;
}

export function renderTenureExpiryCaseLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const renewalPrefix = "Renewal due on ";
  if (label.startsWith(renewalPrefix)) {
    return (
      <>
        {renewalPrefix}
        <span className="font-semibold text-slate-700">{label.slice(renewalPrefix.length)}</span>
      </>
    );
  }

  return label;
}

export function getTenureWindowLabel(item: MembershipTypeListItem) {
  const startDate = item.registrationStartDateUtc ? new Date(item.registrationStartDateUtc) : null;
  const endDate = item.registrationEndDateUtc ? new Date(item.registrationEndDateUtc) : null;
  const now = Date.now();
  const startVisible = Boolean(startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() > now);
  const endVisible = Boolean(endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() > now);

  const startLabel = startVisible ? formatUtcDateLabel(item.registrationStartDateUtc) : null;
  const endLabel = endVisible ? formatUtcDateLabel(item.registrationEndDateUtc) : null;

  if (startLabel && endLabel) {
    return `From ${startLabel} to ${endLabel}`;
  }

  if (startLabel) {
    return `From ${startLabel}`;
  }

  if (endLabel) {
    return `Available Till ${endLabel}`;
  }

  return null;
}

export function InlineSeparator() {
  return <span className="text-slate-300">|</span>;
}

export function canShowStatusMenu(setupState: string) {
  return setupState === "ReadyForReview" || setupState === "Published";
}

export function canShowMemberMenu(setupState: string) {
  return setupState === "Published";
}

export function canCopyRegistrationLink(item: MembershipTypeListItem) {
  if (item.setupState !== "Published" || !item.availableForSignUp) {
    return false;
  }

  const startDate = item.registrationStartDateUtc ? new Date(item.registrationStartDateUtc) : null;
  const endDate = item.registrationEndDateUtc ? new Date(item.registrationEndDateUtc) : null;
  const now = Date.now();

  if (startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() > now) {
    return false;
  }

  if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() <= now) {
    return false;
  }

  return true;
}
