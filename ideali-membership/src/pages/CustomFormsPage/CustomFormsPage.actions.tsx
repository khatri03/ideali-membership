import { createPortal } from "react-dom";
import { useCustomFormActionsMenu } from "./CustomFormsPage.actions.hooks";

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M13.586 3a2 2 0 0 1 2.828 0l.586.586a2 2 0 0 1 0 2.828l-8.95 8.95a2 2 0 0 1-.878.514l-3.18.795a1 1 0 0 1-1.212-1.212l.795-3.18a2 2 0 0 1 .515-.878zM12 4.586 4.332 12.254l-.456 1.823 1.823-.456L13.414 5.586z" />
    </svg>
  );
}

export function CustomFormActionsMenu({
  itemName,
  onEdit,
}: {
  itemName: string;
  onEdit: () => void;
}) {
  const menu = useCustomFormActionsMenu(onEdit);

  return (
    <div className="relative inline-flex">
      <button
        ref={menu.buttonRef}
        type="button"
        onClick={menu.openMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        aria-haspopup="menu"
        aria-expanded={menu.isOpen}
        aria-label={`Open actions for ${itemName}`}
        title="Actions"
      >
        <DotsIcon />
      </button>

      {menu.isOpen && menu.menuPosition
        ? createPortal(
            <div
              ref={menu.menuRef}
              className="fixed z-[1200] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10"
              style={{ top: `${menu.menuPosition.top}px`, left: `${menu.menuPosition.left}px` }}
            >
              <button
                type="button"
                onClick={menu.handleEdit}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <EditIcon />
                Edit
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
