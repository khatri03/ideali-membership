import { useMemo, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Copy,
  Mail,
  Phone,
  MapPin,
  Printer,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { APP_ROUTES, buildMembershipMemberDetailPath } from "../../../routes";
import { showToast } from "../../../shared/components/toast/Toast";
import { cn } from "../../../lib/utils";
import { DetailPanel, EmptyStatePanel, StatCard } from "../../../pages/MemberDetailPage.parts";
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
  const billingPhone = invoice.contact?.cellPhone ?? invoice.contact?.workPhone ?? invoice.contact?.homePhone ?? "Not available";
  const billingAddress = formatMembershipInvoiceContactAddress(invoice.contact);
  const billingAddressLine = billingAddress.replace(/\s*\n+\s*/g, ", ");
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
                  <div className="space-y-3">
                    <HeaderMetaItem
                      icon={<UserRound size={16} />}
                      value={memberUniqueId ? (
                        <a
                          href={buildMembershipMemberDetailPath(memberUniqueId)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                          title="Open member profile"
                        >
                          {billingContactName}
                        </a>
                      ) : (
                        billingContactName
                      )}
                    />
                    <HeaderMetaItem icon={<Mail size={16} />} value={billingEmail} />
                    <HeaderMetaItem icon={<Phone size={16} />} value={billingPhone} />
                    <HeaderMetaItem icon={<MapPin size={16} />} value={billingAddressLine} nowrapOnWide />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 xl:min-w-[28rem]">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={copyInvoiceNumber}
                title="Copy number"
                aria-label="Copy invoice number"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
              >
                <Copy size={18} />
              </button>
              <button
                type="button"
                onClick={printInvoice}
                title="Print invoice"
                aria-label="Print invoice"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
              >
                <Printer size={18} />
              </button>
              {memberUniqueId ? (
                <a
                  href={buildMembershipMemberDetailPath(memberUniqueId)}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Open member profile"
                  aria-label="Open member profile"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm transition hover:bg-cyan-700"
                >
                  <UserRound size={18} />
                </a>
              ) : null}
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <StatCard
                label="Invoice amount"
                value={formatMembershipInvoiceAmount(invoice.invoiceAmount, "$")}
                tone="cyan"
              />
              <StatCard
                label="Method Method"
                value={latestPaymentMethodLabel}
                tone="emerald"
              />
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <StatCard
                label="Membership name"
                value={invoiceContextName}
                tone="slate"
              />
              <StatCard
                label="Invoice Date"
                value={formatMembershipInvoiceDateLabel(invoice.createdOnUtc)}
                tone="amber"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.9fr)]">
        <div className="space-y-6">
          <DetailPanel
            title="Invoice summary"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DetailBlock icon={<UserRound size={16} />} label="Billing contact" value={billingContactName} />
              <DetailBlock icon={<Mail size={16} />} label="Billing email" value={billingEmail} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Billing address</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{billingAddress}</pre>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel
            title="Line items"
          >
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white">
              <table className="min-w-[44rem] w-full border-collapse text-sm">
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
                />
              )}
            </div>
          </DetailPanel>

          <DetailPanel
            title="Notes"
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
                />
              )}
            </div>
          </DetailPanel>

          {invoice.logoUrl ? (
            <DetailPanel title="Branding">
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

function HeaderMetaItem({
  icon,
  value,
  nowrapOnWide = false,
}: {
  icon: ReactNode;
  value: ReactNode;
  nowrapOnWide?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 break-words text-sm font-medium text-slate-700",
          nowrapOnWide ? "leading-8 xl:truncate xl:whitespace-nowrap" : "leading-8",
        )}
      >
        {value}
      </span>
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
