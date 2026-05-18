import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  fetchMembershipInvoices,
  fetchMembershipInvoiceStatusOptions,
  formatMembershipInvoiceAmount,
  getMembershipInvoiceStatusLabel,
  getMembershipInvoiceStatusTone,
  isMembershipInvoiceStatus,
} from "../lib/membershipInvoices";
import { fetchMembershipTypeOptions } from "../../../lib/membershipMembers";
import type { MembershipInvoiceSortBy, MembershipInvoiceStatus } from "../types/invoice";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const STALE_TIME_5_MIN_MS = 5 * 60 * 1000;
const MEMBERSHIP_TYPE_OPTIONS_STALE_TIME_MS = 5 * 60 * 1000;
const STALE_TIME_1_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_INVOICE_STATUS_FILTERS: MembershipInvoiceStatus[] = ["PendingPayment", "Paid"];

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

function readStatusFilters(searchParams: URLSearchParams) {
  const selectedStatuses = searchParams
    .getAll("status")
    .map((value) => value.trim())
    .filter((value): value is MembershipInvoiceStatus => isMembershipInvoiceStatus(value));

  if (selectedStatuses.length > 0) {
    return normalizeStatuses(selectedStatuses);
  }

  return DEFAULT_INVOICE_STATUS_FILTERS;
}

