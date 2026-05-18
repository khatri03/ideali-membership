import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { buildMembershipInvoiceDetailPath, buildMembershipMemberDetailPath } from "../../../routes";
import { cn } from "../../../lib/utils";
import {
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
  formatMembershipInvoicePaymentMethodLabel,
  getMembershipInvoiceStatusLabel,
  getMembershipInvoiceStatusTone,
} from "../lib/membershipInvoices";
import type { MembershipInvoiceListItem, MembershipInvoiceSortBy } from "../types/invoice";
import { StatusPill } from "../../../pages/MemberDetailPage.parts";

type InvoicesTableProps = {
  invoices: MembershipInvoiceListItem[];
  isLoading?: boolean;
  sortBy?: MembershipInvoiceSortBy;
  sortOrder?: "asc" | "desc" | null;
  onSort: (sortBy: MembershipInvoiceSortBy) => void;
  onClearSort: () => void;
};

type InvoiceTableColumn = {
  label: string;
  key?: MembershipInvoiceSortBy;
  align?: "right";
  sortable?: boolean;
};

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order: "asc" | "desc";
}) {
  if (!active) {
    return <ArrowUpDown size={14} className="text-slate-400" />;
  }

  return order === "asc" ? (
    <ArrowUp size={14} className="text-cyan-700" />
  ) : (
    <ArrowDown size={14} className="text-cyan-700" />
  );
}

function InvoiceDetailMenu({ invoice }: { invoice: MembershipInvoiceListItem }) {
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
      setIsOpen(true);
      return;
    }

    const gap = 8;
    const menuWidth = 192;
    const menuHeight = invoice.memberUniqueId ? 96 : 48;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + gap && spaceAbove > menuHeight + gap;

    setMenuPosition({
      top: openUpward ? Math.max(gap, rect.top - menuHeight - gap) : rect.bottom + gap,
      left: Math.max(gap, Math.min(rect.left, window.innerWidth - menuWidth - gap)),
    });
    setIsOpen(true);
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
        aria-label={`Open detail actions for invoice ${invoice.invoiceNo}`}
        title="Detail"
      >
        <DotsIcon />
      </button>

      {isOpen && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[1200] w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <Link
                to={buildMembershipInvoiceDetailPath(invoice.invoiceId)}
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Detail
              </Link>
              {invoice.memberUniqueId ? (
                <a
                  href={buildMembershipMemberDetailPath(invoice.memberUniqueId)}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Member Profile
                </a>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-200/70">
      <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200/80" />
      </td>
      <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200/80" />
      </td>
      <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200/80" />
          <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200/70" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200/70" />
        </div>
      </td>
      <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200/80" />
      </td>
      <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
        <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200/80" />
      </td>
      <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
        <div className="ml-auto h-4 w-24 animate-pulse rounded-full bg-slate-200/80" />
      </td>
      <td className="px-3 py-4 sm:px-4">
        <div className="ml-auto h-8 w-24 animate-pulse rounded-full bg-slate-200/80" />
      </td>
    </tr>
  );
}

export function InvoicesTable({ invoices, isLoading = false, sortBy, sortOrder, onSort, onClearSort }: InvoicesTableProps) {
  const columns = useMemo(
    () => [
      { label: "Invoice", key: "invoiceNumber" as const },
      { label: "Member", key: "memberName" as const },
      { label: "Status", key: "status" as const },
      { label: "Invoice Date/Time", key: "invoiceDateUtc" as const },
      { label: "Total", key: "totalAmount" as const, align: "right" as const },
    ] satisfies InvoiceTableColumn[],
    [],
  );

  function getSortTooltip(columnSortBy: MembershipInvoiceSortBy, label: string) {
    if (sortBy !== columnSortBy) {
      return `Sort by ${label}`;
    }

    if (sortOrder === "asc") {
      return `Sort by ${label} descending`;
    }

    return `Clear sort by ${label}`;
  }

  return (
    <div className="space-y-3">
      {sortBy ? (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClearSort}
            title="Clear current sort"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-cyan-100"
          >
            <X size={14} />
            Clear Sort
          </button>
        </div>
      ) : null}

      <div className="max-h-[38rem] overflow-auto rounded-[1.75rem] border border-cyan-100 bg-white/95 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)]">
        <table aria-label="Membership invoices" className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 backdrop-blur">
            <tr className="border-b border-cyan-100 bg-cyan-50/80">
              <th scope="col" className="h-12 border-b border-r border-cyan-200 px-3 text-left sm:px-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                  Actions
                </span>
              </th>
              {columns.map((column) => {
                const active = column.sortable !== false && column.key ? sortBy === column.key : false;
                return (
                  <th
                    key={column.label}
                    scope="col"
                    className={cn(
                      "h-12 border-b border-r border-cyan-200 px-3 sm:px-4",
                      column.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {column.sortable === false || !column.key ? (
                      <span className="inline-flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                        {column.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        title={getSortTooltip(column.key, column.label)}
                        className={cn(
                          "inline-flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700",
                          column.align === "right" ? "justify-end" : "justify-start",
                        )}
                      >
                        {column.label}
                        <SortIcon
                          active={active}
                          order={sortOrder ?? (column.key === "invoiceDateUtc" ? "desc" : "asc")}
                        />
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={`invoice-skeleton-${index}`} />)
            ) : invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <tr
                  key={invoice.invoiceId}
                  className={cn(
                    "border-b border-slate-200/70 hover:bg-cyan-50/40",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/45",
                  )}
                >
                  <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
                    <InvoiceDetailMenu invoice={invoice} />
                  </td>
                  <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
                    <div className="space-y-2">
                      <Link
                        to={buildMembershipInvoiceDetailPath(invoice.invoiceId)}
                        className="block text-sm font-semibold text-cyan-700 underline decoration-cyan-200 underline-offset-4 transition hover:text-cyan-800 hover:decoration-cyan-400"
                      >
                        {invoice.invoiceNo}
                      </Link>
                      <span className="inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                        {formatMembershipInvoicePaymentMethodLabel(invoice.paymentMethod)}
                      </span>
                    </div>
                  </td>
                  <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-900">{invoice.memberName}</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                          {invoice.membershipName}
                        </span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {invoice.memberEmail}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
                    <StatusPill
                      label={getMembershipInvoiceStatusLabel(invoice.invoiceStatus)}
                      tone={getMembershipInvoiceStatusTone(invoice.invoiceStatus)}
                    />
                  </td>
                  <td className="border-r border-slate-200/70 px-3 py-4 text-slate-700 sm:px-4">
                    {formatMembershipInvoiceDateLabel(invoice.invoiceDateUtc)}
                  </td>
                  <td className="border-r border-slate-200/70 px-3 py-4 text-right font-semibold text-slate-900 sm:px-4">
                    {formatMembershipInvoiceAmount(invoice.totalAmount, invoice.currencySymbol)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
