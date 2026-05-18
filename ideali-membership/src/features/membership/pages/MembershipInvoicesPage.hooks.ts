import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  fetchMembershipInvoices,
  formatMembershipInvoiceAmount,
  getMembershipInvoiceStatusLabel,
  getMembershipInvoiceStatusTone,
  MEMBERSHIP_INVOICE_STATUS_OPTIONS,
} from "../lib/membershipInvoices";
import type { MembershipInvoiceSortBy, MembershipInvoiceStatus } from "../types/invoice";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const STALE_TIME_5_MIN_MS = 5 * 60 * 1000;

function readSortBy(value: string | null): MembershipInvoiceSortBy {
  switch (value) {
    case "invoiceNumber":
    case "memberName":
    case "membershipName":
    case "status":
    case "invoiceDateUtc":
    case "totalAmount":
    case "balanceAmount":
    case "lastActivityUtc":
      return value;
    default:
      return "invoiceDateUtc";
  }
}

function readSortOrder(value: string | null): "asc" | "desc" {
  return value === "desc" ? "desc" : "asc";
}

function readStatusFilter(value: string | null): MembershipInvoiceStatus | "All" {
  if (
    value === "PendingPayment"
    || value === "PartiallyPaid"
    || value === "Paid"
    || value === "Cancelled"
    || value === "Refund"
    || value === "AdjustedInSystem"
  ) {
    return value;
  }

  return "All";
}

function readPositiveNumber(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function buildSearchParams(currentSearchParams: URLSearchParams, updates: Record<string, string | number | null | undefined>) {
  const nextSearchParams = new URLSearchParams(currentSearchParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      nextSearchParams.delete(key);
      return;
    }

    nextSearchParams.set(key, String(value));
  });

  return nextSearchParams;
}

export function useMembershipInvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get("searchTerm") ?? "";
  const statusFilter = readStatusFilter(searchParams.get("status"));
  const sortBy = readSortBy(searchParams.get("sortBy"));
  const sortOrder = readSortOrder(searchParams.get("sortOrder"));
  const pageSize = readPositiveNumber(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
  const pageNo = readPositiveNumber(searchParams.get("pageNo"), 1);

  const invoicesQuery = useQuery({
    queryKey: ["membership-invoices", pageNo, pageSize, statusFilter, searchTerm, sortBy, sortOrder],
    queryFn: () => fetchMembershipInvoices(pageNo, pageSize, statusFilter, searchTerm, sortBy, sortOrder),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const invoices = invoicesQuery.data?.pageData ?? [];
  const pageCount = invoicesQuery.data?.pageCount ?? 1;
  const totalRecordsCount = invoicesQuery.data?.totalRecordsCount ?? 0;
  const safePageNo = invoicesQuery.data?.pageNo ?? pageNo;
  const safePageSize = invoicesQuery.data?.pageSize ?? pageSize;

  const summary = useMemo(() => {
    const totalBalanceDue = invoices.reduce((sum, invoice) => sum + (invoice.balanceAmount ?? 0), 0);
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const paidCount = invoices.filter((invoice) => invoice.invoiceStatus === "Paid").length;
    const pendingCount = invoices.filter((invoice) => invoice.invoiceStatus === "PendingPayment").length;

    return {
      totalBalanceDue,
      totalAmount,
      paidCount,
      pendingCount,
    };
  }, [invoices]);

  function updateSearchParams(updates: Record<string, string | number | null | undefined>) {
    setSearchParams((current) => buildSearchParams(current, updates), { replace: true });
  }

  function setSearchTerm(value: string) {
    updateSearchParams({ searchTerm: value, pageNo: 1 });
  }

  function setStatusFilter(value: MembershipInvoiceStatus | "All") {
    updateSearchParams({ status: value === "All" ? null : value, pageNo: 1 });
  }

  function setSortBy(value: MembershipInvoiceSortBy) {
    const isSameSort = sortBy === value;
    updateSearchParams({
      sortBy: value,
      sortOrder: isSameSort && sortOrder === "asc" ? "desc" : "asc",
      pageNo: 1,
    });
  }

  function setPageNo(value: number) {
    updateSearchParams({ pageNo: value });
  }

  function setPageSize(value: number) {
    updateSearchParams({ pageSize: value, pageNo: 1 });
  }

  function clearSort() {
    updateSearchParams({ sortBy: null, sortOrder: null, pageNo: 1 });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return {
    invoices,
    pageCount,
    pageNo: safePageNo,
    pageSize: safePageSize,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    summary,
    totalRecordsCount,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    membershipInvoiceStatusOptions: MEMBERSHIP_INVOICE_STATUS_OPTIONS,
    isLoading: invoicesQuery.isPending || invoicesQuery.isFetching,
    error: invoicesQuery.error instanceof Error ? invoicesQuery.error.message : null,
    getInvoiceStatusLabel: getMembershipInvoiceStatusLabel,
    getInvoiceStatusTone: getMembershipInvoiceStatusTone,
    formatMembershipInvoiceAmount,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    clearSort,
    setPageNo,
    setPageSize,
    clearFilters,
  };
}
