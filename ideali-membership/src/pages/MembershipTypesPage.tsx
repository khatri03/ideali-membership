import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, BadgeInfo, Check, ChevronRight, GripVertical, Info, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../routes";
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

function OrderListSkeletonRow() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="block h-3 w-20 rounded-full bg-slate-200/80 animate-pulse" />
      <span className="mt-2 block h-4 w-40 max-w-full rounded-full bg-slate-200/80 animate-pulse" />
    </div>
  );
}

function moveMembershipTypeOrder(
  items: MembershipTypeOrderListItem[],
  sourceUniqueId: string,
  targetUniqueId: string,
) {
  if (sourceUniqueId === targetUniqueId) {
    return items;
  }

  const sourceIndex = items.findIndex((item) => item.uniqueId === sourceUniqueId);
  const targetIndex = items.findIndex((item) => item.uniqueId === targetUniqueId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return items;
  }

  const nextItems = [...items];
  const [removedItem] = nextItems.splice(sourceIndex, 1);
  if (!removedItem) {
    return items;
  }

  const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  nextItems.splice(insertionIndex, 0, removedItem);
  return nextItems;
}

function formatCurrencyAmount(value: number, currencyCode: string | null) {
  if (!value) {
    return "Free";
  }

  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const symbolMap: Record<string, string> = {
    USD: "$",
    CAD: "C$",
  };

  const normalizedCurrencyCode = currencyCode?.toUpperCase() ?? "";
  const currencySymbol = symbolMap[normalizedCurrencyCode] ?? (normalizedCurrencyCode ? `${normalizedCurrencyCode} ` : "");

  return `${currencySymbol}${amount}`;
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

function SetupStateBadge({ value }: { value: string }) {
  const normalizedValue = value || "Draft";

  if (normalizedValue === "Published") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckBadgeIcon />
        Online
      </span>
    );
  }

  if (normalizedValue === "ReadyForReview" || normalizedValue === "Ready For Review") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        {formatSetupStateLabel(normalizedValue)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      {formatSetupStateLabel(normalizedValue)}
    </span>
  );
}

function getTenureLabel(value: string | null) {
  return value || "—";
}

function getTenureDetailLabel(item: MembershipTypeListItem) {
  if (item.tenureText === "Annual" && item.annualExpiryMonth && item.annualExpiryDay) {
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthLabel = monthLabels[item.annualExpiryMonth - 1];

    if (!monthLabel) {
      return null;
    }

    return `Renewal due on ${String(item.annualExpiryDay).padStart(2, "0")}-${monthLabel}`;
  }

  if (item.tenureText === "Custom" && item.customExpiryDays) {
    return `${item.customExpiryDays} Days`;
  }

  if (item.tenureText !== "Custom" && item.tenureText !== "Annual") {
    return null;
  }

  return null;
}

function InlineSeparator() {
  return <span className="text-slate-300">|</span>;
}

