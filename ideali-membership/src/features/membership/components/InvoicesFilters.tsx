import { Box, Button, Grid, Input, Stack, Text } from "@chakra-ui/react";
import { MultiSelectInput } from "../../../components/inputs/MultiSelectInput/MultiSelectInput";
import type { MembersFilterOption } from "./MembersFilters";
import type { MembershipInvoicePaymentMethod, MembershipInvoiceStatus } from "../types/invoice";

type InvoicesFiltersProps = {
  draftSearchTerm: string;
  draftMembershipTypeUniqueIds: string[];
  draftStatusFilters: MembershipInvoiceStatus[];
  draftPaymentMethodFilters: MembershipInvoicePaymentMethod[];
  draftInvoiceDateFrom: string;
  draftInvoiceDateTo: string;
  hasPendingFilterChanges: boolean;
  isMembershipTypesLoading: boolean;
  isInvoicesFetching: boolean;
  selectedSearchTerm: string;
  selectedMembershipTypeUniqueIds: string[];
  selectedStatusFilters: MembershipInvoiceStatus[];
  selectedPaymentMethodFilters: MembershipInvoicePaymentMethod[];
  selectedInvoiceDateFrom: string;
  selectedInvoiceDateTo: string;
  defaultStatusFilters: MembershipInvoiceStatus[];
  membershipTypeOptions: MembersFilterOption[];
  statusOptions: Array<{ label: string; value: MembershipInvoiceStatus }>;
  paymentMethodOptions: MembersFilterOption[];
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDraftSearchTermChange: (value: string) => void;
  onDraftMembershipTypeUniqueIdsChange: (value: string[]) => void;
  onDraftStatusFiltersChange: (value: string[]) => void;
  onDraftPaymentMethodFiltersChange: (value: string[]) => void;
  onDraftInvoiceDateFromChange: (value: string) => void;
  onDraftInvoiceDateToChange: (value: string) => void;
};

