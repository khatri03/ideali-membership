import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Link2, UserPlus, Users } from "lucide-react";
import { APP_ROUTES, buildMembershipRegisterPath, buildMembershipWizardStepPath } from "../routes";
import { saveMembershipReviewStep } from "../lib/membershipWizard";
import type { MembershipTypeListItem } from "../types/membership";
import {
  ChevronRightIcon,
  DotsIcon,
  EditIcon,
  MenuCheckIcon,
  StatusIcon,
  canCopyRegistrationLink,
  canShowMemberMenu,
  canShowStatusMenu,
  showToast,
} from "./MembershipTypesPage.utils";
import { StatusChangeConfirmModal } from "./MembershipTypesPage.modals";

export function MembershipTypeActionsMenu({
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
