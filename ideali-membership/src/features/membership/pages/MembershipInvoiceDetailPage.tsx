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
import { Box, Button, Grid, Heading, HStack, Stack, Text, Textarea } from "@chakra-ui/react";
import { APP_ROUTES, buildMembershipMemberDetailPath } from "../../../routes";
import { cn } from "../../../lib/utils";
import { showToast } from "../../../shared/components/toast/Toast";
import { DetailPanel, EmptyStatePanel, StatCard } from "../../../pages/MemberDetailPage.parts";
import { fetchMembershipMemberDetail } from "../../../lib/membershipMembers";
import type { MembershipInvoiceDetailItem, MembershipInvoiceDetailLineItem, MembershipInvoiceSummaryItem } from "../types/invoice";
import {
  addMembershipInvoiceNote,
  fetchMembershipInvoiceLineItems,
  fetchMembershipInvoiceNotes,
  fetchMembershipInvoiceView,
  fetchMembershipInvoiceSummary,
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
  getMembershipInvoicePaymentMethodLabel,
} from "../lib/membershipInvoices";

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

  const member = memberQuery.data ?? null;
  const memberContact: ContactLike | null = isPublicView ? publicDetail?.contact ?? null : member?.contact ?? null;
  const memberAddress = isPublicView ? publicDetail?.contact?.address ?? null : member?.address ?? null;
  const notes = isPublicView ? publicDetail?.notes ?? [] : notesQuery.data ?? [];
  const rawLineItems = isPublicView ? publicDetail?.invoiceItems ?? [] : lineItemsQuery.data ?? [];
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
      <Box rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <EmptyStatePanel
          title="Invoice ID missing"
          description="Open an invoice from the list to view the full billing record."
        />
      </Box>
    );
  }

  const detailQuery = isPublicView ? publicDetailQuery : summaryQuery;
  const isMemberLoading = isPublicView ? publicDetailQuery.isLoading : memberQuery.isLoading;
  const isLineItemsLoading = isPublicView ? publicDetailQuery.isLoading : lineItemsQuery.isLoading;
  const isNotesLoading = isPublicView ? publicDetailQuery.isLoading : notesQuery.isLoading;

  if (detailQuery.isLoading) {
    return (
      <Box rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" p={8} fontSize="sm" color="app.muted">
          Loading invoice detail from the backend...
        </Box>
      </Box>
    );
  }

  if (detailQuery.error) {
    return (
      <Box rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <EmptyStatePanel
          title="Invoice not available"
          description={detailQuery.error instanceof Error ? detailQuery.error.message : "Unable to load invoice detail."}
        />
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <EmptyStatePanel
          title="Invoice not found"
          description="The invoice you requested is no longer available in the current dataset."
        />
      </Box>
    );
  }

  return (
    <Stack gap={6}>
      <Box position="relative" overflow="hidden" rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <Box position="absolute" insetY={0} right={0} display={{ base: "none", lg: "block" }} w="1/3" bgGradient="linear(to-l, brand.50, app.surface)" />
        <Stack position="relative" gap={6} direction={{ base: "column", xl: "row" }} align={{ base: "stretch", xl: "start" }} justify="space-between">
          <Stack gap={4} maxW="4xl">
            {isPublicView ? null : (
              <Link
                to={APP_ROUTES.membershipInvoices}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  borderRadius: "9999px",
                  border: "1px solid var(--chakra-colors-app-border)",
                  background: "var(--chakra-colors-app-surface)",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--chakra-colors-app-text)",
                  transition: "all 0.15s ease",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} />
                Back to invoices
              </Link>
            )}

            <Stack gap={3}>
              <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.24em" textTransform="uppercase" color="brand.700">
                Invoice summary
              </Text>
              <Heading as="h1" size={{ base: "2xl", sm: "3xl", lg: "4xl" }} letterSpacing="-0.04em" color="app.text">
                {summary.invoiceNo}
              </Heading>
              <Text maxW="2xl" fontSize="sm" lineHeight="1.8" color="app.muted">
                {isPublicView
                  ? "Public invoice view with the full invoice record rendered without the app shell."
                  : "Summary, member detail, line items, and notes are loaded separately for a lighter detail view."}
              </Text>
            </Stack>
          </Stack>

          <Stack gap={3} align={{ base: "stretch", xl: "end" }} minW={{ xl: "28rem" }}>
            <HStack flexWrap="wrap" justify={{ base: "start", xl: "end" }} gap={2}>
              <button
                type="button"
                onClick={copyInvoiceNumber}
                title="Copy number"
                aria-label="Copy invoice number"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  border: "1px solid var(--chakra-colors-app-border)",
                  background: "var(--chakra-colors-app-surface)",
                  color: "var(--chakra-colors-app-text)",
                  boxShadow: "var(--chakra-shadows-sm)",
                  transition: "all 0.15s ease",
                }}
              >
                <Copy size={18} />
              </button>
              <button
                type="button"
                onClick={printInvoice}
                title="Print invoice"
                aria-label="Print invoice"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  border: "1px solid var(--chakra-colors-app-border)",
                  background: "var(--chakra-colors-app-surface)",
                  color: "var(--chakra-colors-app-text)",
                  boxShadow: "var(--chakra-shadows-sm)",
                  transition: "all 0.15s ease",
                }}
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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    background: "var(--chakra-colors-brand-600)",
                    color: "white",
                    boxShadow: "var(--chakra-shadows-sm)",
                    transition: "background 0.15s ease",
                  }}
                >
                  <UserRound size={18} />
                </a>
              ) : null}
            </HStack>

            <Grid w="full" gap={3} templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}>
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
            </Grid>

            <Grid w="full" gap={3} templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}>
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
            </Grid>
          </Stack>
        </Stack>
      </Box>

      <Grid gap={6} templateColumns={{ base: "1fr", xl: "minmax(0,1.55fr)_minmax(22rem,0.9fr)" }}>
        <Stack gap={6}>
          <DetailPanel
            title="Member detail"
          >
            {isMemberLoading ? (
              <Grid gap={4} templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}>
                {[...Array(4)].map((_, index) => (
                  <Box key={index} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" p={4}>
                    <Box h="3" w="24" rounded="full" bg="slate.200" />
                    <Box mt={3} h="5" w="full" rounded="full" bg="slate.200" />
                    <Box mt={2} h="4" w="4/5" rounded="full" bg="slate.200" />
                  </Box>
                ))}
              </Grid>
            ) : memberContact ? (
              <Grid gap={4} templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}>
                <DetailBlock
                  icon={<UserRound size={16} />}
                  label="Member name"
                  value={
                    !isPublicView && memberUniqueId ? (
                      <a
                        href={buildMembershipMemberDetailPath(memberUniqueId)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                        title="Open member profile"
                      >
                        {formatMemberName(memberContact)}
                      </a>
                    ) : (
                      formatMemberName(memberContact)
                    )
                  }
                />
                <DetailBlock icon={<Mail size={16} />} label="Email" value={formatMemberEmail(memberContact)} />
                <DetailBlock icon={<Phone size={16} />} label="Phone" value={formatMemberPhone(memberContact)} />
                <AddressDetailBlock icon={<MapPin size={16} />} label="Address" address={memberAddress} />
              </Grid>
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
        </Stack>
      <aside className="space-y-6">
          <DetailPanel
            title="Notes"
            action={
              isPublicView ? null : (
                <Button
                  type="button"
                  onClick={openAddNoteModal}
                  variant="outline"
                  rounded="full"
                  borderColor="brand.100"
                  bg="brand.50"
                  color="brand.800"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight="semibold"
                  gap={2}
                  _hover={{ borderColor: "brand.200", bg: "brand.100" }}
                >
                  <MessageSquarePlus size={14} />
                  Add Note
                </Button>
              )
            }
          >
            <Stack gap={3}>
              {isNotesLoading ? (
                <Stack gap={3}>
                  {[...Array(3)].map((_, index) => (
                    <Box
                      key={index}
                      rounded="app.card"
                      borderWidth="1px"
                      borderColor="app.border"
                      bg="app.surfaceAlt"
                      p={4}
                    >
                      <Box h="3" w="24" rounded="full" bg="slate.200" />
                      <Box mt={3} h="4" w="full" rounded="full" bg="slate.200" />
                      <Box mt={2} h="4" w="4/5" rounded="full" bg="slate.200" />
                      <Box mt={4} h="3" w="32" rounded="full" bg="slate.200" />
                    </Box>
                  ))}
                </Stack>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <Box
                    as="article"
                    key={`${note.createdBy}-${note.createdOnUtc}`}
                    rounded="app.card"
                    borderWidth="1px"
                    borderColor="app.border"
                    bg="app.surface"
                    p={4}
                    shadow="sm"
                    transition="all 0.15s ease"
                    _hover={{ borderColor: "brand.200", shadow: "md" }}
                  >
                    <Box display="flex" alignItems="start" justifyContent="space-between" gap={4}>
                      <HStack gap={3} align="start">
                        <Box display="inline-flex" h="10" w="10" alignItems="center" justifyContent="center" rounded="xl" bg="brand.50" color="brand.700">
                          <UserRound size={18} />
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold" color="app.text">
                            {note.createdBy}
                          </Text>
                          <Text fontSize="xs" color="app.muted">
                            {formatMembershipInvoiceDateLabel(note.createdOnUtc)}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                    <Text mt={4} whiteSpace="pre-wrap" fontSize="sm" lineHeight="1.75" color="app.text">
                      {note.note}
                    </Text>
                  </Box>
                ))
              ) : (
                <EmptyStatePanel
                  title="No notes captured"
                  description="Captured invoice notes will appear here when they are added."
                />
              )}
            </Stack>
          </DetailPanel>
        </aside>
      </Grid>

      <InvoiceNoteModal
        isOpen={isAddNoteModalOpen}
        noteDraft={noteDraft}
        isSaving={addNoteMutation.isPending}
        onNoteDraftChange={setNoteDraft}
        onCancel={closeAddNoteModal}
        onSave={handleSaveNote}
      />
    </Stack>
  );
}

