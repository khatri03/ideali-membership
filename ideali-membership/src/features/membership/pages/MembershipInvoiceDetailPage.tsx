import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Copy,
  Loader2,
  Mail,
  MessageSquarePlus,
  MapPin,
  Phone,
  Download,
  ChevronDown,
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
import type { MembershipInvoiceDetailItem, MembershipInvoiceDetailLineItem, MembershipInvoiceSummaryItem } from "../types/invoice";
import {
  addMembershipInvoiceNote,
  downloadMembershipInvoicePdf,
  fetchMembershipInvoiceLineItems,
  fetchMembershipInvoiceNotes,
  fetchMembershipInvoiceView,
  fetchMembershipInvoiceSummary,
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
  getMembershipInvoicePaymentMethodLabel,
  sendMembershipInvoiceEmail,
} from "../lib/membershipInvoices";
import { getMembershipDescriptionInfo } from "../../../lib/membershipWizard";

const STALE_TIME_5_MIN_MS = 5 * 60 * 1000;

type ContactLike = {
  prefix?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  primaryEmail?: string | null;
  secondaryEmail?: string | null;
  workEmail?: string | null;
  cellPhone?: string | null;
  homePhone?: string | null;
  workPhone?: string | null;
  address?: {
    streetLine1?: string | null;
    streetLine2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zipCode?: string | null;
  } | null;
};

