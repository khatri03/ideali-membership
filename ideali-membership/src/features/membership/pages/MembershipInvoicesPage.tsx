import { useEffect, useState, type FormEvent } from "react";
import { Filter, Loader2, Mail, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { buildMembershipInvoiceDetailPath, buildMembershipMemberDetailPath } from "../../../routes";
import { showToast } from "../../../shared/components/toast/Toast";
import { DetailPanel, EmptyStatePanel, StatusPill } from "../../../pages/MemberDetailPage.parts";
import { fetchMembershipMemberDetail } from "../../../lib/membershipMembers";
import {
  sendMembershipInvoiceEmail,
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
} from "../lib/membershipInvoices";
import { getMembershipThankYouEmailInfo } from "../../../lib/membershipWizard";
import { InvoicesFilters, InvoicesPagination, InvoicesTable } from "../components";
import { useMembershipInvoicesPage } from "./MembershipInvoicesPage.hooks";
import type { MembershipInvoiceListItem } from "../types/invoice";

export function MembershipInvoicesPage() {
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [sendEmailInvoice, setSendEmailInvoice] = useState<MembershipInvoiceListItem | null>(null);
  const [sendEmailRecipient, setSendEmailRecipient] = useState("");
  const [sendEmailNotifyOrganizer, setSendEmailNotifyOrganizer] = useState(false);
  const [sendEmailOtherNotificationEmails, setSendEmailOtherNotificationEmails] = useState<string[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  const sendEmailMemberQuery = useQuery({
    queryKey: ["membership-invoice-email-member", sendEmailInvoice?.memberUniqueId ?? ""],
    queryFn: () => fetchMembershipMemberDetail(sendEmailInvoice?.memberUniqueId ?? ""),
    enabled: isSendEmailModalOpen && Boolean(sendEmailInvoice?.memberUniqueId),
    staleTime: 5 * 60 * 1000,
  });

  const sendEmailMember = sendEmailMemberQuery.data ?? null;

  const sendEmailSettingsQuery = useQuery({
    queryKey: ["membership-invoice-email-settings", sendEmailMember?.membership?.membershipTypeUniqueId ?? ""],
    queryFn: () => getMembershipThankYouEmailInfo(sendEmailMember?.membership?.membershipTypeUniqueId ?? ""),
    enabled: isSendEmailModalOpen && Boolean(sendEmailMember?.membership?.membershipTypeUniqueId),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isSendEmailModalOpen || !sendEmailInvoice) {
      return;
    }

    setSendEmailRecipient(sendEmailInvoice.memberEmail || "");
  }, [isSendEmailModalOpen, sendEmailInvoice]);

  useEffect(() => {
    if (!isSendEmailModalOpen) {
      return;
    }

    setSendEmailNotifyOrganizer(sendEmailSettingsQuery.data?.notifyOrganizer ?? false);
    setSendEmailOtherNotificationEmails(splitNotificationEmails(sendEmailSettingsQuery.data?.otherNotificationEmails ?? ""));
  }, [isSendEmailModalOpen, sendEmailSettingsQuery.data]);

  function openSendEmailDialog(invoice: MembershipInvoiceListItem) {
    setSendEmailInvoice(invoice);
    setIsSendEmailModalOpen(true);
  }

  async function submitSendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sendEmailInvoice) {
      return;
    }

    const recipientEmail = sendEmailRecipient.trim();
    if (!recipientEmail) {
      showToast("Member email is required.", "error");
      return;
    }

    setIsSendingEmail(true);
    try {
      await sendMembershipInvoiceEmail(sendEmailInvoice.invoiceId, {
        toEmail: recipientEmail,
        notifyOrganizer: sendEmailNotifyOrganizer,
        otherNotificationEmails: sendEmailOtherNotificationEmails,
      });
      setIsSendEmailModalOpen(false);
      showToast("Invoice email sent.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to send the invoice email.", "error");
    } finally {
      setIsSendingEmail(false);
    }
  }

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
                onSendViaEmail={openSendEmailDialog}
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
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                                {invoice.paymentMethod ?? "Not available"}
                              </span>
                              {invoice.paymentSource ? (
                                <span
                                  className="inline-flex max-w-full w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                  title={invoice.paymentSource}
                                >
                                  <span className="truncate">{invoice.paymentSource}</span>
                                </span>
                              ) : null}
                            </div>
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

      <SendInvoiceEmailModal
        isOpen={isSendEmailModalOpen}
        recipientEmail={sendEmailRecipient}
        notifyOrganizer={sendEmailNotifyOrganizer}
        otherNotificationEmails={sendEmailOtherNotificationEmails}
        isSending={isSendingEmail}
        onCancel={() => setIsSendEmailModalOpen(false)}
        onSend={submitSendEmail}
        onNotifyOrganizerChange={setSendEmailNotifyOrganizer}
        onOtherNotificationEmailsChange={setSendEmailOtherNotificationEmails}
      />
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

