import { Filter } from "lucide-react";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
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
    <Stack gap={6}>
      <Box position="relative" overflow="hidden" rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" p={6} shadow="app.panel">
        <Box position="absolute" insetY={0} right={0} display={{ base: "none", lg: "block" }} w="1/3" bgGradient="linear(to-l, brand.50, app.surface)" />
        <Stack position="relative" gap={4} maxW="3xl">
          <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.24em" textTransform="uppercase" color="brand.700">
            Membership invoicing
          </Text>
          <Heading as="h1" size={{ base: "2xl", sm: "3xl", lg: "4xl" }} letterSpacing="-0.04em" color="app.text">
            Invoice control center
          </Heading>
          <Text fontSize={{ base: "sm", sm: "md" }} lineHeight="1.8" color="app.muted">
            A live, searchable workspace for membership invoices, balances, and billing operations.
          </Text>
        </Stack>
      </Box>

      <DetailPanel
        title="Invoices"
        description="Search, filter, and sort membership invoices using a responsive operational view."
        action={
          <Button
            type="button"
            onClick={clearFilters}
            variant="outline"
            rounded="full"
            borderColor="app.border"
            bg="app.surface"
            color="app.text"
            px={4}
            py={2}
            fontSize="sm"
            fontWeight="semibold"
            gap={2}
            _hover={{ borderColor: "brand.200", bg: "brand.50", color: "brand.800" }}
          >
            <Filter size={14} />
            Clear filters
          </Button>
        }
      >
        <Stack gap={6}>
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
            <Box rounded="app.card" borderWidth="1px" borderColor="rose.200" bg="rose.50" p={4} fontSize="sm" fontWeight="medium" color="rose.700">
              {error}
            </Box>
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
                <Stack gap={3} display={{ base: "flex", lg: "none" }}>
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <Box
                        as="article"
                        key={invoice.invoiceId}
                        rounded="app.card"
                        borderWidth="1px"
                        borderColor="app.border"
                        bg="app.surface"
                        p={4}
                        shadow="sm"
                      >
                        <Box display="flex" alignItems="start" justifyContent="space-between" gap={4}>
                          <Box>
                            <a
                              href={buildMembershipInvoiceDetailPath(invoice.invoiceId)}
                              style={{
                                display: "block",
                                fontWeight: 600,
                                color: "var(--chakra-colors-brand-700)",
                                textDecoration: "underline",
                                textDecorationColor: "var(--chakra-colors-brand-100)",
                                textUnderlineOffset: "4px",
                              }}
                            >
                              {invoice.invoiceNo}
                            </a>
                            <Box mt={2} display="inline-flex" w="fit-content" rounded="full" borderWidth="1px" borderColor="brand.100" bg="brand.50" px={2.5} py={1} fontSize="11px" fontWeight="semibold" color="brand.800">
                              {invoice.paymentMethod ?? "Not available"}
                            </Box>
                            <Stack mt={2} direction="row" flexWrap="wrap" gap={2}>
                              <Box rounded="full" borderWidth="1px" borderColor="brand.100" bg="brand.50" px={2.5} py={1} fontSize="11px" fontWeight="semibold" color="brand.800">
                                {invoice.membershipName}
                              </Box>
                              <Box rounded="full" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" px={2.5} py={1} fontSize="11px" fontWeight="medium" color="app.muted">
                                {invoice.memberEmail}
                              </Box>
                            </Stack>
                          </Box>
                          <StatusPill
                            label={getInvoiceStatusLabel(invoice.invoiceStatus)}
                            tone={getInvoiceStatusTone(invoice.invoiceStatus)}
                          />
                        </Box>

                        <Box mt={4} display="grid" gap={3} gridTemplateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}>
                          <InfoTile label="Invoice Date/Time" value={formatMembershipInvoiceDateLabel(invoice.invoiceDateUtc)} />
                          <InfoTile label="Total" value={formatMembershipInvoiceAmount(invoice.totalAmount, invoice.currencySymbol)} />
                        </Box>

                        {invoice.memberUniqueId ? (
                          <a
                            href={buildMembershipMemberDetailPath(invoice.memberUniqueId)}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              marginTop: "1rem",
                              borderRadius: "9999px",
                              border: "1px solid var(--chakra-colors-app-border)",
                              background: "var(--chakra-colors-app-surface-alt)",
                              padding: "0.375rem 0.75rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--chakra-colors-app-text)",
                              transition: "all 0.15s ease",
                              textDecoration: "none",
                            }}
                          >
                            Open member profile
                          </a>
                        ) : null}
                      </Box>
                    ))
                  ) : (
                    <EmptyStatePanel
                      title="No invoices match these filters"
                      description="Try broadening the search or clearing the status filter to bring records back into view."
                    />
                  )}
                </Stack>
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
        </Stack>
      </DetailPanel>
    </Stack>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" px={4} py={3}>
      <Text fontSize="11px" fontWeight="semibold" letterSpacing="0.14em" textTransform="uppercase" color="app.muted">
        {label}
      </Text>
      <Text mt={2} fontSize="sm" fontWeight="medium" color="app.text">
        {value}
      </Text>
    </Box>
  );
}
