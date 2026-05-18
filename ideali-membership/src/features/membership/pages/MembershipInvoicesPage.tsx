import { Filter } from "lucide-react";
import { buildMembershipInvoiceDetailPath, buildMembershipMemberDetailPath } from "../../../routes";
import { DetailPanel, EmptyStatePanel, StatusPill } from "../../../pages/MemberDetailPage.parts";
import {
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
} from "../lib/membershipInvoices";
import { InvoicesFilters, InvoicesPagination, InvoicesTable } from "../components";
import { useMembershipInvoicesPage } from "./MembershipInvoicesPage.hooks";

export function MembershipInvoicesPage() {
  const {
    invoices,
    pageCount,
    pageNo,
    pageSize,
    searchTerm,
    draftSearchTerm,
    draftMembershipTypeUniqueIds,
    selectedStatusFilters,
    selectedMembershipTypeUniqueIds,
    draftStatusFilters,
    draftPaymentMethodFilters,
    draftInvoiceDateFrom,
    draftInvoiceDateTo,
    selectedPaymentMethodFilters,
    selectedInvoiceDateFrom,
    selectedInvoiceDateTo,
    defaultStatusFilters,
    hasPendingFilterChanges,
    isMembershipTypesLoading,
    sortBy,
    sortOrder,
    totalRecordsCount,
    membershipTypeOptions,
    membershipInvoiceStatusOptions,
    paymentMethodOptions,
    isLoading,
    error,
    setDraftSearchTerm,
    setDraftMembershipTypeUniqueIds,
    setDraftStatusFilters,
    setDraftPaymentMethodFilters,
    setDraftInvoiceDateFrom,
    setDraftInvoiceDateTo,
    applyFilters,
    clearFilters,
    setSortBy,
    clearSort,
    setPageNo,
    setPageSize,
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
        </div>
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
          <InvoicesFilters
            draftSearchTerm={draftSearchTerm}
            draftMembershipTypeUniqueIds={draftMembershipTypeUniqueIds}
            draftStatusFilters={draftStatusFilters}
            draftPaymentMethodFilters={draftPaymentMethodFilters}
            draftInvoiceDateFrom={draftInvoiceDateFrom}
            draftInvoiceDateTo={draftInvoiceDateTo}
            hasPendingFilterChanges={hasPendingFilterChanges}
            isMembershipTypesLoading={isMembershipTypesLoading}
            isInvoicesFetching={isLoading}
            selectedSearchTerm={searchTerm}
            selectedMembershipTypeUniqueIds={selectedMembershipTypeUniqueIds}
            selectedStatusFilters={selectedStatusFilters}
            selectedPaymentMethodFilters={selectedPaymentMethodFilters}
            selectedInvoiceDateFrom={selectedInvoiceDateFrom}
            selectedInvoiceDateTo={selectedInvoiceDateTo}
            defaultStatusFilters={defaultStatusFilters}
            membershipTypeOptions={membershipTypeOptions}
            statusOptions={membershipInvoiceStatusOptions}
            paymentMethodOptions={paymentMethodOptions}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
            onDraftSearchTermChange={setDraftSearchTerm}
            onDraftMembershipTypeUniqueIdsChange={setDraftMembershipTypeUniqueIds}
            onDraftStatusFiltersChange={(value) => setDraftStatusFilters(value as typeof selectedStatusFilters)}
            onDraftPaymentMethodFiltersChange={(value) => setDraftPaymentMethodFilters(value as typeof selectedPaymentMethodFilters)}
            onDraftInvoiceDateFromChange={setDraftInvoiceDateFrom}
            onDraftInvoiceDateToChange={setDraftInvoiceDateTo}
          />

          {error ? (
            <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {!error ? (
            <>
              <InvoicesTable
                invoices={invoices}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={setSortBy}
                onClearSort={clearSort}
              />

              {!isLoading ? (
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
                              className="block text-base font-semibold text-cyan-700 underline decoration-cyan-200 underline-offset-4"
                            >
                              {invoice.invoiceNo}
                            </a>
                            <div className="mt-2 inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                              {invoice.paymentMethod ?? "Not available"}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{invoice.memberName}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                                {invoice.membershipName}
                              </span>
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                {invoice.memberEmail}
                              </span>
                            </div>
                          </div>
                          <StatusPill
                            label={getInvoiceStatusLabel(invoice.invoiceStatus)}
                            tone={getInvoiceStatusTone(invoice.invoiceStatus)}
                          />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <InfoTile label="Invoice Date/Time" value={formatMembershipInvoiceDateLabel(invoice.invoiceDateUtc)} />
                          <InfoTile label="Total" value={formatMembershipInvoiceAmount(invoice.totalAmount, invoice.currencySymbol)} />
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
              ) : null}
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