export function MembershipInvoiceDetailPage({ isPublicView = false }: { isPublicView?: boolean } = {}) {
  const { invoiceUniqueId } = useParams<{ invoiceUniqueId?: string }>();
  const queryClient = useQueryClient();
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [sendEmailRecipient, setSendEmailRecipient] = useState("");
  const [sendEmailNotifyOrganizer, setSendEmailNotifyOrganizer] = useState(false);
  const [sendEmailOtherNotificationEmails, setSendEmailOtherNotificationEmails] = useState<string[]>([]);

  const publicDetailQuery = useQuery({
    queryKey: ["membership-invoice-view", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceView(invoiceUniqueId ?? ""),
    enabled: isPublicView && Boolean(invoiceUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const summaryQuery = useQuery({
    queryKey: ["membership-invoice-summary", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceSummary(invoiceUniqueId ?? ""),
    enabled: !isPublicView && Boolean(invoiceUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const publicDetail = publicDetailQuery.data ?? null;
  const summary = isPublicView ? buildInvoiceSummaryFromDetail(publicDetail) : summaryQuery.data ?? null;

  const memberQuery = useQuery({
    queryKey: ["membership-invoice-member-detail", summary?.memberUniqueId ?? ""],
    queryFn: () => fetchMembershipMemberDetail(summary?.memberUniqueId ?? ""),
    enabled: !isPublicView && Boolean(summary?.memberUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const member = memberQuery.data ?? null;

  const membershipTypeNotificationQuery = useQuery({
    queryKey: ["membership-type-notification-settings", member?.membership?.membershipTypeUniqueId ?? ""],
    queryFn: () => getMembershipDescriptionInfo(member?.membership?.membershipTypeUniqueId ?? ""),
    enabled: !isPublicView && Boolean(member?.membership?.membershipTypeUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const lineItemsQuery = useQuery({
    queryKey: ["membership-invoice-line-items", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceLineItems(invoiceUniqueId ?? ""),
    enabled: !isPublicView && Boolean(invoiceUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const notesQuery = useQuery({
    queryKey: ["membership-invoice-notes", invoiceUniqueId ?? ""],
    queryFn: () => fetchMembershipInvoiceNotes(invoiceUniqueId ?? ""),
    enabled: !isPublicView && Boolean(invoiceUniqueId),
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

  async function downloadPdf() {
    if (!invoiceUniqueId || !summary) {
      return;
    }

    setIsDownloadingPdf(true);
    try {
      await downloadMembershipInvoicePdf(invoiceUniqueId, summary.invoiceNo);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to download the PDF.", "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  function openSendEmailDialog() {
    setSendEmailRecipient(formatMemberEmail(memberContact));
    setSendEmailNotifyOrganizer(membershipTypeNotificationQuery.data?.notifyOrganizer ?? false);
    setSendEmailOtherNotificationEmails(
      splitNotificationEmails(membershipTypeNotificationQuery.data?.otherNotificationEmails ?? ""),
    );
    setIsSendEmailModalOpen(true);
  }

  async function submitSendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!invoiceUniqueId || !summary) {
      return;
    }

    const recipientEmail = sendEmailRecipient.trim();
    if (!recipientEmail) {
      showToast("Member email is required.", "error");
      return;
    }

    setIsSendingEmail(true);
    try {
      await sendMembershipInvoiceEmail(invoiceUniqueId, {
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

  const memberContact: ContactLike | null = isPublicView ? publicDetail?.contact ?? null : member?.contact ?? null;
  const memberAddress = isPublicView ? publicDetail?.contact?.address ?? null : member?.address ?? null;
  const memberStatus = isPublicView ? null : member?.membership?.membershipStatus ?? null;
  const notes = isPublicView ? publicDetail?.notes ?? [] : notesQuery.data ?? [];
  const rawLineItems = isPublicView ? publicDetail?.invoiceItems ?? [] : lineItemsQuery.data ?? [];
  const isPdfMode = typeof window !== "undefined" && window.location.search.includes("pdf=true");
  const discountCouponCode = summary?.discountCouponCode ?? null;
  const discountLineItemAmount = Math.abs(summary?.discountAmount ?? 0);
  const currencySymbol = summary?.currencySymbol ?? "$";
  const memberUniqueId = summary?.memberUniqueId ?? null;
  const latestPaymentMethodLabel = summary?.paymentMethod ?? "Not available";
  const latestPaymentSourceLabel = summary?.paymentSource ?? "Not available";
  const latestPaymentStatusLabel = summary?.paymentStatus ?? "Not available";
  const latestPaymentStatusTone = getInvoicePaymentStatusTone(latestPaymentStatusLabel);

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

    const isTipLineItem = (item: MembershipInvoiceDetailLineItem) =>
      item.itemType === 1 || item.description.trim().toLowerCase() === "tip";

    const purchasedItems = rawLineItems.filter((item) => !isTipLineItem(item));
    const tipItems = rawLineItems.filter((item) => isTipLineItem(item));
    const purchasedSubtotal = purchasedItems.reduce((sum, item) => sum + getLineItemAmount(item), 0);
    const tipTotal = tipItems.reduce((sum, item) => sum + getLineItemAmount(item), 0);
    const hasDiscountCoupon = Boolean(discountCouponCode) && discountLineItemAmount > 0;

    const discountLineItem: MembershipInvoiceDetailLineItem | null = hasDiscountCoupon
      ? {
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
        }
      : null;

    const netTotalLineItem: MembershipInvoiceDetailLineItem = {
      description: "Net Total",
      unitPrice: 0,
      quantity: 1,
      total: Math.max((hasDiscountCoupon ? purchasedSubtotal - discountLineItemAmount : purchasedSubtotal) + tipTotal, 0),
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

    return [
      ...purchasedItems,
      ...(discountLineItem ? [discountLineItem] : []),
      ...(hasDiscountCoupon
        ? [
            {
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
            } satisfies MembershipInvoiceDetailLineItem,
          ]
        : []),
      ...tipItems,
      netTotalLineItem,
    ];
  }, [discountCouponCode, discountLineItemAmount, rawLineItems]);

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

  const detailQuery = isPublicView ? publicDetailQuery : summaryQuery;
  const isMemberLoading = isPublicView ? publicDetailQuery.isLoading : memberQuery.isLoading;
  const isLineItemsLoading = isPublicView ? publicDetailQuery.isLoading : lineItemsQuery.isLoading;
  const isNotesLoading = isPublicView ? publicDetailQuery.isLoading : notesQuery.isLoading;

  if (detailQuery.isLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
          Loading invoice detail from the backend...
        </div>
      </section>
    );
  }

  if (detailQuery.error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <EmptyStatePanel
          title="Invoice not available"
          description={detailQuery.error instanceof Error ? detailQuery.error.message : "Unable to load invoice detail."}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isPublicView ? (
          <Link
            to={APP_ROUTES.membershipInvoices}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <ArrowLeft size={16} />
            Back to invoices
          </Link>
        ) : (
          <span />
        )}

        {isPdfMode ? null : isPublicView ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void downloadPdf()}
              title="Download PDF"
              aria-label="Download PDF"
              disabled={isDownloadingPdf}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={openSendEmailDialog}
              title="Send email"
              aria-label="Send invoice email"
              disabled={isSendingEmail}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail size={16} />
            </button>
            <button
              type="button"
              onClick={() => void downloadPdf()}
              title="Download PDF"
              aria-label="Download PDF"
              disabled={isDownloadingPdf}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Invoice number
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {summary.invoiceNo}
          </h1>
          {!isPublicView ? (
            <button
              type="button"
              onClick={copyInvoiceNumber}
              title="Copy number"
              aria-label="Copy invoice number"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <Copy size={18} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Invoice amount"
          value={formatMembershipInvoiceAmount(summary.invoiceAmount, currencySymbol)}
          tone="cyan"
          compact
        />
        <StatCard
          label="Payment method"
          value={latestPaymentMethodLabel}
          tone="emerald"
          compact
        />
        <StatCard
          label="Membership"
          value={summary.membershipName}
          tone="slate"
          compact
        />
        <StatCard
          label="Invoice Date"
          value={formatMembershipInvoiceDateLabel(summary.invoiceDate)}
          tone="amber"
          compact
        />
        <StatCard
          label="Payment source"
          value={latestPaymentSourceLabel}
          tone="slate"
          compact
        />
        <StatCard
          label="Payment Status"
          value={latestPaymentStatusLabel}
          tone={latestPaymentStatusTone}
          compact
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.9fr)]">
        <div className="space-y-6">
          <DetailPanel
            title="Member detail"
          >
            {isMemberLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="h-3 w-24 rounded-full bg-slate-200" />
                    <div className="mt-3 h-5 w-full rounded-full bg-slate-200" />
                    <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : memberContact ? (
              <div className="grid gap-4 md:grid-cols-2">
                <DetailBlock
                  icon={<UserRound size={16} />}
                  label="Name"
                  labelAction={
                    !isPublicView && memberUniqueId ? (
                      <a
                        href={buildMembershipMemberDetailPath(memberUniqueId)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={cn(
                          "ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition",
                          getMemberDetailStatusPillClasses(memberStatus),
                        )}
                        title={getMemberDetailStatusTooltip(memberStatus)}
                        aria-label={getMemberDetailStatusTooltip(memberStatus)}
                      >
                        View Detail
                      </a>
                    ) : null
                  }
                  value={formatMemberName(memberContact)}
                />
                <DetailBlock icon={<Mail size={16} />} label="Email" value={formatMemberEmail(memberContact)} />
                <DetailBlock icon={<Phone size={16} />} label="Phone" value={formatMemberPhone(memberContact)} />
                <AddressDetailBlock icon={<MapPin size={16} />} label="Address" address={memberAddress} />
              </div>
            ) : (
              <EmptyStatePanel
                title="Member not available"
                description="The linked member record could not be loaded."
              />
            )}
          </DetailPanel>

          <DetailPanel title="Line items">
            {isLineItemsLoading ? (
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
              <div className="flex flex-wrap items-center justify-end gap-2">
                {notes.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setIsNotesExpanded((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
                  >
                    <ChevronDown size={14} className={cn("transition", isNotesExpanded ? "rotate-180" : "rotate-0")} />
                    {isNotesExpanded ? "Hide notes" : `Show notes (${notes.length})`}
                  </button>
                ) : null}
                {isPublicView ? null : (
                  <button
                    type="button"
                    onClick={openAddNoteModal}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
                  >
                    <MessageSquarePlus size={14} />
                    Add Note
                  </button>
                )}
              </div>
            }
          >
            <div className="space-y-3">
              {isNotesLoading ? (
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
                <>
                  {notes.slice(0, 1).map((note) => (
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
                  ))}
                  {notes.length > 1 ? (
                    <>
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out",
                          isNotesExpanded ? "grid-rows-[1fr] opacity-100 translate-y-0 mt-3" : "grid-rows-[0fr] opacity-0 -translate-y-2 mt-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="space-y-3 pt-1">
                            {notes.slice(1).map((note) => (
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
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsNotesExpanded((current) => !current)}
                        className="inline-flex items-center gap-2 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <ChevronDown size={14} className={cn("transition", isNotesExpanded ? "rotate-180" : "rotate-0")} />
                        {isNotesExpanded ? "Hide notes" : `Show all ${notes.length} notes`}
                      </button>
                    </>
                  ) : null}
                </>
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

function buildInvoiceSummaryFromDetail(detail: MembershipInvoiceDetailItem | null): MembershipInvoiceSummaryItem | null {
  if (!detail) {
    return null;
  }

  const latestPayment = getLatestInvoicePayment(detail);

  return {
    uniqueId: detail.uniqueId,
    invoiceNo: detail.invoiceNo,
    invoiceDate: detail.invoiceDate,
    invoiceAmount: detail.invoiceAmount,
    discountAmount: detail.discountAmount,
    discountCouponCode: detail.discountCouponCode,
    balanceAmount: detail.balanceAmount,
    paymentMethod: getMembershipInvoicePaymentMethodLabel(detail),
    paymentSource: latestPayment?.paymentSource ?? null,
    paymentStatus: latestPayment?.paymentStatus ?? null,
    membershipName: detail.invoiceContext?.name ?? "Not available",
    memberUniqueId: detail.invoiceContext?.memberUniqueId ?? null,
    currencySymbol: detail.currencySymbol ?? "$",
  };
}

function getLatestInvoicePayment(detail: MembershipInvoiceDetailItem | null): MembershipInvoiceDetailPayment | null {
  if (!detail || detail.payments.length === 0) {
    return null;
  }

  return [...detail.payments].sort((left, right) => right.paymentDateUtc.localeCompare(left.paymentDateUtc))[0] ?? null;
}

function formatMemberName(contact: ContactLike | null | undefined) {
  if (!contact) {
    return "Not available";
  }

  return [contact.prefix, contact.firstName, contact.middleName, contact.lastName]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(" ")
    .trim() || "Not available";
}

function formatMemberEmail(contact: ContactLike | null | undefined) {
  if (!contact) {
    return "Not available";
  }

  return contact.email || contact.primaryEmail || contact.secondaryEmail || contact.workEmail || "Not available";
}

function splitNotificationEmails(value: string) {
  return value
    .split(/[;,\n]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeNotificationEmails(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
}

function formatMemberPhone(contact: ContactLike | null | undefined) {
  if (!contact) {
    return "Not available";
  }

  return contact.cellPhone || contact.workPhone || contact.homePhone || "Not available";
}

function normalizeMembershipStatus(status: string | null | undefined) {
  return (status ?? "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getMemberDetailStatusPillClasses(status: string | null | undefined) {
  switch (normalizeMembershipStatus(status)) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800";
    case "pendingapproval":
      return "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800";
    case "expired":
      return "border-red-300 bg-red-950/95 text-red-50 hover:border-red-400 hover:bg-red-900 hover:text-white";
    default:
      return "border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-800";
  }
}

function getMemberDetailStatusTooltip(status: string | null | undefined) {
  const normalizedStatus = formatMembershipStatusLabel(status);
  return normalizedStatus ? `Membership status: ${normalizedStatus}. Open member detail.` : "Open member detail.";
}

function formatMembershipStatusLabel(status: string | null | undefined) {
  const normalized = normalizeMembershipStatus(status);
  if (!normalized) {
    return null;
  }

  if (normalized === "pendingapproval") {
    return "Pending Approval";
  }

  if (normalized === "active") {
    return "Active";
  }

  if (normalized === "rejected") {
    return "Rejected";
  }

  if (normalized === "expired") {
    return "Expired";
  }

  return (status ?? "").trim() || null;
}

function getInvoicePaymentStatusTone(status: string | null | undefined): "slate" | "cyan" | "emerald" | "amber" | "rose" {
  switch ((status ?? "").trim().toLowerCase()) {
    case "success":
      return "emerald";
    case "pending":
      return "amber";
    case "failed":
      return "rose";
    default:
      return "slate";
  }
}

function DetailBlock({
  icon,
  label,
  labelAction,
  value,
}: {
  icon: ReactNode;
  label: string;
  labelAction?: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
        {labelAction ? <span className="flex shrink-0 items-center normal-case tracking-normal">{labelAction}</span> : null}
      </div>
      <div className="mt-3 text-sm font-medium leading-6 text-slate-700">{value}</div>
    </div>
  );
}

function AddressDetailBlock({
  icon,
  label,
  address,
}: {
  icon: ReactNode;
  label: string;
  address: ContactLike["address"] | null | undefined;
}) {
  const rows = [
    { label: "Street line 1", value: address?.streetLine1 },
    { label: "Street line 2", value: address?.streetLine2 },
    { label: "City", value: address?.city },
    { label: "State", value: address?.state },
    { label: "ZIP", value: address?.zipCode },
    { label: "Country", value: address?.country },
  ].filter((row) => Boolean(row.value && row.value.trim().length > 0));

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
        {label}
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{row.label}</div>
              <div className="mt-1 text-sm font-medium leading-6 text-slate-700">{row.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium leading-6 text-slate-700">Not available</p>
      )}
    </div>
  );
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <form
        className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"
        onSubmit={onSend}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Send invoice email</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Review recipients</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirm who should receive the invoice email and whether the organizer should be copied.
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

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900" htmlFor="invoice-recipient-email">
              Recipient email
            </label>
            <input
              id="invoice-recipient-email"
              readOnly
              value={recipientEmail}
              className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This invoice will be sent to the member email shown above.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-800">Notify organizer</p>
              <p className="text-xs text-slate-500">Send a copy to the organizer.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyOrganizer}
              aria-label="Toggle notify organizer"
              onClick={() => onNotifyOrganizerChange(!notifyOrganizer)}
              className={[
                "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition",
                notifyOrganizer
                  ? "border-cyan-500 bg-cyan-500"
                  : "border-slate-300 bg-slate-200 hover:bg-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
                  notifyOrganizer ? "translate-x-7" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Other notification emails
            </label>
            <NotificationEmailTagsField
              value={otherNotificationEmails}
              onChange={onOtherNotificationEmailsChange}
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Add any additional recipients as pills. Press Enter or paste a comma-separated list.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSending || recipientEmail.trim().length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : null}
            Send email
          </button>
        </div>
      </form>
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
