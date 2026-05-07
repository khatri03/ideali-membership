import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Link2, UserPlus, Users } from "lucide-react";
import { APP_ROUTES, buildMembershipRegisterPath, buildMembershipWizardStepPath } from "../../../../app/routes";
import type { MembershipTypeListItem } from "../../../../types/membership";
import {
  ChevronRightIcon,
  DotsIcon,
  EditIcon,
  MenuCheckIcon,
  StatusIcon,
} from "./MembershipTypesPage.display";
import {
  canCopyRegistrationLink,
  canShowMemberMenu,
  canShowStatusMenu,
} from "./MembershipTypesPage.utils";
import { StatusChangeConfirmModal } from "./MembershipTypesPage.modals";
import { useMembershipTypeActionsMenu } from "./MembershipTypesPage.actions.hooks";

export function MembershipTypeActionsMenu({
  item,
  onRefresh,
}: {
  item: MembershipTypeListItem;
  onRefresh: () => Promise<void>;
}) {
  const menu = useMembershipTypeActionsMenu(item, onRefresh);

  return (
    <div ref={menu.menuRef} className="relative inline-flex">
      <button
        ref={menu.buttonRef}
        type="button"
        onClick={menu.toggleMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-haspopup="menu"
        aria-expanded={menu.isOpen}
        aria-label={`Open actions for ${item.text}`}
      >
        <DotsIcon />
      </button>

      {menu.isOpen && menu.menuPosition
        ? createPortal(
            <>
              <div
                ref={menu.menuRef}
                className="fixed z-[1000] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                style={{
                  top: `${menu.menuPosition.top}px`,
                  left: `${menu.menuPosition.left}px`,
                }}
              >
                <Link
                  to={buildMembershipWizardStepPath(APP_ROUTES.membershipWizardResume, item.value)}
                  onClick={() => {
                    menu.setIsOpen(false);
                    menu.setIsStatusOpen(false);
                    menu.setIsMemberOpen(false);
                    menu.setPendingStatus(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-normal text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <EditIcon />
                  Edit
                </Link>

                {canShowMemberMenu(item.setupState) ? (
                  <div
                    ref={menu.memberRef}
                    className="relative"
                    onMouseEnter={() => {
                      menu.clearMemberCloseTimer();
                      menu.openMemberMenu(menu.memberRef.current);
                    }}
                    onMouseLeave={menu.scheduleMemberClose}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-haspopup="menu"
                      aria-expanded={menu.isMemberOpen}
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
                      ref={menu.statusRef}
                      className="relative"
                      onMouseEnter={() => {
                        menu.clearStatusCloseTimer();
                        menu.openStatusMenu(menu.statusRef.current);
                      }}
                      onMouseLeave={menu.scheduleStatusClose}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-haspopup="menu"
                        aria-expanded={menu.isStatusOpen}
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

              {menu.isMemberOpen && menu.memberMenuPosition ? (
                <div
                  ref={menu.memberMenuRef}
                  className="fixed z-[1001] w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                  style={{
                    top: `${menu.memberMenuPosition.top}px`,
                    left: `${menu.memberMenuPosition.left}px`,
                  }}
                  onMouseEnter={menu.clearMemberCloseTimer}
                  onMouseLeave={menu.scheduleMemberClose}
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
                    onClick={() => void menu.handleCopyRegistrationLink()}
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
                        menu.setIsOpen(false);
                        menu.setIsMemberOpen(false);
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

              {menu.isStatusOpen && menu.statusMenuPosition ? (
                <div
                  ref={menu.statusMenuRef}
                  className="fixed z-[1001] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                  style={{
                    top: `${menu.statusMenuPosition.top}px`,
                    left: `${menu.statusMenuPosition.left}px`,
                  }}
                  onMouseEnter={menu.clearStatusCloseTimer}
                  onMouseLeave={menu.scheduleStatusClose}
                >
                  <button
                    type="button"
                    onClick={() => menu.requestStatusChange(true)}
                    disabled={menu.isNavigating}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className={item.availableForSignUp ? "text-emerald-600" : "invisible"}>
                      <MenuCheckIcon />
                    </span>
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => menu.requestStatusChange(false)}
                    disabled={menu.isNavigating}
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

      {menu.pendingStatus !== null ? (
        <StatusChangeConfirmModal
          membershipTypeName={item.text}
          targetStatusLabel={menu.pendingStatus ? "Online" : "Offline"}
          onCancel={() => menu.setPendingStatus(null)}
          onConfirm={menu.confirmStatusChange}
          modalRef={menu.confirmModalRef}
        />
      ) : null}
    </div>
  );
}