function canShowStatusMenu(setupState: string) {
  return setupState === "ReadyForReview" || setupState === "Published";
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
  const [draggedUniqueId, setDraggedUniqueId] = useState<string | null>(null);
  const [dragOverUniqueId, setDragOverUniqueId] = useState<string | null>(null);

  function handleDragStart(uniqueId: string) {
    setDraggedUniqueId(uniqueId);
  }

  function handleDragEnd() {
    setDraggedUniqueId(null);
    setDragOverUniqueId(null);
  }

  function handleDrop(targetUniqueId: string) {
    if (!draggedUniqueId || draggedUniqueId === targetUniqueId) {
      handleDragEnd();
      return;
    }

    onMoveItem(draggedUniqueId, targetUniqueId);
    handleDragEnd();
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

          <div className="space-y-3 p-4">
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
              items.map((item) => (
                <div
                  key={item.uniqueId}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.uniqueId);
                    handleDragStart(item.uniqueId);
                  }}
                  onDragEnd={handleDragEnd}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverUniqueId(item.uniqueId);
                  }}
                  onDrop={() => handleDrop(item.uniqueId)}
                  className={[
                    "flex cursor-grab items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-3 shadow-sm transition active:cursor-grabbing",
                    draggedUniqueId === item.uniqueId ? "border-cyan-300 bg-cyan-50/60 opacity-80" : "border-slate-200",
                    dragOverUniqueId === item.uniqueId ? "ring-2 ring-cyan-200" : "",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400"
                    aria-hidden="true"
                    title="Drag to sort"
                  >
                    <GripVertical className="h-5 w-5" />
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                No membership types found.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const confirmModalRef = useRef<HTMLDivElement>(null);
  const statusCloseTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = buttonRef.current?.contains(target) ?? false;
      const clickedMenu = menuRef.current?.contains(target) ?? false;
      const clickedStatus = statusRef.current?.contains(target) ?? false;
      const clickedStatusMenu = statusMenuRef.current?.contains(target) ?? false;
      const clickedConfirmModal = confirmModalRef.current?.contains(target) ?? false;

      if (!clickedButton && !clickedMenu && !clickedStatus && !clickedStatusMenu && !clickedConfirmModal) {
        setIsOpen(false);
        setIsStatusOpen(false);
        setPendingStatus(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsStatusOpen(false);
        setPendingStatus(null);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      clearStatusCloseTimer();
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleEdit() {
    setIsNavigating(true);

    try {
      const completedStepNo = await getMembershipWizardProgress(item.value);
      const nextStepNo = Math.min(
        Math.max(completedStepNo + 1, 1),
        MEMBERSHIP_WIZARD_STEPS.length,
      );
      const step = MEMBERSHIP_WIZARD_STEPS[nextStepNo - 1] ?? MEMBERSHIP_WIZARD_STEPS[0]!;

      navigate(buildMembershipWizardStepPath(step.to, item.value, nextStepNo));
      setIsOpen(false);
      setIsStatusOpen(false);
      setPendingStatus(null);
    } finally {
      setIsNavigating(false);
    }
  }

  function openMenu() {
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    if (!buttonRect) {
      setIsOpen(true);
      return;
    }

    const menuHeight = canShowStatusMenu(item.setupState) ? 176 : 128;
    const menuWidth = 176;
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
    setPendingStatus(null);
    clearStatusCloseTimer();
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

  async function handleStatusChange(availableForSignUp: boolean) {
    setIsNavigating(true);

    try {
      await saveMembershipReviewStep({ availableForSignUp }, 11, item.value);
      await onRefresh();
      setIsOpen(false);
      setIsStatusOpen(false);
    } finally {
      setIsNavigating(false);
    }
  }

  function requestStatusChange(availableForSignUp: boolean) {
    setPendingStatus(availableForSignUp);
    setIsStatusOpen(false);
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
                className="fixed z-[1000] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleEdit()}
                  disabled={isNavigating}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <EditIcon />
                  {isNavigating ? "Opening..." : "Edit"}
                </button>

                {canShowStatusMenu(item.setupState) ? (
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
                ) : null}
              </div>

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
  const price = formatCurrencyAmount(item.membershipCharges, item.paymentCurrencyCode);

  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="w-16 border-r border-slate-200 px-4 py-4 align-middle">
        <MembershipTypeActionsMenu item={item} onRefresh={onRefresh} />
      </td>
      <td className="border-r border-slate-200 px-4 py-4 align-middle">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.text}</p>
          <InlineSeparator />
          <SetupStateBadge value={item.setupState} />
        </div>
      </td>
      <td className="border-r border-slate-200 px-4 py-4 text-right align-middle">
        <p className="text-sm font-semibold tabular-nums text-slate-900">{price}</p>
      </td>
      <td className="border-r border-slate-200 px-4 py-4 align-middle">
        <AvailabilityBadge value={item.availableForSignUp} />
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-600">{getTenureLabel(item.tenureText)}</p>
          {getTenureDetailLabel(item) ? (
            <>
              <InlineSeparator />
              <p className="text-xs font-medium text-slate-400">{getTenureDetailLabel(item)}</p>
            </>
          ) : null}
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
    setOrderItems((currentItems) => moveMembershipTypeOrder(currentItems, sourceUniqueId, targetUniqueId));
  }

  async function saveOrder() {
    if (orderItems.length === 0) {
      return;
    }

    setIsSavingOrder(true);

    try {
      await saveMembershipTypeOrderList(orderItems.map((item) => item.uniqueId));
      await loadTypes();
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
