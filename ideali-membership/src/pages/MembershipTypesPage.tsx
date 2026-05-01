import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, BadgeInfo, Check, ChevronRight, GripVertical, Info, Link2, UserPlus, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors, type Modifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { APP_ROUTES, buildMembershipRegisterPath, buildMembershipWizardStepPath } from "../routes";
import { getMembershipTypeOrderList, getMembershipWizardProgress, getMembershipTypes, saveMembershipReviewStep, saveMembershipTypeOrderList } from "../lib/membershipWizard";
import { MEMBERSHIP_WIZARD_STEPS } from "../components/wizard/membershipWizardSteps";
import type { MembershipTypeListItem, MembershipTypeOrderListItem } from "../types/membership";

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M13.586 3a2 2 0 0 1 2.828 0l.586.586a2 2 0 0 1 0 2.828l-8.95 8.95a2 2 0 0 1-.878.514l-3.18.795a1 1 0 0 1-1.212-1.212l.795-3.18a2 2 0 0 1 .515-.878zM12 4.586 4.332 12.254l-.456 1.823 1.823-.456L13.414 5.586z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="m7.25 4.5 5.75 5.5-5.75 5.5a1 1 0 1 0 1.4 1.42l6.5-6.22a1 1 0 0 0 0-1.4l-6.5-6.22A1 1 0 1 0 7.25 4.5Z" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <Check className="h-4 w-4" />
  );
}

function MenuCheckIcon() {
  return (
    <Check className="h-4 w-4" />
  );
}

function StatusIcon() {
  return (
    <BadgeInfo className="h-4 w-4" />
  );
}

function XBadgeIcon() {
  return (
    <X className="h-4 w-4" />
  );
}

function InfoIcon() {
  return (
    <Info className="h-5 w-5" />
  );
}

function showToast(message: string) {
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

const constrainOrderDragToParent: Modifier = ({
  activeNodeRect,
  containerNodeRect,
  transform,
}) => {
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

function OrderListSkeletonRow() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="block h-3 w-20 rounded-full bg-slate-200/80 animate-pulse" />
      <span className="mt-2 block h-4 w-40 max-w-full rounded-full bg-slate-200/80 animate-pulse" />
    </div>
  );
}

