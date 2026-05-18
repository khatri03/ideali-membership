import { Filter, Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import { buildMembershipInvoiceDetailPath, buildMembershipMemberDetailPath } from "../../../routes";
import { DetailPanel, EmptyStatePanel, StatCard, StatusPill } from "../../../pages/MemberDetailPage.parts";
import {
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
} from "../lib/membershipInvoices";
import { InvoicesPagination, InvoicesTable } from "../components";
import { useMembershipInvoicesPage } from "./MembershipInvoicesPage.hooks";

export function MembershipInvoicesPage() {
  const {
    invoices,
    pageCount,
    pageNo,
    pageSize,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    summary,
    totalRecordsCount,
    membershipInvoiceStatusOptions,
    isLoading,
    error,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    clearSort,
    setPageNo,
    setPageSize,
    clearFilters,
    getInvoiceStatusLabel,
    getInvoiceStatusTone,
  } = useMembershipInvoicesPage();

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-cyan-50 via-white to-transparent lg:block" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Membership invoicing
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Invoice control center
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              A live, searchable workspace for membership invoices, balances, and billing operations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem]">
            <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Open balance on page
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatMembershipInvoiceAmount(summary.totalBalanceDue, "$")}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                Invoice value on page
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatMembershipInvoiceAmount(summary.totalAmount, "$")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Invoices on page"
          value={String(invoices.length)}
          detail="Records currently returned from the server."
          tone="cyan"
        />
        <StatCard
          label="Open balance"
          value={formatMembershipInvoiceAmount(summary.totalBalanceDue, "$")}
          detail="Remaining amount across the visible page."
          tone="rose"
        />
        <StatCard
          label="Paid invoices"
          value={String(summary.paidCount)}
          detail="Invoices already settled on this page."
          tone="emerald"
        />
        <StatCard
          label="Pending invoices"
          value={String(summary.pendingCount)}
          detail="Unpaid invoices currently returned by the API."
          tone="amber"
        />
      </div>

      <DetailPanel
        title="Invoices"
        description="Search, filter, and sort membership invoices using a responsive operational view."
        action={
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
          >
            <Filter size={14} />
            Clear filters
          </button>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <label className="relative block">
              <span className="sr-only">Search invoices</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search invoice number, member, membership, or email"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="block">
              <span className="sr-only">Filter invoices by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              >
                {membershipInvoiceStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {membershipInvoiceStatusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  statusFilter === option.value
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
              Loading invoices from the backend...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {!isLoading && !error ? (
            <>
              <InvoicesTable
                invoices={invoices}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={setSortBy}
                onClearSort={clearSort}
              />

              <div className="space-y-3 lg:hidden">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <article
                      key={invoice.invoiceId}
                      className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <a
                            href={buildMembershipInvoiceDetailPath(invoice.invoiceId)}
                            className="text-base font-semibold text-cyan-700 underline decoration-cyan-200 underline-offset-4"
                          >
                            {invoice.invoiceNo}
                          </a>
                          <p className="mt-1 text-sm text-slate-600">{invoice.memberName}</p>
                          <p className="mt-1 text-xs text-slate-500">{invoice.membershipName}</p>
                        </div>
                        <StatusPill label={getInvoiceStatusLabel(invoice.invoiceStatus)} tone={getInvoiceStatusTone(invoice.invoiceStatus)} />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoTile label="Invoice Date" value={formatMembershipInvoiceDateLabel(invoice.invoiceDateUtc)} />
                        <InfoTile label="Total" value={formatMembershipInvoiceAmount(invoice.totalAmount, invoice.currencySymbol)} />
                        <InfoTile label="Balance" value={formatMembershipInvoiceAmount(invoice.balanceAmount ?? 0, invoice.currencySymbol)} />
                      </div>

                      {invoice.memberUniqueId ? (
                        <div className="mt-4">
                          <a
                            href={buildMembershipMemberDetailPath(invoice.memberUniqueId)}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
                          >
                            Open member profile
                          </a>
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <EmptyStatePanel
                    title="No invoices match these filters"
                    description="Try broadening the search or clearing the status filter to bring records back into view."
                  />
                )}
              </div>
            </>
          ) : null}

          <InvoicesPagination
            currentPage={pageNo}
            pageSize={pageSize}
            totalPages={pageCount > 0 ? pageCount : Math.ceil(totalRecordsCount / pageSize)}
            totalRecordsCount={totalRecordsCount}
            onPageChange={setPageNo}
            onPageSizeChange={setPageSize}
          />
        </div>
      </DetailPanel>
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
