import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Copy,
  Loader2,
  Mail,
  MessageSquarePlus,
  MapPin,
  Phone,
  Printer,
  UserRound,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipMemberDetailPath } from "../../../routes";
import { cn } from "../../../lib/utils";
import { showToast } from "../../../shared/components/toast/Toast";
import { DetailPanel, EmptyStatePanel, StatCard } from "../../../pages/MemberDetailPage.parts";
import { fetchMembershipMemberDetail } from "../../../lib/membershipMembers";
import type { MembershipMemberDetailItem } from "../../../types/membership";
import type { MembershipInvoiceDetailLineItem } from "../types/invoice";
import {
  addMembershipInvoiceNote,
  fetchMembershipInvoiceLineItems,
  fetchMembershipInvoiceNotes,
  fetchMembershipInvoiceSummary,
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
} from "../lib/membershipInvoices";

const STALE_TIME_5_MIN_MS = 5 * 60 * 1000;

export function MembershipInvoiceDetailPage() {
  const { invoiceUniqueId } = useParams<{ invoiceUniqueId?: string }>();
  const queryClient = useQueryClient();
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const summaryQuery = useQuery({
    queryKey: ["membership-invoice-summary", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceSummary(invoiceUniqueId ?? ""),
    enabled: Boolean(invoiceUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const summary = summaryQuery.data ?? null;

  const memberQuery = useQuery({
    queryKey: ["membership-invoice-member-detail", summary?.memberUniqueId ?? ""],
    queryFn: () => fetchMembershipMemberDetail(summary?.memberUniqueId ?? ""),
    enabled: Boolean(summary?.memberUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const lineItemsQuery = useQuery({
    queryKey: ["membership-invoice-line-items", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceLineItems(invoiceUniqueId ?? ""),
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
      await queryClient.invalidateQueries({ queryKey: ["membership-invoice-notes", invoiceUniqueId ?? ""] });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Unable to save the note.", "error");
    },
  });

  const member = memberQuery.data ?? null;
  const notes = notesQuery.data ?? [];
  const rawLineItems = lineItemsQuery.data ?? [];
  const discountCouponCode = summary?.discountCouponCode ?? null;
  const discountLineItemAmount = Math.abs(summary?.discountAmount ?? 0);
  const currencySymbol = summary?.currencySymbol ?? "$";
  const memberUniqueId = summary?.memberUniqueId ?? null;
  const latestPaymentMethodLabel = summary?.paymentMethod ?? "Not available";

  const getLineItemAmount = (item: MembershipInvoiceDetailLineItem) => {
    if (item.description.startsWith("Discount coupon:")) {
      return item.total;
    }

    return item.total + (item.discountAmount ?? 0);
  };

  const getLineItemRate = (item: MembershipInvoiceDetailLineItem) => {
    if (item.description === "Sub total" || item.description === "Net Total") {
      return "—";
    }

    return formatMembershipInvoiceAmount(item.unitPrice, currencySymbol);
  };

  const lineItems = useMemo(() => {
    if (rawLineItems.length === 0) {
      return [];
    }

    if (!discountCouponCode || discountLineItemAmount <= 0) {
      return rawLineItems;
    }

    const discountLineItem: MembershipInvoiceDetailLineItem = {
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

    const isTipLineItem = (item: MembershipInvoiceDetailLineItem) =>
      item.itemType === 1 || item.description.trim().toLowerCase() === "tip";

    const purchasedItems = rawLineItems.filter((item) => !isTipLineItem(item));
    const tipItems = rawLineItems.filter((item) => isTipLineItem(item));
    const purchasedSubtotal = purchasedItems.reduce((sum, item) => sum + getLineItemAmount(item), 0);
    const tipTotal = tipItems.reduce((sum, item) => sum + getLineItemAmount(item), 0);

    const subtotalLineItem: MembershipInvoiceDetailLineItem = {
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

    const netTotalLineItem: MembershipInvoiceDetailLineItem = {
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
  }, [discountCouponCode, discountLineItemAmount, rawLineItems]);

  async function copyInvoiceNumber() {
    if (!summary) {
      return;
    }

    try {
      await navigator.clipboard.writeText(summary.invoiceNo);
      showToast("Invoice number copied to clipboard.", "success");
    } catch {
      showToast("Unable to copy the invoice number from this browser context.", "error");
    }
  }

  function printInvoice() {
    window.print();
  }

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

  if (summaryQuery.isLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
          Loading invoice summary from the backend...
        </div>
      </section>
    );
  }

  if (summaryQuery.error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <EmptyStatePanel
          title="Invoice not available"
          description={summaryQuery.error instanceof Error ? summaryQuery.error.message : "Unable to load invoice summary."}
        />
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <EmptyStatePanel
          title="Invoice not found"
          description="The invoice you requested is no longer available in the current dataset."
        />
      </section>
    );
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
                Invoice summary
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                {summary.invoiceNo}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Summary, member detail, line items, and notes are loaded separately for a lighter detail view.
              </p>
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
                value={formatMembershipInvoiceAmount(summary.invoiceAmount, currencySymbol)}
                tone="cyan"
              />
              <StatCard
                label="Payment method"
                value={latestPaymentMethodLabel}
                tone="emerald"
              />
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2">
              <StatCard
                label="Membership name"
                value={summary.membershipName}
                tone="slate"
              />
              <StatCard
                label="Invoice Date"
                value={formatMembershipInvoiceDateLabel(summary.invoiceDate)}
                tone="amber"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.9fr)]">
        <div className="space-y-6">
          <DetailPanel
            title="Member detail"
            action={
              memberUniqueId ? (
                <a
                  href={buildMembershipMemberDetailPath(memberUniqueId)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
                >
                  <UserRound size={14} />
                  Open member profile
                </a>
              ) : null
            }
          >
            {memberQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="h-3 w-24 rounded-full bg-slate-200" />
                    <div className="mt-3 h-5 w-full rounded-full bg-slate-200" />
                    <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : member ? (
              <div className="grid gap-4 md:grid-cols-2">
                <DetailBlock
                  icon={<UserRound size={16} />}
                  label="Member name"
                  value={
                    memberUniqueId ? (
                      <a
                        href={buildMembershipMemberDetailPath(memberUniqueId)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                        title="Open member profile"
                      >
                        {formatMemberName(member)}
                      </a>
                    ) : (
                      formatMemberName(member)
                    )
                  }
                />
                <DetailBlock icon={<Mail size={16} />} label="Email" value={formatMemberEmail(member)} />
                <DetailBlock icon={<Phone size={16} />} label="Phone" value={formatMemberPhone(member)} />
                <DetailBlock
                  icon={<MapPin size={16} />}
                  label="Address"
                  value={<pre className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{formatMemberAddress(member)}</pre>}
                />
              </div>
            ) : (
              <EmptyStatePanel
                title="Member not available"
                description="The linked member record could not be loaded."
              />
            )}
          </DetailPanel>

          <DetailPanel title="Line items">
            {lineItemsQuery.isLoading ? (
              <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white">
                <table className="min-w-[44rem] w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Description</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Qty</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Rate</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tax</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Service</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(4)].map((_, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-200/70">
                        <td className="px-4 py-4"><div className="h-4 w-48 rounded-full bg-slate-200 animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="ml-auto h-4 w-8 rounded-full bg-slate-200 animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="ml-auto h-4 w-16 rounded-full bg-slate-200 animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="ml-auto h-4 w-16 rounded-full bg-slate-200 animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="ml-auto h-4 w-16 rounded-full bg-slate-200 animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="ml-auto h-4 w-20 rounded-full bg-slate-200 animate-pulse" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : lineItems.length > 0 ? (
              <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white">
                <table className="min-w-[44rem] w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Description</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Qty</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Rate</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tax</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Service</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Amount</th>
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
                            <td className="px-4 py-3 text-right text-slate-700">{getLineItemRate(item)}</td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatMembershipInvoiceAmount(item.taxCharges.amount ?? 0, currencySymbol)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatMembershipInvoiceAmount(item.serviceCharges.amount ?? 0, currencySymbol)}
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
                          {formatMembershipInvoiceAmount(getLineItemAmount(item), currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyStatePanel
                title="No line items"
                description="The invoice does not currently contain any billable line items."
              />
            )}
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

function formatMemberName(member: MembershipMemberDetailItem | null | undefined) {
  if (!member) {
    return "Not available";
  }

  return [member.contact.prefix, member.contact.firstName, member.contact.middleName, member.contact.lastName]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(" ")
    .trim() || "Not available";
}

function formatMemberEmail(member: MembershipMemberDetailItem | null | undefined) {
  if (!member) {
    return "Not available";
  }

  return member.contact.email || "Not available";
}

function formatMemberPhone(member: MembershipMemberDetailItem | null | undefined) {
  if (!member) {
    return "Not available";
  }

  return member.contact.cellPhone || "Not available";
}

function formatMemberAddress(member: MembershipMemberDetailItem | null | undefined) {
  if (!member) {
    return "Not available";
  }

  const cityStateZipCountry = [member.address.city, member.address.state, member.address.zipCode, member.address.country]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(", ");

  const parts = [member.address.streetLine1, member.address.streetLine2, cityStateZipCountry]
    .filter((part): part is string => Boolean(part && part.trim().length > 0));

  return parts.length > 0 ? parts.join("\n") : "Not available";
}

function DetailBlock({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-sm font-medium leading-6 text-slate-700">{value}</div>
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
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
