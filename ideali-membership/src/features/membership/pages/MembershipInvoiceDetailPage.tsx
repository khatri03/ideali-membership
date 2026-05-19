import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Copy,
  Loader2,
  Mail,
  MessageSquarePlus,
  Phone,
  MapPin,
  Printer,
  X,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APP_ROUTES, buildMembershipMemberDetailPath } from "../../../routes";
import { showToast } from "../../../shared/components/toast/Toast";
import { cn } from "../../../lib/utils";
import { DetailPanel, EmptyStatePanel, StatCard } from "../../../pages/MemberDetailPage.parts";
import {
  fetchMembershipInvoiceDetail,
  fetchMembershipInvoiceNotes,
  addMembershipInvoiceNote,
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

export function MembershipInvoiceDetailPage() {
  const { invoiceUniqueId } = useParams<{ invoiceUniqueId?: string }>();
  const queryClient = useQueryClient();
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const invoiceQuery = useQuery({
    queryKey: ["membership-invoice-detail", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceDetail(invoiceUniqueId ?? ""),
    enabled: Boolean(invoiceUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const notesQuery = useQuery({
    queryKey: ["membership-invoice-notes", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceNotes(invoiceUniqueId ?? ""),
    enabled: Boolean(invoiceUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => addMembershipInvoiceNote(invoiceUniqueId ?? "", note),
    onSuccess: async () => {
      setIsAddNoteModalOpen(false);
      setNoteDraft("");
      showToast("Invoice note saved.", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["membership-invoice-detail", invoiceUniqueId ?? ""] }),
        queryClient.invalidateQueries({ queryKey: ["membership-invoice-notes", invoiceUniqueId ?? ""] }),
      ]);
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Unable to save the note.", "error");
    },
  });

  const invoice = invoiceQuery.data ?? null;
  const notes = notesQuery.data ?? invoice?.notes ?? [];

  const discountCouponCode = invoice?.discountCouponCode ?? null;
  const discountLineItemAmount = Math.abs(invoice?.discountAmount ?? 0);
  const getLineItemAmount = (item: MembershipInvoiceDetailItem["invoiceItems"][number]) => {
    if (item.description.startsWith("Discount coupon:")) {
      return item.total;
    }

    return item.total + (item.discountAmount ?? 0);
  };

  const getLineItemRate = (item: MembershipInvoiceDetailItem["invoiceItems"][number]) => {
    if (item.description === "Sub total" || item.description === "Net Total") {
      return "—";
    }

    return formatMembershipInvoiceAmount(item.unitPrice, "$");
  };
  const lineItems = useMemo(() => {
    if (!invoice) {
      return [];
    }

    if (!discountCouponCode || discountLineItemAmount <= 0) {
      return invoice.invoiceItems;
    }

    const discountLineItem = {
      description: `Discount coupon: ${discountCouponCode}`,
      unitPrice: 0,
      quantity: 1,
      total: -discountLineItemAmount,
      invoiceItemStatus: "Applied",
      discountAmount: null,
      discountRate: null,
      taxCharges: {
        rate: 0,
        description: "Discount",
        amount: 0,
      },
      serviceCharges: {
        rate: 0,
        description: "Discount",
        amount: 0,
      },
      itemType: 0,
    };

    const isTipLineItem = (item: MembershipInvoiceDetailItem["invoiceItems"][number]) =>
      item.itemType === 1 || item.description.trim().toLowerCase() === "tip";

    const purchasedItems = invoice.invoiceItems.filter((item) => !isTipLineItem(item));
    const tipItems = invoice.invoiceItems.filter((item) => isTipLineItem(item));
    const purchasedSubtotal = purchasedItems.reduce((sum, item) => sum + getLineItemAmount(item), 0);
    const tipTotal = tipItems.reduce((sum, item) => sum + getLineItemAmount(item), 0);
    const subtotalLineItem = {
      description: "Sub total",
      unitPrice: 0,
      quantity: 1,
      total: Math.max(purchasedSubtotal - discountLineItemAmount, 0),
      invoiceItemStatus: "Applied",
      discountAmount: null,
      discountRate: null,
      taxCharges: {
        rate: 0,
        description: "Subtotal",
        amount: 0,
      },
      serviceCharges: {
        rate: 0,
        description: "Subtotal",
        amount: 0,
      },
      itemType: 0,
    };
    const netTotalLineItem = {
      description: "Net Total",
      unitPrice: 0,
      quantity: 1,
      total: Math.max(subtotalLineItem.total + tipTotal, 0),
      invoiceItemStatus: "Applied",
      discountAmount: null,
      discountRate: null,
      taxCharges: {
        rate: 0,
        description: "Net total",
        amount: 0,
      },
      serviceCharges: {
        rate: 0,
        description: "Net total",
        amount: 0,
      },
      itemType: 0,
    };

    return [...purchasedItems, discountLineItem, subtotalLineItem, ...tipItems, netTotalLineItem];
  }, [discountCouponCode, discountLineItemAmount, invoice, getLineItemAmount]);

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

  function openAddNoteModal() {
    setNoteDraft("");
    setIsAddNoteModalOpen(true);
  }

  function closeAddNoteModal() {
    if (addNoteMutation.isPending) {
      return;
    }

    setIsAddNoteModalOpen(false);
    setNoteDraft("");
  }

  async function handleSaveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextNote = noteDraft.trim();
    if (!nextNote) {
      showToast("Please enter a note before saving.", "error");
      return;
    }

    if (!invoiceUniqueId) {
      return;
    }

    await addNoteMutation.mutateAsync(nextNote);
  }

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
                  <div className="space-y-1.5">
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
                  {lineItems.map((item, index) => (
                    <tr
                      key={`${item.description}-${index}`}
                      className={cn(
                        "border-b border-slate-200/70",
                        item.description.startsWith("Discount coupon:")
                          ? "bg-amber-50/80 text-amber-950"
                          : item.description === "Sub total"
                            ? "border-cyan-300 bg-cyan-50/70"
                            : item.description === "Net Total"
                              ? "border-slate-300 bg-slate-200/70"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/60",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div
                          className={cn(
                            "font-medium",
                            item.description.startsWith("Discount coupon:")
                              ? "text-amber-900"
                              : item.description === "Sub total"
                                ? "text-cyan-950"
                                : item.description === "Net Total"
                                  ? "text-slate-950"
                                : "text-slate-900",
                          )}
                        >
                          {item.description}
                        </div>
                      </td>
                      {item.description.startsWith("Discount coupon:") || item.description === "Sub total" || item.description === "Net Total" ? (
                        <>
                          <td className="px-4 py-3 text-right text-slate-700" />
                          <td className="px-4 py-3 text-right text-slate-700" />
                          <td className="px-4 py-3 text-right text-slate-700" />
                          <td className="px-4 py-3 text-right text-slate-700" />
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {getLineItemRate(item)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatMembershipInvoiceAmount(item.taxCharges.amount ?? 0, "$")}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatMembershipInvoiceAmount(item.serviceCharges.amount ?? 0, "$")}
                          </td>
                        </>
                      )}
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold",
                        item.description.startsWith("Discount coupon:")
                          ? "text-amber-900"
                          : item.description === "Sub total"
                            ? "text-cyan-950"
                            : item.description === "Net Total"
                              ? "text-slate-950"
                            : "text-slate-900",
                      )}
                      >
                        {formatMembershipInvoiceAmount(getLineItemAmount(item), "$")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </DetailPanel>

        </div>

        <aside className="space-y-6">
          <DetailPanel
            title="Notes"
            action={
              <button
                type="button"
                onClick={openAddNoteModal}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
              >
                <MessageSquarePlus size={14} />
                Add Note
              </button>
            }
          >
            <div className="space-y-3">
              {notesQuery.isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="h-3 w-24 rounded-full bg-slate-200" />
                      <div className="mt-3 h-4 w-full rounded-full bg-slate-200" />
                      <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-200" />
                      <div className="mt-4 h-3 w-32 rounded-full bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <article
                    key={`${note.createdBy}-${note.createdOnUtc}`}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                          <UserRound size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{note.createdBy}</p>
                          <p className="text-xs text-slate-500">{formatMembershipInvoiceDateLabel(note.createdOnUtc)}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{note.note}</p>
                  </article>
                ))
              ) : (
                <EmptyStatePanel
                  title="No notes captured"
                  description="Captured invoice notes will appear here when they are added."
                />
              )}
            </div>
          </DetailPanel>

        </aside>
      </div>

      <InvoiceNoteModal
        isOpen={isAddNoteModalOpen}
        noteDraft={noteDraft}
        isSaving={addNoteMutation.isPending}
        onNoteDraftChange={setNoteDraft}
        onCancel={closeAddNoteModal}
        onSave={handleSaveNote}
      />
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
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 break-words text-sm font-medium text-slate-700",
          nowrapOnWide ? "leading-6 xl:truncate xl:whitespace-nowrap" : "leading-6",
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
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      {detail ? <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p> : null}
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

function InvoiceNoteModal({
  isOpen,
  noteDraft,
  isSaving,
  onNoteDraftChange,
  onCancel,
  onSave,
}: {
  isOpen: boolean;
  noteDraft: string;
  isSaving: boolean;
  onNoteDraftChange: (value: string) => void;
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm" onClick={onCancel} role="presentation">
      <form
        className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"
        onSubmit={onSave}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Add note</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Record a billing note</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep an internal note on this invoice. The latest note will surface at the top immediately after saving.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close modal"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-900" htmlFor="invoice-note">
            Note
          </label>
          <textarea
            id="invoice-note"
            value={noteDraft}
            onChange={(event) => onNoteDraftChange(event.target.value)}
            placeholder="Write a clear internal note about this invoice..."
            maxLength={400}
            rows={7}
            className="min-h-[10rem] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Maximum 400 characters</span>
            <span>{noteDraft.length}/400</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || noteDraft.trim().length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
