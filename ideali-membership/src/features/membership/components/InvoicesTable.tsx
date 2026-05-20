import { useMemo } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Box, Button, HStack, Menu, Portal, Stack, Table, Text } from "@chakra-ui/react";
import { buildMembershipInvoiceDetailPath, buildMembershipMemberDetailPath } from "../../../routes";
import {
  formatMembershipInvoiceAmount,
  formatMembershipInvoiceDateLabel,
  formatMembershipInvoicePaymentMethodLabel,
  getMembershipInvoiceStatusLabel,
  getMembershipInvoiceStatusTone,
} from "../lib/membershipInvoices";
import type { MembershipInvoiceListItem, MembershipInvoiceSortBy } from "../types/invoice";
import { StatusPill } from "../../../pages/MemberDetailPage.parts";

type InvoicesTableProps = {
  invoices: MembershipInvoiceListItem[];
  isLoading?: boolean;
  sortBy?: MembershipInvoiceSortBy;
  sortOrder?: "asc" | "desc" | null;
  onSort: (sortBy: MembershipInvoiceSortBy) => void;
  onClearSort: () => void;
};

type InvoiceTableColumn = {
  label: string;
  key?: MembershipInvoiceSortBy;
  align?: "right";
};

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" width="20" height="20" style={{ fill: "currentColor" }}>
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order: "asc" | "desc";
}) {
  if (!active) {
    return <ArrowUpDown size={14} color="var(--chakra-colors-slate-400)" />;
  }

  return order === "asc" ? (
    <ArrowUp size={14} color="var(--chakra-colors-brand-700)" />
  ) : (
    <ArrowDown size={14} color="var(--chakra-colors-brand-700)" />
  );
}

