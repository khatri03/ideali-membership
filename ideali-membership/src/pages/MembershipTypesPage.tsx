import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../routes";
import { getMembershipTypes } from "../lib/membershipWizard";
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

function MembershipTypeActionsMenu({ item }: { item: MembershipTypeListItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open actions for ${item.text}`}
      >
        <DotsIcon />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
          <Link
            to={buildMembershipWizardStepPath(APP_ROUTES.membershipWizardResume, item.value)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <EditIcon />
            Edit
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function MembershipTypeRow({ item }: { item: MembershipTypeListItem }) {
  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="w-16 px-4 py-4 align-middle">
        <MembershipTypeActionsMenu item={item} />
      </td>
      <td className="px-4 py-4 align-middle">
        <p className="text-sm font-semibold text-slate-900">{item.text}</p>
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
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
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