function SortableOrderItem({ item }: { item: MembershipTypeOrderListItem }) {
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

function formatCurrencyAmount(value: number, currencyCode: string | null, currencySymbol: string | null) {
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

function AvailabilityBadge({ value }: { value: boolean }) {
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

function formatSetupStateLabel(value: string) {
  if (!value) {
    return "Draft";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "Ready To Go Live";
  }

  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function MembershipMetaPill({
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

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses}`}>
      {value}
    </span>
  );
}

function getSetupStatePillValue(value: string) {
  if (value === "Published") {
    return "Live";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "Ready For Review";
  }

  return formatSetupStateLabel(value);
}

function getSetupStatePillTone(value: string): "neutral" | "success" | "warning" {
  if (value === "Published") {
    return "success";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "warning";
  }

  return "neutral";
}

function getTenureLabel(value: string | null) {
  return value || "—";
}

function isLifetimeTenure(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "lifetime" || normalized === "life time";
}

function formatUtcDateLabel(value: string | null) {
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

function getTenureDisplayLabel(item: MembershipTypeListItem) {
  const tenureLabel = getTenureLabel(item.tenureText);

  return tenureLabel;
}

function getTenureExpiryCaseLabel(item: MembershipTypeListItem) {
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

function renderTenureExpiryCaseLabel(label: string | null) {
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

function getTenureWindowLabel(item: MembershipTypeListItem) {
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

function InlineSeparator() {
  return <span className="text-slate-300">|</span>;
}

function canShowStatusMenu(setupState: string) {
  return setupState === "ReadyForReview" || setupState === "Published";
}

function canShowMemberMenu(setupState: string) {
  return setupState === "Published";
}

function canCopyRegistrationLink(item: MembershipTypeListItem) {
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

function OrderConfirmModal({
  onCancel,
  modalRef,
  isLoading,
  items,
  error,
  isSaving,
  onMoveItem,
  onSave,
}: {
  onCancel: () => void;
  modalRef: { current: HTMLDivElement | null };
  isLoading: boolean;
  items: MembershipTypeOrderListItem[];
  error: string;
  isSaving: boolean;
  onMoveItem: (sourceUniqueId: string, targetUniqueId: string) => void;
  onSave: () => Promise<void>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    onMoveItem(String(active.id), String(over.id));
  }

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm" onClick={onCancel}>
      <div
        ref={modalRef}
        className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Change order</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Review the current sort order and drag items into place when the ordering action is connected.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-slate-100/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Membership Title
          </div>

          <div className={["space-y-3 p-4", isSaving ? "pointer-events-none opacity-60" : ""].join(" ")}>
            {isLoading ? (
              <>
                <OrderListSkeletonRow />
                <OrderListSkeletonRow />
                <OrderListSkeletonRow />
              </>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : items.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[constrainOrderDragToParent]}
                  onDragEnd={handleDragEnd}
              >
                <SortableContext items={items.map((item) => item.uniqueId)} strategy={verticalListSortingStrategy}>
                  {items.map((item) => (
                    <SortableOrderItem key={item.uniqueId} item={item} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                No membership types found.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isSaving || isLoading || items.length === 0 || !!error}
            className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function StatusChangeConfirmModal({
  membershipTypeName,
  targetStatusLabel,
  onCancel,
  onConfirm,
  modalRef,
}: {
  membershipTypeName: string;
  targetStatusLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  modalRef: { current: HTMLDivElement | null };
}) {
  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <InfoIcon />
        </div>

        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Confirm status change</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Membership type <span className="font-semibold text-slate-900">{membershipTypeName}</span> will be marked as{" "}
          <span className="font-semibold text-slate-900">{targetStatusLabel}</span>.
          Please confirm if you want to continue.
        </p>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MembershipTypeActionsMenu({
  item,
  onRefresh,
}: {
  item: MembershipTypeListItem;
  onRefresh: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isMemberOpen, setIsMemberOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [memberMenuPosition, setMemberMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const memberRef = useRef<HTMLDivElement>(null);
  const memberMenuRef = useRef<HTMLDivElement>(null);
  const confirmModalRef = useRef<HTMLDivElement>(null);
  const statusCloseTimerRef = useRef<number | null>(null);
  const memberCloseTimerRef = useRef<number | null>(null);

  function clearStatusCloseTimer() {
    if (statusCloseTimerRef.current !== null) {
      window.clearTimeout(statusCloseTimerRef.current);
      statusCloseTimerRef.current = null;
    }
  }

  function scheduleStatusClose() {
    clearStatusCloseTimer();
    statusCloseTimerRef.current = window.setTimeout(() => {
      setIsStatusOpen(false);
    }, 180);
  }

  function clearMemberCloseTimer() {
    if (memberCloseTimerRef.current !== null) {
      window.clearTimeout(memberCloseTimerRef.current);
      memberCloseTimerRef.current = null;
    }
  }

  function scheduleMemberClose() {
    clearMemberCloseTimer();
    memberCloseTimerRef.current = window.setTimeout(() => {
      setIsMemberOpen(false);
    }, 180);
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = buttonRef.current?.contains(target) ?? false;
      const clickedMenu = menuRef.current?.contains(target) ?? false;
      const clickedStatus = statusRef.current?.contains(target) ?? false;
      const clickedStatusMenu = statusMenuRef.current?.contains(target) ?? false;
      const clickedMember = memberRef.current?.contains(target) ?? false;
      const clickedMemberMenu = memberMenuRef.current?.contains(target) ?? false;
      const clickedConfirmModal = confirmModalRef.current?.contains(target) ?? false;

      if (
        !clickedButton &&
        !clickedMenu &&
        !clickedStatus &&
        !clickedStatusMenu &&
        !clickedMember &&
        !clickedMemberMenu &&
        !clickedConfirmModal
      ) {
        setIsOpen(false);
        setIsStatusOpen(false);
        setIsMemberOpen(false);
        setPendingStatus(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsStatusOpen(false);
        setIsMemberOpen(false);
        setPendingStatus(null);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      clearStatusCloseTimer();
      clearMemberCloseTimer();
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openMenu() {
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    if (!buttonRect) {
      setIsOpen(true);
      return;
    }

    const menuHeight = canShowMemberMenu(item.setupState) && canShowStatusMenu(item.setupState)
      ? 224
      : canShowMemberMenu(item.setupState) || canShowStatusMenu(item.setupState)
        ? 176
        : 128;
    const menuWidth = 224;
    const gap = 8;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const openUpward = spaceBelow < menuHeight + gap && spaceAbove > menuHeight + gap;

    setMenuPosition({
      top: openUpward ? Math.max(gap, buttonRect.top - menuHeight - gap) : buttonRect.bottom + gap,
      left: Math.max(gap, Math.min(buttonRect.left, window.innerWidth - menuWidth - gap)),
    });
    setIsOpen(true);
    setIsStatusOpen(false);
    setIsMemberOpen(false);
    setPendingStatus(null);
    clearStatusCloseTimer();
    clearMemberCloseTimer();
  }

  function openStatusMenu(targetElement: HTMLDivElement | null) {
    if (!targetElement) {
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const submenuWidth = 180;
    const submenuHeight = 96;
    const gap = 8;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    const openLeft = spaceRight < submenuWidth + gap && spaceLeft > submenuWidth + gap;

    setStatusMenuPosition({
      top: Math.max(gap, Math.min(rect.top, window.innerHeight - submenuHeight - gap)),
      left: openLeft ? rect.left - submenuWidth - gap : rect.right + gap,
    });
    setIsStatusOpen(true);
    clearStatusCloseTimer();
  }

  function openMemberMenu(targetElement: HTMLDivElement | null) {
    if (!targetElement) {
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const submenuWidth = 240;
    const submenuHeight = 144;
    const gap = 8;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    const openLeft = spaceRight < submenuWidth + gap && spaceLeft > submenuWidth + gap;

    setMemberMenuPosition({
      top: Math.max(gap, Math.min(rect.top, window.innerHeight - submenuHeight - gap)),
      left: openLeft ? rect.left - submenuWidth - gap : rect.right + gap,
    });
    setIsMemberOpen(true);
    clearMemberCloseTimer();
  }

  async function handleCopyRegistrationLink() {
    const registrationUrl = `${window.location.origin}${buildMembershipRegisterPath(item.value)}`;

    try {
      await navigator.clipboard.writeText(registrationUrl);
      showToast("Registration link copied to clipboard.");
      setIsOpen(false);
      setIsMemberOpen(false);
    } catch {
      showToast("Unable to copy the registration link.");
    }
  }

  async function handleStatusChange(availableForSignUp: boolean) {
    setIsNavigating(true);

    try {
      await saveMembershipReviewStep({ availableForSignUp }, 11, item.value);
      await onRefresh();
      setIsOpen(false);
      setIsStatusOpen(false);
      setIsMemberOpen(false);
    } finally {
      setIsNavigating(false);
    }
  }

  function requestStatusChange(availableForSignUp: boolean) {
    setPendingStatus(availableForSignUp);
    setIsStatusOpen(false);
    setIsMemberOpen(false);
    setIsOpen(false);
  }

  function confirmStatusChange() {
    if (pendingStatus === null) {
      return;
    }

    void handleStatusChange(pendingStatus);
  }

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          openMenu();
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open actions for ${item.text}`}
      >
        <DotsIcon />
      </button>

      {isOpen && menuPosition
        ? createPortal(
            <>
              <div
                ref={menuRef}
                className="fixed z-[1000] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
              >
                <Link
                  to={buildMembershipWizardStepPath(APP_ROUTES.membershipWizardResume, item.value)}
                  onClick={() => {
                    setIsOpen(false);
                    setIsStatusOpen(false);
                    setIsMemberOpen(false);
                    setPendingStatus(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-normal text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <EditIcon />
                  Edit
                </Link>

                {canShowMemberMenu(item.setupState) ? (
                  <div
                    ref={memberRef}
                    className="relative"
                    onMouseEnter={() => {
                      clearMemberCloseTimer();
                      openMemberMenu(memberRef.current);
                    }}
                    onMouseLeave={scheduleMemberClose}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-haspopup="menu"
                      aria-expanded={isMemberOpen}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Member
                      </span>
                      <ChevronRightIcon />
                    </button>
                  </div>
                ) : null}

                {canShowStatusMenu(item.setupState) ? (
                  <>
                    <div className="my-1 border-t border-slate-200" />
                  <div
                    ref={statusRef}
                    className="relative"
                    onMouseEnter={() => {
                      clearStatusCloseTimer();
                      openStatusMenu(statusRef.current);
                    }}
                    onMouseLeave={scheduleStatusClose}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-haspopup="menu"
                      aria-expanded={isStatusOpen}
                    >
                      <span className="flex items-center gap-2">
                        <StatusIcon />
                        Status
                      </span>
                      <ChevronRightIcon />
                    </button>
                  </div>
                  </>
                ) : null}
              </div>

              {isMemberOpen && memberMenuPosition ? (
                <div
                  ref={memberMenuRef}
                  className="fixed z-[1001] w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                  style={{
                    top: `${memberMenuPosition.top}px`,
                    left: `${memberMenuPosition.left}px`,
                  }}
                  onMouseEnter={clearMemberCloseTimer}
                  onMouseLeave={scheduleMemberClose}
                >
                  <button
                    type="button"
                    disabled
                    className="flex w-full cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition"
                    aria-disabled="true"
                    title="Members list is coming soon."
                  >
                    <Users className="h-4 w-4 text-slate-300" />
                    List
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Disabled
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopyRegistrationLink()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Link2 className="h-4 w-4" />
                    Copy Sign-Up Link
                  </button>

                  <div className="my-1 border-t border-slate-200" />

                  {canCopyRegistrationLink(item) ? (
                    <Link
                      to={buildMembershipRegisterPath(item.value)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        setIsOpen(false);
                        setIsMemberOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex w-full cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition"
                      aria-disabled="true"
                      title="Registration is not open yet."
                    >
                      <UserPlus className="h-4 w-4 text-slate-300" />
                      Add
                    </button>
                  )}
                </div>
              ) : null}

              {isStatusOpen && statusMenuPosition ? (
                <div
                  ref={statusMenuRef}
                  className="fixed z-[1001] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                  style={{
                    top: `${statusMenuPosition.top}px`,
                    left: `${statusMenuPosition.left}px`,
                  }}
                  onMouseEnter={clearStatusCloseTimer}
                  onMouseLeave={scheduleStatusClose}
                >
                  <button
                    type="button"
                    onClick={() => requestStatusChange(true)}
                    disabled={isNavigating}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className={item.availableForSignUp ? "text-emerald-600" : "invisible"}>
                      <MenuCheckIcon />
                    </span>
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => requestStatusChange(false)}
                    disabled={isNavigating}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className={!item.availableForSignUp ? "text-slate-500" : "invisible"}>
                      <MenuCheckIcon />
                    </span>
                    Offline
                  </button>
                </div>
              ) : null}
            </>,
            document.body,
          )
        : null}
      {pendingStatus !== null ? (
        <StatusChangeConfirmModal
          membershipTypeName={item.text}
          targetStatusLabel={pendingStatus ? "Online" : "Offline"}
          onCancel={() => setPendingStatus(null)}
          onConfirm={confirmStatusChange}
          modalRef={confirmModalRef}
        />
      ) : null}
    </div>
  );
}

function MembershipTypeRow({
  item,
  onRefresh,
}: {
  item: MembershipTypeListItem;
  onRefresh: () => Promise<void>;
}) {
  const price = formatCurrencyAmount(item.membershipCharges, item.paymentCurrencyCode, item.paymentCurrencySymbol);
  const tenureWindowLabel = getTenureWindowLabel(item);
  const tenureDisplayLabel = getTenureDisplayLabel(item);
  const tenureExpiryCaseLabel = getTenureExpiryCaseLabel(item);

  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="w-16 border-r border-slate-200 px-4 py-4 align-middle">
        <MembershipTypeActionsMenu item={item} onRefresh={onRefresh} />
      </td>
      <td className="border-r border-slate-200 px-4 py-4 align-middle">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            <MembershipMetaPill
              value={getSetupStatePillValue(item.setupState)}
              tone={getSetupStatePillTone(item.setupState)}
            />
            <MembershipMetaPill value={item.paymentMerchant} />
            <MembershipMetaPill value={item.paymentCurrencyCode?.trim() || item.paymentCurrencySymbol?.trim() || null} />
          </div>
        </div>
      </td>
      <td className="border-r border-slate-200 px-4 py-4 text-right align-middle">
        <p className="text-sm font-semibold tabular-nums text-slate-900">{price}</p>
      </td>
      <td className="border-r border-slate-200 px-4 py-4 align-middle">
        <AvailabilityBadge value={item.availableForSignUp} />
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-slate-700">{tenureDisplayLabel}</p>
          {tenureExpiryCaseLabel ? (
            <p className="text-xs font-medium text-slate-500">{renderTenureExpiryCaseLabel(tenureExpiryCaseLabel)}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {tenureWindowLabel ? <MembershipMetaPill value={tenureWindowLabel} tone="warning" /> : null}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function MembershipTypesPage() {
  const [types, setTypes] = useState<MembershipTypeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderModalLoading, setIsOrderModalLoading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderItems, setOrderItems] = useState<MembershipTypeOrderListItem[]>([]);
  const [orderError, setOrderError] = useState("");
  const orderModalRef = useRef<HTMLDivElement>(null);

  function openOrderModal() {
    setIsOrderModalOpen(true);
  }

  function moveOrderItem(sourceUniqueId: string, targetUniqueId: string) {
    setOrderItems((currentItems) => {
      const sourceIndex = currentItems.findIndex((item) => item.uniqueId === sourceUniqueId);
      const targetIndex = currentItems.findIndex((item) => item.uniqueId === targetUniqueId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return currentItems;
      }

      return arrayMove(currentItems, sourceIndex, targetIndex);
    });
  }

  async function saveOrder() {
    if (orderItems.length === 0) {
      return;
    }

    setIsSavingOrder(true);

    try {
      await saveMembershipTypeOrderList(orderItems.map((item) => item.uniqueId));
      await loadTypes();
      showToast("Membership order saved successfully.");
      setIsOrderModalOpen(false);
    } finally {
      setIsSavingOrder(false);
    }
  }

  async function loadTypes() {
    setIsLoading(true);

    try {
      const items = await getMembershipTypes();
      setTypes(items);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load membership types.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTypes();
  }, []);

  useEffect(() => {
    if (!isOrderModalOpen) {
      return;
    }

    let isMounted = true;

    async function loadOrderItems() {
      setIsOrderModalLoading(true);
      setOrderError("");

      try {
        const items = await getMembershipTypeOrderList();
        if (isMounted) {
          setOrderItems(items);
        }
      } catch (loadOrderError) {
        if (isMounted) {
          setOrderError(loadOrderError instanceof Error ? loadOrderError.message : "Unable to load membership order.");
        }
      } finally {
        if (isMounted) {
          setIsOrderModalLoading(false);
        }
      }
    }

    void loadOrderItems();

    return () => {
      isMounted = false;
    };
  }, [isOrderModalOpen]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Types</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Membership types will be managed here.
          </p>
        </div>

        <Link
          to={APP_ROUTES.membershipWizardTitle}
          className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Create
        </Link>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={openOrderModal}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Change order"
          title="Change order"
        >
          <ArrowUpDown className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            Loading membership types...
          </div>
        ) : error ? (
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : types.length > 0 ? (
          <div className="overflow-visible rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th scope="col" className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Actions
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Membership Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Pricing
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Signup
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Tenure
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {types.map((item) => (
                    <MembershipTypeRow key={item.value} item={item} onRefresh={loadTypes} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            No membership types found.
          </div>
        )}
      </div>
      {isOrderModalOpen ? (
        <OrderConfirmModal
          onCancel={() => setIsOrderModalOpen(false)}
          modalRef={orderModalRef}
          isLoading={isOrderModalLoading}
          items={orderItems}
          error={orderError}
          isSaving={isSavingOrder}
          onMoveItem={moveOrderItem}
          onSave={saveOrder}
        />
      ) : null}
    </section>
  );
}