function buildInvoiceSummaryFromDetail(detail: MembershipInvoiceDetailItem | null): MembershipInvoiceSummaryItem | null {
  if (!detail) {
    return null;
  }

  return {
    uniqueId: detail.uniqueId,
    invoiceNo: detail.invoiceNo,
    invoiceDate: detail.invoiceDate,
    invoiceAmount: detail.invoiceAmount,
    discountAmount: detail.discountAmount,
    discountCouponCode: detail.discountCouponCode,
    balanceAmount: detail.balanceAmount,
    paymentMethod: getMembershipInvoicePaymentMethodLabel(detail),
    membershipName: detail.invoiceContext?.name ?? "Not available",
    memberUniqueId: detail.invoiceContext?.memberUniqueId ?? null,
    currencySymbol: detail.currencySymbol ?? "$",
  };
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

function formatMemberPhone(contact: ContactLike | null | undefined) {
  if (!contact) {
    return "Not available";
  }

  return contact.cellPhone || contact.workPhone || contact.homePhone || "Not available";
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
    <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" p={4} shadow="sm">
      <HStack gap={2} fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.muted">
        <Box display="inline-flex" h="7" w="7" alignItems="center" justifyContent="center" rounded="full" bg="app.surfaceAlt" color="app.muted">
          {icon}
        </Box>
        {label}
      </HStack>
      <Box mt={3} fontSize="sm" fontWeight="medium" lineHeight="1.75" color="app.text">
        {value}
      </Box>
    </Box>
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
    <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surface" p={4} shadow="sm" gridColumn={{ md: "span 2" }}>
      <HStack gap={2} fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.muted">
        <Box display="inline-flex" h="7" w="7" alignItems="center" justifyContent="center" rounded="full" bg="app.surfaceAlt" color="app.muted">
          {icon}
        </Box>
        {label}
      </HStack>

      {rows.length > 0 ? (
        <Grid mt={4} gap={3} templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}>
          {rows.map((row) => (
            <Box key={row.label} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" px={4} py={3}>
              <Text fontSize="11px" fontWeight="semibold" letterSpacing="0.14em" textTransform="uppercase" color="app.muted">
                {row.label}
              </Text>
              <Text mt={1} fontSize="sm" fontWeight="medium" lineHeight="1.75" color="app.text">
                {row.value}
              </Text>
            </Box>
          ))}
        </Grid>
      ) : (
        <Text mt={3} fontSize="sm" fontWeight="medium" lineHeight="1.75" color="app.text">
          Not available
        </Text>
      )}
    </Box>
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
    <Box
      position="fixed"
      inset={0}
      zIndex={50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="rgba(15, 23, 42, 0.4)"
      px={4}
      py={8}
      backdropFilter="blur(6px)"
      onClick={onCancel}
      role="presentation"
    >
      <form
        onSubmit={onSave}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "42rem",
          borderRadius: "2rem",
          border: "1px solid var(--chakra-colors-app-border)",
          background: "var(--chakra-colors-app-surface)",
          padding: "1.5rem",
          boxShadow: "var(--chakra-shadows-2xl)",
        }}
      >
        <Box display="flex" alignItems="start" justifyContent="space-between" gap={4}>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.24em" textTransform="uppercase" color="brand.700">
              Add note
            </Text>
            <Heading as="h3" mt={2} size="lg" letterSpacing="-0.03em" color="app.text">
              Record a billing note
            </Heading>
            <Text mt={2} fontSize="sm" lineHeight="1.75" color="app.muted">
              Keep an internal note on this invoice. The latest note will surface at the top immediately after saving.
            </Text>
          </Box>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            rounded="full"
            h="10"
            w="10"
            minW="10"
            p="0"
            borderWidth="1px"
            borderColor="app.border"
            bg="app.surface"
            color="app.muted"
            _hover={{ borderColor: "app.borderStrong", color: "app.text" }}
            aria-label="Close modal"
            title="Close"
          >
            <X size={18} />
          </Button>
        </Box>

        <Box mt={6}>
          <label htmlFor="invoice-note" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--chakra-colors-app-text)" }}>
            Note
          </label>
          <Textarea
            id="invoice-note"
            value={noteDraft}
            onChange={(event) => onNoteDraftChange(event.target.value)}
            placeholder="Write a clear internal note about this invoice..."
            maxLength={400}
            rows={7}
            minH="10rem"
            rounded="app.card"
            borderColor="app.border"
            bg="app.surfaceAlt"
            px={4}
            py={3}
            fontSize="sm"
            lineHeight="1.75"
            color="app.text"
            _placeholder={{ color: "app.muted" }}
            _focusVisible={{ borderColor: "brand.200", bg: "app.surface", boxShadow: "0 0 0 4px var(--chakra-colors-brand-100)" }}
          />
          <HStack mt={2} justify="space-between" fontSize="xs" color="app.muted">
            <Text>Maximum 400 characters</Text>
            <Text>{noteDraft.length}/400</Text>
          </HStack>
        </Box>

        <HStack mt={6} flexDirection={{ base: "column-reverse", sm: "row" }} justify="end" gap={3}>
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            variant="outline"
            rounded="full"
            borderColor="app.border"
            bg="app.surface"
            color="app.text"
            px={5}
            py={2.5}
            fontSize="sm"
            fontWeight="semibold"
            _hover={{ borderColor: "app.borderStrong", bg: "app.surfaceAlt" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving || noteDraft.trim().length === 0}
            rounded="full"
            bg="brand.600"
            color="white"
            px={5}
            py={2.5}
            fontSize="sm"
            fontWeight="semibold"
            gap={2}
            shadow="sm"
            _hover={{ bg: "brand.700" }}
          >
            {isSaving ? <Loader2 size={16} /> : null}
            Save
          </Button>
        </HStack>
      </form>
    </Box>
  );
}