function readPositiveNumber(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function normalizeUniqueIds(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort();
}

function areValuesEqual(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function normalizeStatuses(values: MembershipInvoiceStatus[] | string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort() as MembershipInvoiceStatus[];
}

function areStatusListsEqual(left: MembershipInvoiceStatus[], right: MembershipInvoiceStatus[]) {
  const normalizedLeft = normalizeStatuses(left);
  const normalizedRight = normalizeStatuses(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function areUniqueIdListsEqual(left: string[], right: string[]) {
  const normalizedLeft = normalizeUniqueIds(left);
  const normalizedRight = normalizeUniqueIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function readMembershipTypeUniqueIds(searchParams: URLSearchParams) {
  const nextUniqueIds = searchParams
    .getAll("membershipTypeUniqueIds")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (nextUniqueIds.length > 0) {
    return normalizeUniqueIds(nextUniqueIds);
  }

  const legacyUniqueId = searchParams.get("membershipTypeUniqueId")?.trim();
  return legacyUniqueId ? [legacyUniqueId] : [];
}

function buildSearchParams(
  currentSearchParams: URLSearchParams,
  updates: Record<string, string | number | string[] | null | undefined>,
) {
  const nextSearchParams = new URLSearchParams(currentSearchParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      nextSearchParams.delete(key);
      return;
    }

    if (Array.isArray(value)) {
      nextSearchParams.delete(key);
      value.forEach((item) => {
        if (item.trim().length > 0) {
          nextSearchParams.append(key, item);
        }
      });
      return;
    }

    nextSearchParams.set(key, String(value));
  });

  return nextSearchParams;
}

export function useMembershipInvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const searchTerm = searchParams.get("searchTerm") ?? "";
  const selectedMembershipTypeUniqueIds = useMemo(() => readMembershipTypeUniqueIds(searchParams), [searchParamsKey]);
  const selectedStatusFilters = useMemo(() => readStatusFilters(searchParams), [searchParamsKey]);
  const sortBy = readSortBy(searchParams.get("sortBy"));
  const sortOrder = readSortOrder(searchParams.get("sortOrder"));
  const pageSize = readPositiveNumber(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
  const pageNo = readPositiveNumber(searchParams.get("pageNo"), 1);

  const [draftSearchTerm, setDraftSearchTerm] = useState(searchTerm);
  const [draftMembershipTypeUniqueIds, setDraftMembershipTypeUniqueIds] = useState<string[]>(selectedMembershipTypeUniqueIds);
  const [draftStatusFilters, setDraftStatusFilters] = useState<MembershipInvoiceStatus[]>(selectedStatusFilters);

  const hasPendingSearchTermChanges = useMemo(
    () => !areValuesEqual(draftSearchTerm, searchTerm),
    [draftSearchTerm, searchTerm, searchParamsKey],
  );

  const hasPendingMembershipTypeChanges = useMemo(
    () => !areUniqueIdListsEqual(draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds),
    [draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds, searchParamsKey],
  );

  const hasPendingStatusChanges = useMemo(
    () => !areStatusListsEqual(draftStatusFilters, selectedStatusFilters),
    [draftStatusFilters, selectedStatusFilters, searchParamsKey],
  );

  const hasPendingFilterChanges =
    hasPendingSearchTermChanges || hasPendingStatusChanges || hasPendingMembershipTypeChanges;

  const invoicesQuery = useQuery({
    queryKey: [
      "membership-invoices",
      pageNo,
      pageSize,
      selectedStatusFilters.join(","),
      searchTerm,
      selectedMembershipTypeUniqueIds.join(","),
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchMembershipInvoices(
        pageNo,
        pageSize,
        selectedStatusFilters,
        searchTerm,
        sortBy,
        sortOrder,
        selectedMembershipTypeUniqueIds,
      ),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const membershipTypeOptionsQuery = useQuery({
    queryKey: ["membership-invoice-membership-type-options"],
    queryFn: fetchMembershipTypeOptions,
    staleTime: MEMBERSHIP_TYPE_OPTIONS_STALE_TIME_MS,
  });

  const statusOptionsQuery = useQuery({
    queryKey: ["membership-invoice-status-options"],
    queryFn: fetchMembershipInvoiceStatusOptions,
    staleTime: STALE_TIME_1_HOUR_MS,
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

  useEffect(() => {
    setDraftSearchTerm(searchTerm);
  }, [searchTerm, searchParamsKey]);

  useEffect(() => {
    setDraftMembershipTypeUniqueIds(selectedMembershipTypeUniqueIds);
  }, [selectedMembershipTypeUniqueIds, searchParamsKey]);

  useEffect(() => {
    setDraftStatusFilters(selectedStatusFilters);
  }, [selectedStatusFilters, searchParamsKey]);

  function updateSearchParams(updates: Record<string, string | number | string[] | null | undefined>) {
    setSearchParams((current) => buildSearchParams(current, updates), { replace: true });
  }

  function setSearchTerm(value: string) {
    updateSearchParams({ searchTerm: value, pageNo: 1 });
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

  function applyFilters() {
    updateSearchParams({
      searchTerm: draftSearchTerm.trim() || null,
      membershipTypeUniqueIds: draftMembershipTypeUniqueIds.length > 0 ? draftMembershipTypeUniqueIds : null,
      status: draftStatusFilters.length > 0 ? draftStatusFilters : null,
      pageNo: 1,
    });
  }

  function clearFilters() {
    setDraftSearchTerm("");
    setDraftMembershipTypeUniqueIds([]);
    setDraftStatusFilters(DEFAULT_INVOICE_STATUS_FILTERS);
    updateSearchParams({
      searchTerm: null,
      membershipTypeUniqueIds: null,
      status: DEFAULT_INVOICE_STATUS_FILTERS,
      pageNo: 1,
    });
  }

  return {
    invoices,
    pageCount,
    pageNo: safePageNo,
    pageSize: safePageSize,
    searchTerm,
    selectedMembershipTypeUniqueIds,
    selectedStatusFilters,
    draftSearchTerm,
    draftMembershipTypeUniqueIds,
    draftStatusFilters,
    hasPendingFilterChanges,
    hasPendingMembershipTypeChanges,
    sortBy,
    sortOrder,
    summary,
    totalRecordsCount,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    membershipTypeOptions: membershipTypeOptionsQuery.data ?? [],
    isMembershipTypesLoading: membershipTypeOptionsQuery.isPending,
    membershipInvoiceStatusOptions: statusOptionsQuery.data ?? [],
    defaultStatusFilters: DEFAULT_INVOICE_STATUS_FILTERS,
    isLoading: invoicesQuery.isPending || invoicesQuery.isFetching,
    error: invoicesQuery.error instanceof Error ? invoicesQuery.error.message : null,
    getInvoiceStatusLabel: getMembershipInvoiceStatusLabel,
    getInvoiceStatusTone: getMembershipInvoiceStatusTone,
    formatMembershipInvoiceAmount,
    setSearchTerm,
    setDraftSearchTerm,
    setDraftMembershipTypeUniqueIds,
    setDraftStatusFilters,
    setSortBy,
    clearSort,
    setPageNo,
    setPageSize,
    applyFilters,
    clearFilters,
  };
}
