import { useMemo } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { buildMembershipInvoiceDetailPath, buildMembershipMemberDetailPath } from "../../../routes";
import { cn } from "../../../lib/utils";
import { formatMembershipInvoiceAmount, formatMembershipInvoiceDateLabel } from "../lib/membershipInvoices";
import type { MembershipInvoiceListItem, MembershipInvoiceSortBy } from "../types/invoice";
import { StatusPill } from "../../../pages/MemberDetailPage.parts";
import { getMembershipInvoiceStatusLabel, getMembershipInvoiceStatusTone } from "../lib/membershipInvoices";

type InvoicesTableProps = {
  invoices: MembershipInvoiceListItem[];
  sortBy?: MembershipInvoiceSortBy;
  sortOrder?: "asc" | "desc";
  onSort: (sortBy: MembershipInvoiceSortBy) => void;
  onClearSort: () => void;
};

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

export function InvoicesTable({ invoices, sortBy, sortOrder, onSort, onClearSort }: InvoicesTableProps) {
  const columns = useMemo(
    () => [
      { label: "Invoice", key: "invoiceNumber" as const },
      { label: "Member", key: "memberName" as const },
      { label: "Status", key: "status" as const },
      { label: "Invoice Date", key: "invoiceDateUtc" as const },
      { label: "Total", key: "totalAmount" as const, align: "right" as const },
      { label: "Balance", key: "balanceAmount" as const, align: "right" as const },
    ],
    [],
  );

  function renderSortIcon(columnSortBy: MembershipInvoiceSortBy) {
    if (sortBy !== columnSortBy) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }

    return sortOrder === "desc" ? (
      <ArrowDown size={14} className="text-cyan-700" />
    ) : (
      <ArrowUp size={14} className="text-cyan-700" />
    );
  }

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
              {columns.map((column) => {
                const active = sortBy === column.key;
                return (
                  <th
                    key={column.label}
                    scope="col"
                    className={cn(
                      "h-12 border-b border-r border-cyan-200 px-3 sm:px-4",
                      column.align === "right" ? "text-right" : "text-left",
                    )}
                  >
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
                      <SortIcon active={active} order={sortOrder ?? "asc"} />
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="h-12 px-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 sm:px-4">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <tr
                  key={invoice.invoiceId}
                  className={cn(
                    "border-b border-slate-200/70 hover:bg-cyan-50/40",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/45",
                  )}
                >
                  <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
                    <div className="space-y-1">
                      <Link
                        to={buildMembershipInvoiceDetailPath(invoice.invoiceId)}
                        className="text-sm font-semibold text-cyan-700 underline decoration-cyan-200 underline-offset-4 transition hover:text-cyan-800 hover:decoration-cyan-400"
                      >
                        {invoice.invoiceNo}
                      </Link>
                      <p className="text-xs text-slate-500">{invoice.membershipName}</p>
                    </div>
                  </td>
                  <td className="border-r border-slate-200/70 px-3 py-4 sm:px-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">{invoice.memberName}</div>
                      <div className="text-xs text-slate-500">{invoice.memberEmail}</div>
                      {invoice.memberUniqueId ? (
                        <a
                          href={buildMembershipMemberDetailPath(invoice.memberUniqueId)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs font-medium text-cyan-700 transition hover:text-cyan-800"
                        >
                          Open member profile
                        </a>
                      ) : null}
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
                  <td className="border-r border-slate-200/70 px-3 py-4 text-right font-semibold text-slate-900 sm:px-4">
                    {formatMembershipInvoiceAmount(invoice.balanceAmount ?? 0, invoice.currencySymbol)}
                  </td>
                  <td className="px-3 py-4 text-right sm:px-4">
                    <Link
                      to={buildMembershipInvoiceDetailPath(invoice.invoiceId)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
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