function splitNotificationEmails(value: string) {
  return value
    .split(/[;,\n]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeNotificationEmails(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}

function NotificationEmailTagsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  const [draftValue, setDraftValue] = useState("");

  function commitTags(nextTags: string[]) {
    onChange(normalizeNotificationEmails(nextTags));
  }

  function addDraftValue(rawValue: string) {
    const nextItems = splitNotificationEmails(rawValue);
    if (nextItems.length === 0) {
      return;
    }

    commitTags([...value, ...nextItems]);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800"
          >
            <span className="max-w-[16rem] truncate">{tag}</span>
            <button
              type="button"
              onClick={() => commitTags(value.filter((item) => item !== tag))}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-cyan-700 transition hover:bg-cyan-100"
              aria-label={`Remove ${tag}`}
              title={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          type="text"
          value={draftValue}
          onChange={(event) => {
            const nextValue = event.target.value;

            if (nextValue.includes(",") || nextValue.includes("\n")) {
              addDraftValue(nextValue);
              setDraftValue("");
              return;
            }

            setDraftValue(nextValue);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraftValue(draftValue);
              setDraftValue("");
              return;
            }

            if (event.key === "Backspace" && draftValue.length === 0 && value.length > 0) {
              event.preventDefault();
              commitTags(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            addDraftValue(draftValue);
            setDraftValue("");
          }}
          className="min-w-[14rem] flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={value.length > 0 ? "Add another email" : "email1@example.com"}
        />
      </div>
    </div>
  );
}

function SendInvoiceEmailModal({
  isOpen,
  recipientEmail,
  notifyOrganizer,
  otherNotificationEmails,
  isSending,
  onCancel,
  onSend,
  onNotifyOrganizerChange,
  onOtherNotificationEmailsChange,
}: {
  isOpen: boolean;
  recipientEmail: string;
  notifyOrganizer: boolean;
  otherNotificationEmails: string[];
  isSending: boolean;
  onCancel: () => void;
  onSend: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onNotifyOrganizerChange: (value: boolean) => void;
  onOtherNotificationEmailsChange: (nextValue: string[]) => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm" onClick={onCancel} role="presentation">
      <form className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl" onSubmit={onSend} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Send invoice email</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Review recipients</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirm the recipient list before sending the invoice email.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700" aria-label="Close modal" title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900" htmlFor="invoice-recipient-email">
              Recipient email
            </label>
            <input id="invoice-recipient-email" readOnly value={recipientEmail} className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none" />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-800">Notify organizer</p>
              <p className="text-xs text-slate-500">Send a copy to the organizer.</p>
            </div>
            <button type="button" role="switch" aria-checked={notifyOrganizer} aria-label="Toggle notify organizer" onClick={() => onNotifyOrganizerChange(!notifyOrganizer)} className={[
              "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition",
              notifyOrganizer ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-slate-200 hover:bg-slate-300",
            ].join(" ")}>
              <span className={[
                "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
                notifyOrganizer ? "translate-x-7" : "translate-x-1",
              ].join(" ")} />
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">Other notification emails</label>
            <NotificationEmailTagsField value={otherNotificationEmails} onChange={onOtherNotificationEmailsChange} />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isSending} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSending || recipientEmail.trim().length === 0} className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300">
            {isSending ? <Loader2 size={16} className="animate-spin" /> : null}
            Send email
          </button>
        </div>
      </form>
    </div>
  );
}
