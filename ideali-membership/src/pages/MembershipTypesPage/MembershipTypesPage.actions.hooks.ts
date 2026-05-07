import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { buildMembershipRegisterPath } from "../../routes";
import { saveMembershipReviewStep } from "../../lib/membershipWizard";
import type { MembershipTypeListItem } from "../../types/membership";
import { canShowMemberMenu, canShowStatusMenu, showToast } from "./MembershipTypesPage.utils";

export type MembershipTypeActionsMenuState = {
  isOpen: boolean;
  isStatusOpen: boolean;
  isMemberOpen: boolean;
  isNavigating: boolean;
  pendingStatus: boolean | null;
  menuPosition: { top: number; left: number } | null;
  statusMenuPosition: { top: number; left: number } | null;
  memberMenuPosition: { top: number; left: number } | null;
  buttonRef: RefObject<HTMLButtonElement>;
  menuRef: RefObject<HTMLDivElement>;
  statusRef: RefObject<HTMLDivElement>;
  statusMenuRef: RefObject<HTMLDivElement>;
  memberRef: RefObject<HTMLDivElement>;
  memberMenuRef: RefObject<HTMLDivElement>;
  confirmModalRef: RefObject<HTMLDivElement>;
  openMenu: () => void;
  toggleMenu: () => void;
  scheduleStatusClose: () => void;
  scheduleMemberClose: () => void;
  clearStatusCloseTimer: () => void;
  clearMemberCloseTimer: () => void;
  openStatusMenu: (targetElement: HTMLDivElement | null) => void;
  openMemberMenu: (targetElement: HTMLDivElement | null) => void;
  handleCopyRegistrationLink: () => Promise<void>;
  requestStatusChange: (availableForSignUp: boolean) => void;
  confirmStatusChange: () => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setIsStatusOpen: Dispatch<SetStateAction<boolean>>;
  setIsMemberOpen: Dispatch<SetStateAction<boolean>>;
  setPendingStatus: Dispatch<SetStateAction<boolean | null>>;
};

export function useMembershipTypeActionsMenu(
  item: MembershipTypeListItem,
  onRefresh: () => Promise<void>,
): MembershipTypeActionsMenuState {
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

  const clearStatusCloseTimer = useCallback(() => {
    if (statusCloseTimerRef.current !== null) {
      window.clearTimeout(statusCloseTimerRef.current);
      statusCloseTimerRef.current = null;
    }
  }, []);

  const scheduleStatusClose = useCallback(() => {
    clearStatusCloseTimer();
    statusCloseTimerRef.current = window.setTimeout(() => {
      setIsStatusOpen(false);
    }, 180);
  }, [clearStatusCloseTimer]);

  const clearMemberCloseTimer = useCallback(() => {
    if (memberCloseTimerRef.current !== null) {
      window.clearTimeout(memberCloseTimerRef.current);
      memberCloseTimerRef.current = null;
    }
  }, []);

  const scheduleMemberClose = useCallback(() => {
    clearMemberCloseTimer();
    memberCloseTimerRef.current = window.setTimeout(() => {
      setIsMemberOpen(false);
    }, 180);
  }, [clearMemberCloseTimer]);

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
  }, [clearMemberCloseTimer, clearStatusCloseTimer]);

  const openMenu = useCallback(() => {
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    if (!buttonRect) {
      setIsOpen(true);
      return;
    }

    const menuHeight =
      canShowMemberMenu(item.setupState) && canShowStatusMenu(item.setupState)
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
  }, [clearMemberCloseTimer, clearStatusCloseTimer, item.setupState]);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    openMenu();
  }, [isOpen, openMenu]);

  const openStatusMenu = useCallback(
    (targetElement: HTMLDivElement | null) => {
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
    },
    [clearStatusCloseTimer],
  );

  const openMemberMenu = useCallback(
    (targetElement: HTMLDivElement | null) => {
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
    },
    [clearMemberCloseTimer],
  );

  const handleCopyRegistrationLink = useCallback(async () => {
    const registrationUrl = `${window.location.origin}${buildMembershipRegisterPath(item.value)}`;

    try {
      await navigator.clipboard.writeText(registrationUrl);
      showToast("Registration link copied to clipboard.");
      setIsOpen(false);
      setIsMemberOpen(false);
    } catch {
      showToast("Unable to copy the registration link.");
    }
  }, [item.value]);

  const handleStatusChange = useCallback(
    async (availableForSignUp: boolean) => {
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
    },
    [item.value, onRefresh],
  );

  const requestStatusChange = useCallback((availableForSignUp: boolean) => {
    setPendingStatus(availableForSignUp);
    setIsStatusOpen(false);
    setIsMemberOpen(false);
    setIsOpen(false);
  }, []);

  const confirmStatusChange = useCallback(() => {
    if (pendingStatus === null) {
      return;
    }

    void handleStatusChange(pendingStatus);
  }, [handleStatusChange, pendingStatus]);

  return {
    isOpen,
    isStatusOpen,
    isMemberOpen,
    isNavigating,
    pendingStatus,
    menuPosition,
    statusMenuPosition,
    memberMenuPosition,
    buttonRef,
    menuRef,
    statusRef,
    statusMenuRef,
    memberRef,
    memberMenuRef,
    confirmModalRef,
    openMenu,
    toggleMenu,
    scheduleStatusClose,
    scheduleMemberClose,
    clearStatusCloseTimer,
    clearMemberCloseTimer,
    openStatusMenu,
    openMemberMenu,
    handleCopyRegistrationLink,
    requestStatusChange,
    confirmStatusChange,
    setIsOpen,
    setIsStatusOpen,
    setIsMemberOpen,
    setPendingStatus,
  };
}
