import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { fetchCustomForms } from "../lib/customForms";
import type { CustomFormSummary } from "../types/customForms";
import { APP_ROUTES, buildCustomFormEditPath } from "../routes";

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

function CustomFormActionsMenu({
  item,
  onEdit,
}: {
  item: CustomFormSummary;
  onEdit: (uniqueId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      setIsOpen((current) => !current);
      return;
    }

    const gap = 8;
    const menuWidth = 220;
    const menuHeight = 72;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + gap && spaceAbove > menuHeight + gap;

    setMenuPosition({
      top: openUpward ? Math.max(gap, rect.top - menuHeight - gap) : rect.bottom + gap,
      left: Math.max(gap, Math.min(rect.left, window.innerWidth - menuWidth - gap)),
    });
    setIsOpen(true);
  }

  function handleEdit() {
    setIsOpen(false);
    onEdit(item.uniqueId);
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={openMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open actions for ${item.name}`}
        title="Actions"
      >
        <DotsIcon />
      </button>

      {isOpen && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[1200] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <button
                type="button"
                onClick={handleEdit}
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

export function CustomFormsPage() {
  const navigate = useNavigate();
  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ["custom-forms"],
    queryFn: fetchCustomForms,
  });

  const formCountLabel = useMemo(() => {
    if (forms.length === 0) {
      return "No forms yet";
    }

    return `${forms.length} custom form${forms.length === 1 ? "" : "s"}`;
  }, [forms.length]);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Custom Forms
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Manage reusable form templates
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Keep organizer forms organized, reusable, and ready to open in the custom form designer.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">{formCountLabel}</p>
          </div>

          <Link
            to={APP_ROUTES.customFormsCreate}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Open designer
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        {isLoading ? (
          <div className="grid gap-4">
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
            {error.message || "Unable to load custom forms."}
          </div>
        ) : forms.length > 0 ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th scope="col" className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Actions
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Header text
                    </th>
                    <th scope="col" className="w-36 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Mapped fields
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {forms.map((form) => (
                    <tr key={form.uniqueId} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-4 py-4 align-top">
                        <CustomFormActionsMenu item={form} onEdit={(uniqueId) => navigate(buildCustomFormEditPath(uniqueId))} />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-900">{form.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">
                        {form.headerText}
                      </td>
                      <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">
                        {form.totalFields}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-slate-900">No custom forms yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Create a reusable custom form and it will appear here for editing later.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
