import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../routes";
import { getMembershipWizardProgress, getMembershipTypes } from "../lib/membershipWizard";
import { MEMBERSHIP_WIZARD_STEPS } from "../components/wizard/membershipWizardSteps";
import type { MembershipTypeListItem } from "../types/membership";

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

function MembershipTypeActionsMenu({
  item,
}: {
  item: MembershipTypeListItem;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = buttonRef.current?.contains(target) ?? false;
      const clickedMenu = menuRef.current?.contains(target) ?? false;

      if (!clickedButton && !clickedMenu) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
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

    const menuHeight = 128;
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MembershipTypeRow({
  item,
}: {
  item: MembershipTypeListItem;
}) {
  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="w-16 px-4 py-4 align-middle">
        <MembershipTypeActionsMenu item={item} />
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.text}</p>
          {item.hasDiscountCoupons ? (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Coupons
            </span>
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

  useEffect(() => {
    let isMounted = true;

    async function loadTypes() {
      try {
        const items = await getMembershipTypes();
        if (!isMounted) {
          return;
        }

        setTypes(items);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load membership types.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTypes();

    return () => {
      isMounted = false;
    };
  }, []);

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {types.map((item) => (
                    <MembershipTypeRow key={item.value} item={item} />
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
    </section>
  );
}