function InvoiceDetailMenu({ invoice }: { invoice: MembershipInvoiceListItem }) {
  return (
    <Menu.Root positioning={{ placement: "bottom-start", gutter: 8 }}>
      <Menu.Trigger asChild>
        <Button
          type="button"
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
          shadow="sm"
          _hover={{ borderColor: "brand.200", bg: "brand.50", color: "brand.700" }}
          aria-haspopup="menu"
          aria-label={`Open detail actions for invoice ${invoice.invoiceNo}`}
          title="Detail"
        >
          <DotsIcon />
        </Button>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW="14rem"
            rounded="xl"
            borderWidth="1px"
            borderColor="app.border"
            bg="app.surface"
            p="1.5"
            shadow="xl"
          >
            <Menu.Item
              value={`invoice-detail-${invoice.invoiceId}`}
              rounded="lg"
              px="3"
              py="2.5"
              color="app.text"
              _highlighted={{ bg: "app.surfaceAlt", color: "app.text" }}
              asChild
            >
              <Link to={buildMembershipInvoiceDetailPath(invoice.invoiceId)}>
                <Text fontSize="sm" fontWeight="medium">
                  Detail
                </Text>
              </Link>
            </Menu.Item>
            {invoice.memberUniqueId ? (
              <Menu.Item
                value={`member-profile-${invoice.memberUniqueId}`}
                rounded="lg"
                px="3"
                py="2.5"
                color="app.text"
                _highlighted={{ bg: "app.surfaceAlt", color: "app.text" }}
                asChild
              >
                <a
                  href={buildMembershipMemberDetailPath(invoice.memberUniqueId)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Text fontSize="sm" fontWeight="medium">
                    Member Profile
                  </Text>
                </a>
              </Menu.Item>
            ) : null}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

function SkeletonRow() {
  return (
    <Table.Row borderBottomWidth="1px" borderColor="app.border">
      <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
        <Box h="10" w="10" rounded="full" bg="slate.200/80" animation="pulse 1.4s ease-in-out infinite" />
      </Table.Cell>
      <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
        <Box h="4" w="24" rounded="full" bg="slate.200/80" animation="pulse 1.4s ease-in-out infinite" />
      </Table.Cell>
      <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
        <Stack gap={2}>
          <Box h="4" w="32" rounded="full" bg="slate.200/80" animation="pulse 1.4s ease-in-out infinite" />
          <Box h="3" w="40" rounded="full" bg="slate.200/70" animation="pulse 1.4s ease-in-out infinite" />
          <Box h="3" w="28" rounded="full" bg="slate.200/70" animation="pulse 1.4s ease-in-out infinite" />
        </Stack>
      </Table.Cell>
      <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
        <Box h="4" w="36" rounded="full" bg="slate.200/80" animation="pulse 1.4s ease-in-out infinite" />
      </Table.Cell>
      <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
        <Box h="6" w="28" rounded="full" bg="slate.200/80" animation="pulse 1.4s ease-in-out infinite" />
      </Table.Cell>
      <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
        <Box ml="auto" h="4" w="24" rounded="full" bg="slate.200/80" animation="pulse 1.4s ease-in-out infinite" />
      </Table.Cell>
      <Table.Cell px={4} py={4}>
        <Box ml="auto" h="8" w="24" rounded="full" bg="slate.200/80" animation="pulse 1.4s ease-in-out infinite" />
      </Table.Cell>
    </Table.Row>
  );
}

export function InvoicesTable({ invoices, isLoading = false, sortBy, sortOrder, onSort, onClearSort }: InvoicesTableProps) {
  const columns: InvoiceTableColumn[] = useMemo(
    () => [
      { label: "Invoice", key: "invoiceNumber" as const },
      { label: "Member", key: "memberName" as const },
      { label: "Status", key: "status" as const },
      { label: "Invoice Date/Time", key: "invoiceDateUtc" as const },
      { label: "Total", key: "totalAmount" as const, align: "right" as const },
    ],
    [],
  );

  function getSortTooltip(columnSortBy: MembershipInvoiceSortBy, label: string) {
    if (sortBy !== columnSortBy) {
      return `Sort by ${label}`;
    }

    if (sortOrder === "asc") {
      return `Sort by ${label} descending`;
    }

    return `Clear sort by ${label}`;
  }

  return (
    <Stack gap={3}>
      {sortBy ? (
        <Box display="flex" justifyContent="end">
          <Button
            type="button"
            onClick={onClearSort}
            title="Clear current sort"
            variant="outline"
            rounded="full"
            borderColor="brand.100"
            bg="brand.50"
            color="app.text"
            shadow="sm"
            _hover={{ bg: "brand.100", borderColor: "brand.200" }}
          >
            <HStack gap={2}>
              <X size={14} />
              <Text fontSize="sm" fontWeight="medium">
                Clear Sort
              </Text>
            </HStack>
          </Button>
        </Box>
      ) : null}

      <Box maxH="38rem" overflow="auto" rounded="app.panel" borderWidth="1px" borderColor="app.border" bg="app.surface" shadow="app.panel">
        <Table.Root aria-label="Membership invoices" minW="1120px" tableLayout="fixed">
          <Table.Header position="sticky" top="0" zIndex="1" bg="brand.50" backdropFilter="blur(8px)">
            <Table.Row borderBottomWidth="1px" borderColor="brand.100">
              <Table.ColumnHeader h="12" borderRightWidth="1px" borderColor="brand.100" px={4} textAlign="left">
                <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color="app.muted">
                  Actions
                </Text>
              </Table.ColumnHeader>
              {columns.map((column) => {
                const active = column.key ? sortBy === column.key : false;
                return (
                  <Table.ColumnHeader
                    key={column.label}
                    h="12"
                    borderRightWidth="1px"
                    borderColor="brand.100"
                    px={4}
                    textAlign={column.align === "right" ? "right" : "left"}
                  >
                    {column.key ? (
                      <Button
                        type="button"
                        onClick={() => onSort(column.key!)}
                        title={getSortTooltip(column.key!, column.label)}
                        variant="ghost"
                        display="inline-flex"
                        w="full"
                        justifyContent={column.align === "right" ? "end" : "start"}
                        gap={1.5}
                        px={0}
                        py={0}
                        fontSize="xs"
                        fontWeight="semibold"
                        letterSpacing="0.12em"
                        textTransform="uppercase"
                        color="app.muted"
                        _hover={{ color: "brand.800" }}
                      >
                        {column.label}
                        <SortIcon active={active} order={sortOrder ?? (column.key === "invoiceDateUtc" ? "desc" : "asc")} />
                      </Button>
                    ) : (
                      <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color="app.muted">
                        {column.label}
                      </Text>
                    )}
                  </Table.ColumnHeader>
                );
              })}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={`invoice-skeleton-${index}`} />)
            ) : invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <Table.Row
                  key={invoice.invoiceId}
                  borderBottomWidth="1px"
                  borderColor="app.border"
                  bg={index % 2 === 0 ? "white" : "app.surfaceAlt"}
                  _hover={{ bg: "brand.50" }}
                >
                  <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
                    <InvoiceDetailMenu invoice={invoice} />
                  </Table.Cell>
                  <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
                    <Stack gap={2}>
                      <Link
                        to={buildMembershipInvoiceDetailPath(invoice.invoiceId)}
                      style={{
                        fontWeight: 600,
                        color: "var(--chakra-colors-brand-700)",
                        textDecoration: "underline",
                        textDecorationColor: "var(--chakra-colors-brand-200)",
                        textUnderlineOffset: "4px",
                        transition: "color 0.15s ease, text-decoration-color 0.15s ease",
                      }}
                    >
                      {invoice.invoiceNo}
                    </Link>
                      <Box
                        display="inline-flex"
                        w="fit-content"
                        rounded="full"
                        borderWidth="1px"
                        borderColor="brand.100"
                        bg="brand.50"
                        px={2.5}
                        py={1}
                        fontSize="11px"
                        fontWeight="semibold"
                        color="brand.800"
                      >
                        {formatMembershipInvoicePaymentMethodLabel(invoice.paymentMethod)}
                      </Box>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
                    <Stack gap={2}>
                      <Text fontWeight="semibold" color="app.text">
                        {invoice.memberName}
                      </Text>
                      <HStack flexWrap="wrap" gap={2}>
                        <Box rounded="full" borderWidth="1px" borderColor="brand.100" bg="brand.50" px={2.5} py={1} fontSize="11px" fontWeight="semibold" color="brand.800">
                          {invoice.membershipName}
                        </Box>
                        <Box rounded="full" borderWidth="1px" borderColor="app.border" bg="app.surfaceAlt" px={2.5} py={1} fontSize="11px" fontWeight="medium" color="app.muted">
                          {invoice.memberEmail}
                        </Box>
                      </HStack>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4}>
                    <StatusPill
                      label={getMembershipInvoiceStatusLabel(invoice.invoiceStatus)}
                      tone={getMembershipInvoiceStatusTone(invoice.invoiceStatus)}
                    />
                  </Table.Cell>
                  <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4} color="app.text">
                    {formatMembershipInvoiceDateLabel(invoice.invoiceDateUtc)}
                  </Table.Cell>
                  <Table.Cell borderRightWidth="1px" borderColor="app.border" px={4} py={4} textAlign="right" fontWeight="semibold" color="app.text">
                    {formatMembershipInvoiceAmount(invoice.totalAmount, invoice.currencySymbol)}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={6} px={6} py={8} textAlign="center" color="app.muted">
                  No invoices found.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Stack>
  );
}
