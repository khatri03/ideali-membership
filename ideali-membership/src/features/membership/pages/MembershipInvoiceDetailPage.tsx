import { useMemo, type ReactNode } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Copy,
  Download,
  Mail,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { APP_ROUTES, buildMembershipMemberDetailPath } from "../../../routes";
import { showToast } from "../../../shared/components/toast/Toast";
import { cn } from "../../../lib/utils";
import { DetailPanel, EmptyStatePanel, StatCard, StatusPill } from "../../../pages/MemberDetailPage.parts";
import {
  fetchMembershipInvoiceDetail,
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceContactAddress,
  formatMembershipInvoiceContactName,
  formatMembershipInvoiceDateLabel,
  formatMembershipInvoicePrimaryEmail,
  getMembershipInvoicePaymentMethodLabel,
  getMembershipInvoiceStatusLabel,
  getMembershipInvoiceStatusTone,
} from "../lib/membershipInvoices";
import type { MembershipInvoiceDetailItem } from "../types/invoice";

const STALE_TIME_5_MIN_MS = 5 * 60 * 1000;

function sumPayments(invoice: MembershipInvoiceDetailItem) {
  return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

function getLatestPaymentDate(invoice: MembershipInvoiceDetailItem) {
  return [...invoice.payments]
    .sort((left, right) => right.paymentDateUtc.localeCompare(left.paymentDateUtc))[0]?.paymentDateUtc ?? null;
}

function getLatestNoteDate(invoice: MembershipInvoiceDetailItem) {
  return [...invoice.notes]
    .sort((left, right) => right.createdOnUtc.localeCompare(left.createdOnUtc))[0]?.createdOnUtc ?? null;
}

function buildInvoiceTimeline(invoice: MembershipInvoiceDetailItem) {
  const items: Array<{ title: string; description: string; occurredAtUtc: string }> = [
    {
      title: "Invoice created",
      description: `Created by ${invoice.createdBy}.`,
      occurredAtUtc: invoice.createdOnUtc,
    },
  ];

  if (invoice.updatedOnUtc && invoice.updatedBy) {
    items.push({
      title: "Invoice updated",
      description: `Last updated by ${invoice.updatedBy}.`,
      occurredAtUtc: invoice.updatedOnUtc,
    });
  }

  invoice.payments.forEach((payment) => {
    items.push({
      title: `${payment.paymentStatus} payment recorded`,
      description: `${payment.paymentMethod} - ${formatMembershipInvoiceAmount(payment.amount, "$")}`,
      occurredAtUtc: payment.paymentDateUtc,
    });
  });

  invoice.notes.forEach((note) => {
    items.push({
      title: "Invoice note added",
      description: `${note.createdBy}: ${note.note}`,
      occurredAtUtc: note.createdOnUtc,
    });
  });

  return items.sort((left, right) => right.occurredAtUtc.localeCompare(left.occurredAtUtc));
}

export function MembershipInvoiceDetailPage() {
  const { invoiceUniqueId } = useParams<{ invoiceUniqueId?: string }>();

  const invoiceQuery = useQuery({
    queryKey: ["membership-invoice-detail", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceDetail(invoiceUniqueId ?? ""),
    enabled: Boolean(invoiceUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const invoice = invoiceQuery.data ?? null;

  const paymentTotal = useMemo(() => (invoice ? sumPayments(invoice) : 0), [invoice]);
  const timeline = useMemo(() => (invoice ? buildInvoiceTimeline(invoice) : []), [invoice]);
  const latestPaymentDate = invoice ? getLatestPaymentDate(invoice) : null;
  const latestNoteDate = invoice ? getLatestNoteDate(invoice) : null;

  async function copyInvoiceNumber() {
    if (!invoice) {
      return;
    }

    try {
      await navigator.clipboard.writeText(invoice.invoiceNo);
      showToast("Invoice number copied to clipboard.", "success");
    } catch {
      showToast("Unable to copy the invoice number from this browser context.", "error");
    }
  }

  function printInvoice() {
    window.print();
  }

  if (!invoiceUniqueId) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <EmptyStatePanel
          title="Invoice ID missing"
          description="Open an invoice from the list to view the full billing record."
        />
      </section>
    );
  }

  if (invoiceQuery.isLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
          Loading invoice detail from the backend...
        </div>
      </section>
    );
  }

  if (invoiceQuery.error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <EmptyStatePanel
          title="Invoice not available"
          description={invoiceQuery.error instanceof Error ? invoiceQuery.error.message : "Unable to load invoice detail."}
        />
      </section>
    );
  }

  if (!invoice) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <EmptyStatePanel
          title="Invoice not found"
          description="The invoice you requested is no longer available in the current dataset."
        />
      </section>
    );
  }

  const billingContactName = formatMembershipInvoiceContactName(invoice.contact);
  const billingEmail = formatMembershipInvoicePrimaryEmail(invoice.contact);
  const billingAddress = formatMembershipInvoiceContactAddress(invoice.contact);
  const invoiceContextName = invoice.invoiceContext?.name ?? "Membership invoice";
  const memberUniqueId = invoice.invoiceContext?.memberUniqueId ?? null;
  const latestPaymentMethodLabel = getMembershipInvoicePaymentMethodLabel(invoice);
  const outstandingBalance = invoice.balanceAmount ?? 0;
  const subtotal = Math.max((invoice.invoiceAmount ?? 0) - (invoice.taxAmount ?? 0) - (invoice.serviceCharges ?? 0) + (invoice.discountAmount ?? 0), 0);

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-cyan-50 via-white to-transparent lg:block" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4 xl:max-w-4xl">
            <Link
              to={APP_ROUTES.membershipInvoices}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <ArrowLeft size={16} />
              Back to invoices
            </Link>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Invoice detail
              </p>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    {invoice.invoiceNo}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                    {billingContactName} - {invoiceContextName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill
                    label={getMembershipInvoiceStatusLabel(invoice.invoiceStatus)}
                    tone={getMembershipInvoiceStatusTone(invoice.invoiceStatus)}
                  />
                  {latestPaymentMethodLabel !== "Not available" ? (
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                      Payment: {latestPaymentMethodLabel}
                    </span>
                  ) : null}
                  {memberUniqueId ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      Member linked
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      Standalone record
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem]">
            <button
              type="button"
              onClick={copyInvoiceNumber}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <Copy size={16} />
              Copy number
            </button>
            <button
              type="button"
              onClick={printInvoice}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <Printer size={16} />
              Print invoice
            </button>
            <button
              type="button"
              onClick={() => showToast("Export will be connected to the invoice export API when available.", "info")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <Download size={16} />
              Export preview
            </button>
            {memberUniqueId ? (
              <a
                href={buildMembershipMemberDetailPath(memberUniqueId)}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
              >
                <UserRound size={16} />
                Open member profile
              </a>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500">
                <UserRound size={16} />
                No member link
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Invoice amount"
          value={formatMembershipInvoiceAmount(invoice.invoiceAmount, "$")}
          detail="Total billed on the invoice."
          tone="cyan"
        />
        <StatCard
          label="Amount paid"
          value={formatMembershipInvoiceAmount(paymentTotal, "$")}
          detail="Payments recorded against this invoice."
          tone="emerald"
        />
        <StatCard
          label="Balance due"
          value={formatMembershipInvoiceAmount(outstandingBalance, "$")}
          detail="Outstanding amount awaiting settlement."
          tone={outstandingBalance > 0 ? "rose" : "slate"}
        />
        <StatCard
          label="Created on"
          value={formatMembershipInvoiceDateLabel(invoice.createdOnUtc)}
          detail="Record creation timestamp from the backend."
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.9fr)]">
        <div className="space-y-6">
          <DetailPanel
            title="Invoice summary"
            description="Billing contact, membership context, and invoice metadata in one place."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DetailBlock icon={<UserRound size={16} />} label="Billing contact" value={billingContactName} />
              <DetailBlock icon={<Mail size={16} />} label="Billing email" value={billingEmail} />
              <DetailBlock icon={<Banknote size={16} />} label="Invoice type" value={invoice.invoiceType} />
              <DetailBlock
                icon={<CalendarDays size={16} />}
                label="Invoice date"
                value={formatMembershipInvoiceDateLabel(invoice.invoiceDate)}
              />
              <DetailBlock icon={<ShieldCheck size={16} />} label="Created by" value={invoice.createdBy} />
              <DetailBlock
                icon={<CalendarDays size={16} />}
                label="Last updated"
                value={invoice.updatedOnUtc ? formatMembershipInvoiceDateLabel(invoice.updatedOnUtc) : "Not updated"}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Billing address</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{billingAddress}</pre>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Membership context</p>
                <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
                  <p className="font-semibold text-slate-900">{invoiceContextName}</p>
                  <p>{invoice.invoiceContext?.module ?? "Membership"}</p>
                  <p>{invoice.invoiceContext?.isMemberInvoice ? "Member invoice" : "Organization invoice"}</p>
                  {invoice.invoiceContext?.uniqueId ? (
                    <p className="text-slate-500">Membership type ID: {invoice.invoiceContext.uniqueId}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel
            title="Line items"
            description="A transparent breakdown of every charge, tax, and service component."
          >
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Tax
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Service
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceItems.map((item, index) => (
                    <tr
                      key={`${item.description}-${index}`}
                      className={cn(
                        "border-b border-slate-200/70",
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.description}</div>
                        <p className="mt-1 text-xs text-slate-500">Status: {item.invoiceItemStatus}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatMembershipInvoiceAmount(item.unitPrice, "$")}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatMembershipInvoiceAmount(item.taxCharges.amount ?? 0, "$")}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatMembershipInvoiceAmount(item.serviceCharges.amount ?? 0, "$")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatMembershipInvoiceAmount(item.total, "$")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <CompactTotal label="Subtotal" value={formatMembershipInvoiceAmount(subtotal, "$")} />
              <CompactTotal label="Tax" value={formatMembershipInvoiceAmount(invoice.taxAmount ?? 0, "$")} />
              <CompactTotal
                label="Service charges"
                value={formatMembershipInvoiceAmount(invoice.serviceCharges ?? 0, "$")}
              />
              <CompactTotal label="Discount" value={formatMembershipInvoiceAmount(invoice.discountAmount ?? 0, "$")} />
            </div>
          </DetailPanel>

          <DetailPanel
            title="Activity trail"
            description="A chronological view of payments, notes, and lifecycle events."
          >
            <div className="space-y-4">
              {timeline.map((item) => (
                <article key={`${item.title}-${item.occurredAtUtc}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {formatMembershipInvoiceDateLabel(item.occurredAtUtc)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </DetailPanel>
        </div>

        <aside className="space-y-6">
          <DetailPanel
            title="Collection snapshot"
            description="Key financial facts for the finance and support teams."
          >
            <div className="space-y-3">
              <MiniMetric label="Status" value={getMembershipInvoiceStatusLabel(invoice.invoiceStatus)} />
              <MiniMetric
                label="Last payment"
                value={latestPaymentDate ? formatMembershipInvoiceDateLabel(latestPaymentDate) : "No payments recorded"}
              />
              <MiniMetric label="Payment method" value={latestPaymentMethodLabel} />
              <MiniMetric
                label="Last note"
                value={latestNoteDate ? formatMembershipInvoiceDateLabel(latestNoteDate) : "No notes recorded"}
              />
              <MiniMetric
                label="Contact phone"
                value={invoice.contact?.cellPhone ?? invoice.contact?.workPhone ?? invoice.contact?.homePhone ?? "Not available"}
              />
            </div>
          </DetailPanel>

          <DetailPanel
            title="Payments"
            description="A record of payment attempts and successful collections."
          >
            <div className="space-y-3">
              {invoice.payments.length > 0 ? (
                invoice.payments.map((payment) => (
                  <div key={`${payment.referenceNo ?? payment.createdOnUtc}-${payment.paymentDateUtc}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{payment.paymentMethod}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.paymentStatus}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatMembershipInvoiceAmount(payment.amount, "$")}</p>
                    </div>
                    <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
                      <p>{formatMembershipInvoiceDateLabel(payment.paymentDateUtc)}</p>
                      {payment.referenceNo ? <p>Reference: {payment.referenceNo}</p> : null}
                      {payment.note ? <p>{payment.note}</p> : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyStatePanel
                  title="No payments yet"
                  description="This invoice has not received any recorded payments."
                />
              )}
            </div>
          </DetailPanel>

          <DetailPanel
            title="Notes"
            description="Internal context captured alongside the invoice record."
          >
            <div className="space-y-3">
              {invoice.notes.length > 0 ? (
                invoice.notes.map((note) => (
                  <div key={`${note.createdBy}-${note.createdOnUtc}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{note.createdBy}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{note.note}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatMembershipInvoiceDateLabel(note.createdOnUtc)}</p>
                  </div>
                ))
              ) : (
                <EmptyStatePanel
                  title="No notes captured"
                  description="There are no internal invoice notes yet."
                />
              )}
            </div>
          </DetailPanel>

          {invoice.logoUrl ? (
            <DetailPanel title="Branding" description="The organizer logo applied to this invoice.">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={invoice.logoUrl}
                  alt="Organizer logo"
                  className="h-16 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            </DetailPanel>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function DetailBlock({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function CompactTotal({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
    </div>
  );
}