export function InvoicesFilters({
  draftSearchTerm,
  draftMembershipTypeUniqueIds,
  draftStatusFilters,
  draftPaymentMethodFilters,
  draftInvoiceDateFrom,
  draftInvoiceDateTo,
  hasPendingFilterChanges,
  isMembershipTypesLoading,
  isInvoicesFetching,
  selectedSearchTerm,
  selectedMembershipTypeUniqueIds,
  selectedStatusFilters,
  selectedPaymentMethodFilters,
  selectedInvoiceDateFrom,
  selectedInvoiceDateTo,
  defaultStatusFilters,
  membershipTypeOptions,
  statusOptions,
  paymentMethodOptions,
  onApplyFilters,
  onClearFilters,
  onDraftSearchTermChange,
  onDraftMembershipTypeUniqueIdsChange,
  onDraftStatusFiltersChange,
  onDraftPaymentMethodFiltersChange,
  onDraftInvoiceDateFromChange,
  onDraftInvoiceDateToChange,
}: InvoicesFiltersProps) {
  const normalizedSelectedMembershipTypes = [...selectedMembershipTypeUniqueIds].sort().join(",");
  const normalizedSelectedStatuses = [...selectedStatusFilters].sort().join(",");
  const normalizedSelectedPaymentMethods = [...selectedPaymentMethodFilters].sort().join(",");
  const normalizedDefaultStatuses = [...defaultStatusFilters].sort().join(",");

  return (
    <Box mb={6} rounded="app.card" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" p={4} shadow="sm">
      <Box
        as="form"
        aria-label="Filters"
        onSubmit={(event) => {
          event.preventDefault();
          if (isInvoicesFetching || !hasPendingFilterChanges) {
            return;
          }

          onApplyFilters();
        }}
      >
        <Stack gap={4}>
          <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.18em" textTransform="uppercase" color="app.subtle">
            Filters
          </Text>

          <Grid gap={4} templateColumns={{ base: "1fr", lg: "repeat(4, minmax(0, 1fr))" }}>
            <Stack gap={2}>
              <label htmlFor="invoice-search" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-app-subtle)" }}>
                Search
              </label>
              <Input
                id="invoice-search"
                value={draftSearchTerm}
                onChange={(event) => onDraftSearchTermChange(event.target.value)}
                placeholder="Invoice number, member, membership, or email"
                type="search"
                disabled={isInvoicesFetching}
                bg="app.surface"
                borderColor="app.border"
                color="app.text"
                _placeholder={{ color: "app.subtle" }}
              />
            </Stack>

            <Stack gap={2}>
              <label htmlFor="invoice-membership-type-filter" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-app-subtle)" }}>
                Membership Types
              </label>
              <MultiSelectInput
                value={draftMembershipTypeUniqueIds}
                onChange={onDraftMembershipTypeUniqueIdsChange}
                options={membershipTypeOptions}
                placeholder="All membership types"
                isDisabled={isMembershipTypesLoading || isInvoicesFetching}
                className="w-full"
                inputId="invoice-membership-type-filter"
              />
            </Stack>

            <Stack gap={2}>
              <label htmlFor="invoice-status-filter" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-app-subtle)" }}>
                Invoice Status
              </label>
              <MultiSelectInput
                value={draftStatusFilters}
                onChange={onDraftStatusFiltersChange}
                options={statusOptions}
                placeholder="Select invoice statuses"
                isDisabled={isInvoicesFetching}
                className="w-full"
                inputId="invoice-status-filter"
              />
            </Stack>

            <Stack gap={2}>
              <label htmlFor="invoice-payment-method-filter" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-app-subtle)" }}>
                Payment Methods
              </label>
              <MultiSelectInput
                value={draftPaymentMethodFilters}
                onChange={onDraftPaymentMethodFiltersChange}
                options={paymentMethodOptions}
                placeholder="All payment methods"
                isDisabled={isInvoicesFetching}
                className="w-full"
                inputId="invoice-payment-method-filter"
              />
            </Stack>
          </Grid>

          <Grid gap={4} templateColumns={{ base: "1fr", lg: "repeat(2, minmax(0, 1fr))" }}>
            <Stack gap={2}>
              <label htmlFor="invoice-date-from-filter" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-app-subtle)" }}>
                From Date
              </label>
              <Input
                id="invoice-date-from-filter"
                type="date"
                value={draftInvoiceDateFrom}
                onChange={(event) => onDraftInvoiceDateFromChange(event.target.value)}
                max={draftInvoiceDateTo || undefined}
                disabled={isInvoicesFetching}
                bg="app.surface"
                borderColor="app.border"
                color="app.text"
              />
            </Stack>

            <Stack gap={2}>
              <label htmlFor="invoice-date-to-filter" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--chakra-colors-app-subtle)" }}>
                To Date
              </label>
              <Input
                id="invoice-date-to-filter"
                type="date"
                value={draftInvoiceDateTo}
                onChange={(event) => onDraftInvoiceDateToChange(event.target.value)}
                min={draftInvoiceDateFrom || undefined}
                disabled={isInvoicesFetching}
                bg="app.surface"
                borderColor="app.border"
                color="app.text"
              />
            </Stack>
          </Grid>

          <Box display="flex" flexWrap="wrap" justifyContent="end" gap={3}>
            <Button
              type="submit"
              disabled={!hasPendingFilterChanges || isInvoicesFetching}
              colorPalette="slate"
              bg="app.text"
              color="white"
              _hover={{ bg: "slate.800" }}
            >
              {isInvoicesFetching ? "Applying..." : "Apply filter"}
            </Button>

            {selectedSearchTerm.length > 0 ||
            normalizedSelectedMembershipTypes.length > 0 ||
            normalizedSelectedStatuses !== normalizedDefaultStatuses ||
            normalizedSelectedPaymentMethods.length > 0 ||
            selectedInvoiceDateFrom.length > 0 ||
            selectedInvoiceDateTo.length > 0 ? (
              <Button
                type="button"
                onClick={onClearFilters}
                disabled={isInvoicesFetching}
                variant="outline"
                borderColor="brand.200"
                bg="brand.50"
                color="brand.800"
                _hover={{ bg: "brand.100", borderColor: "brand.300" }}
              >
                Clear filters
              </Button>
            ) : null}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
