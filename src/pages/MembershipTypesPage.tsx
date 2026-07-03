import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { APP_ROUTES } from "../routes";
import { getMembershipTypeOrderList, getMembershipTypesPage, saveMembershipTypeOrderList } from "../lib/membershipWizard";
import { getPositiveNumber } from "../lib/parseUtils";
import type { MembershipTypeListItem, MembershipTypeOrderListItem, MembershipTypeSortBy } from "../types/membership";
import { Pagination } from "../components/shared/DataTable/Pagination";
import { MembershipTypesFilters } from "./MembershipTypesFilters";
import {
  getMembershipTypePaymentMerchantOptions,
  getMembershipTypeStatusOptions,
  getMembershipTypeTenureOptions,
  showToast,
} from "./MembershipTypesPage.helpers";
import { MembershipTypeRow, OrderConfirmModal } from "./MembershipTypesPage.parts";

type SortOrder = "asc" | "desc";

const FILTER_KEYS = {
  searchTerm: "searchTerm",
  status: "status",
  paymentMerchant: "paymentMerchant",
  tenure: "tenure",
  pageNo: "pageNo",
  pageSize: "pageSize",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
} as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function normalizeValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort();
}

function readMultiValues(searchParams: URLSearchParams, key: string) {
  return normalizeValues(searchParams.getAll(key));
}

function readSortBy(value: string | null): MembershipTypeSortBy | null {
  switch (value) {
    case "membershipName":
    case "pricing":
    case "activeMembers":
    case "pendingApprovals":
    case "tenure":
      return value;
    default:
      return null;
  }
}

function readSortOrder(value: string | null): SortOrder | null {
  if (value === "asc" || value === "desc") {
    return value;
  }

  return null;
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

function SortIcon({ active, order }: { active: boolean; order: SortOrder | null }) {
  if (!active || !order) {
    return <ArrowUpDown size={14} className="text-slate-400" />;
  }

  return order === "asc" ? <ArrowUp size={14} className="text-cyan-700" /> : <ArrowDown size={14} className="text-cyan-700" />;
}

export function MembershipTypesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const pageNo = getPositiveNumber(searchParams.get(FILTER_KEYS.pageNo), 1);
  const pageSize = getPositiveNumber(searchParams.get(FILTER_KEYS.pageSize), 25);
  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const [draftStatuses, setDraftStatuses] = useState<string[]>([]);
  const [draftPaymentMerchants, setDraftPaymentMerchants] = useState<string[]>([]);
  const [draftTenures, setDraftTenures] = useState<string[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderModalLoading, setIsOrderModalLoading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderItems, setOrderItems] = useState<MembershipTypeOrderListItem[]>([]);
  const [orderError, setOrderError] = useState("");
  const orderModalRef = useRef<HTMLDivElement>(null);

  const selectedSearchTerm = useMemo(() => searchParams.get(FILTER_KEYS.searchTerm) ?? "", [searchParamsString]);
  const selectedStatuses = useMemo(() => readMultiValues(searchParams, FILTER_KEYS.status), [searchParamsString]);
  const selectedPaymentMerchants = useMemo(
    () => readMultiValues(searchParams, FILTER_KEYS.paymentMerchant),
    [searchParamsString],
  );
  const selectedTenures = useMemo(() => readMultiValues(searchParams, FILTER_KEYS.tenure), [searchParamsString]);
  const selectedSortBy = useMemo(
    () => readSortBy(searchParams.get(FILTER_KEYS.sortBy)),
    [searchParamsString],
  );
  const selectedSortOrder = useMemo(
    () => readSortOrder(searchParams.get(FILTER_KEYS.sortOrder)),
    [searchParamsString],
  );

  const {
    data: membershipTypesPage,
    isLoading,
    error,
    refetch: refetchTypes,
  } = useQuery({
    queryKey: [
      "membership-types",
      pageNo,
      pageSize,
      selectedSearchTerm,
      selectedStatuses.join("|"),
      selectedPaymentMerchants.join("|"),
      selectedTenures.join("|"),
      selectedSortBy ?? "",
      selectedSortOrder ?? "",
    ],
    queryFn: () =>
      getMembershipTypesPage(pageNo, pageSize, {
        searchTerm: selectedSearchTerm,
        sortBy: selectedSortBy,
        sortOrder: selectedSortOrder,
        statuses: selectedStatuses,
        paymentMerchants: selectedPaymentMerchants,
        tenures: selectedTenures,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setDraftSearchTerm(selectedSearchTerm);
    setDraftStatuses(selectedStatuses);
    setDraftPaymentMerchants(selectedPaymentMerchants);
    setDraftTenures(selectedTenures);
  }, [selectedPaymentMerchants, selectedSearchTerm, selectedStatuses, selectedTenures]);

  const hasPendingFilterChanges =
    draftSearchTerm.trim() !== selectedSearchTerm.trim() ||
    normalizeValues(draftStatuses).join("|") !== selectedStatuses.join("|") ||
    normalizeValues(draftPaymentMerchants).join("|") !== selectedPaymentMerchants.join("|") ||
    normalizeValues(draftTenures).join("|") !== selectedTenures.join("|");

  const hasActiveFilters =
    selectedSearchTerm.trim().length > 0 ||
    selectedStatuses.length > 0 ||
    selectedPaymentMerchants.length > 0 ||
    selectedTenures.length > 0;

  const visibleTypes = useMemo(() => membershipTypesPage?.pageData ?? [], [membershipTypesPage?.pageData]);

  async function refreshTypes(): Promise<void> {
    await refetchTypes();
  }

  function applyFilters() {
    const nextSearchParams = buildSearchParams(searchParams, {
      [FILTER_KEYS.searchTerm]: draftSearchTerm.trim() || null,
      [FILTER_KEYS.status]: normalizeValues(draftStatuses),
      [FILTER_KEYS.paymentMerchant]: normalizeValues(draftPaymentMerchants),
      [FILTER_KEYS.tenure]: normalizeValues(draftTenures),
      [FILTER_KEYS.pageNo]: 1,
    });

    setSearchParams(nextSearchParams, { replace: true });
  }

  function clearFilters() {
    const nextSearchParams = buildSearchParams(searchParams, {
      [FILTER_KEYS.searchTerm]: null,
      [FILTER_KEYS.status]: null,
      [FILTER_KEYS.paymentMerchant]: null,
      [FILTER_KEYS.tenure]: null,
      [FILTER_KEYS.pageNo]: 1,
    });

    setSearchParams(nextSearchParams, { replace: true });
  }

  function handleSort(nextSortBy: MembershipTypeSortBy) {
    const currentSortBy = readSortBy(searchParams.get(FILTER_KEYS.sortBy));
    const currentSortOrder = readSortOrder(searchParams.get(FILTER_KEYS.sortOrder)) ?? "asc";
    const nextSortOrder: SortOrder = currentSortBy === nextSortBy && currentSortOrder === "asc" ? "desc" : "asc";

    setSearchParams(
      buildSearchParams(searchParams, {
        [FILTER_KEYS.sortBy]: nextSortBy,
        [FILTER_KEYS.sortOrder]: nextSortOrder,
        [FILTER_KEYS.pageNo]: 1,
      }),
      { replace: true },
    );
  }

  function clearSort() {
    setSearchParams(
      buildSearchParams(searchParams, {
        [FILTER_KEYS.sortBy]: null,
        [FILTER_KEYS.sortOrder]: null,
        [FILTER_KEYS.pageNo]: 1,
      }),
      { replace: true },
    );
  }

  function openOrderModal() {
    setIsOrderModalOpen(true);
  }

  function moveOrderItem(sourceUniqueId: string, targetUniqueId: string) {
    setOrderItems((currentItems) => {
      const sourceIndex = currentItems.findIndex((item) => item.uniqueId === sourceUniqueId);
      const targetIndex = currentItems.findIndex((item) => item.uniqueId === targetUniqueId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return currentItems;
      }

      return arrayMove(currentItems, sourceIndex, targetIndex);
    });
  }

  async function saveOrder() {
    if (orderItems.length === 0) {
      return;
    }

    setIsSavingOrder(true);

    try {
      await saveMembershipTypeOrderList(orderItems.map((item) => item.uniqueId));
      await refreshTypes();
      showToast("Membership order saved successfully.");
      setIsOrderModalOpen(false);
    } finally {
      setIsSavingOrder(false);
    }
  }

  useEffect(() => {
    if (!isOrderModalOpen) {
      return;
    }

    let isMounted = true;

    async function loadOrderItems() {
      setIsOrderModalLoading(true);
      setOrderError("");

      try {
        const items = await getMembershipTypeOrderList();
        if (isMounted) {
          setOrderItems(items);
        }
      } catch (loadOrderError) {
        if (isMounted) {
          setOrderError(loadOrderError instanceof Error ? loadOrderError.message : "Unable to load membership order.");
        }
      } finally {
        if (isMounted) {
          setIsOrderModalLoading(false);
        }
      }
    }

    void loadOrderItems();

    return () => {
      isMounted = false;
    };
  }, [isOrderModalOpen]);

  const statusOptions = useMemo(() => getMembershipTypeStatusOptions(), []);
  const paymentMerchantOptions = useMemo(() => getMembershipTypePaymentMerchantOptions(), []);
  const tenureOptions = useMemo(() => getMembershipTypeTenureOptions(), []);
  const totalRecordsCount = membershipTypesPage?.totalRecordsCount ?? 0;
  const pageCount = membershipTypesPage?.pageCount ?? 0;

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
            Loading membership types...
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={6} className="px-5 py-4 text-sm font-medium text-rose-700">
            {error.message || "Unable to load membership types."}
          </td>
        </tr>
      );
    }

    if (visibleTypes.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
            {hasActiveFilters ? "No membership types match the selected filters." : "No membership types found."}
          </td>
        </tr>
      );
    }

    return visibleTypes.map((item) => (
      <MembershipTypeRow key={item.value} item={item} onRefresh={refreshTypes} />
    ));
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Types</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Filter, sort, and manage membership types from a single operational view.
          </p>
        </div>

        <Link
          to={APP_ROUTES.membershipWizardTitle}
          className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Create
        </Link>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={openOrderModal}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Change order"
          title="Change order"
        >
          <ArrowUpDown className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8">
        <MembershipTypesFilters
          draftSearchTerm={draftSearchTerm}
          draftStatuses={draftStatuses}
          draftPaymentMerchants={draftPaymentMerchants}
          draftTenures={draftTenures}
          hasPendingFilterChanges={hasPendingFilterChanges}
          isLoading={isLoading}
          selectedSearchTerm={selectedSearchTerm}
          selectedStatuses={selectedStatuses}
          selectedPaymentMerchants={selectedPaymentMerchants}
          selectedTenures={selectedTenures}
          statusOptions={statusOptions}
          paymentMerchantOptions={paymentMerchantOptions}
          tenureOptions={tenureOptions}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onDraftSearchTermChange={setDraftSearchTerm}
          onDraftStatusesChange={setDraftStatuses}
          onDraftPaymentMerchantsChange={setDraftPaymentMerchants}
          onDraftTenuresChange={setDraftTenures}
        />

        {selectedSortBy ? (
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={clearSort}
              title="Clear current sort"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-cyan-100"
            >
              <X size={14} />
              Clear Sort
            </button>
          </div>
        ) : null}

        <div className="overflow-visible rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100/80">
                <tr>
                  <th
                    scope="col"
                    className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    Actions
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("membershipName")}
                      aria-sort={selectedSortBy === "membershipName" ? (selectedSortOrder === "desc" ? "descending" : "ascending") : "none"}
                      className="inline-flex w-full items-center gap-1.5"
                      title={selectedSortBy === "membershipName" ? "Toggle membership name sort" : "Sort by membership name"}
                    >
                      Membership Type
                      <SortIcon
                        active={selectedSortBy === "membershipName"}
                        order={selectedSortBy === "membershipName" ? selectedSortOrder : null}
                      />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("pricing")}
                      aria-sort={selectedSortBy === "pricing" ? (selectedSortOrder === "desc" ? "descending" : "ascending") : "none"}
                      className="inline-flex w-full items-center justify-end gap-1.5"
                      title={selectedSortBy === "pricing" ? "Toggle pricing sort" : "Sort by pricing"}
                    >
                      Pricing
                      <SortIcon active={selectedSortBy === "pricing"} order={selectedSortBy === "pricing" ? selectedSortOrder : null} />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("activeMembers")}
                      aria-sort={selectedSortBy === "activeMembers" ? (selectedSortOrder === "desc" ? "descending" : "ascending") : "none"}
                      className="inline-flex w-full items-center justify-center gap-1.5"
                      title={selectedSortBy === "activeMembers" ? "Toggle active member sort" : "Sort by active members"}
                    >
                      Active Members
                      <SortIcon active={selectedSortBy === "activeMembers"} order={selectedSortBy === "activeMembers" ? selectedSortOrder : null} />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("pendingApprovals")}
                      aria-sort={selectedSortBy === "pendingApprovals" ? (selectedSortOrder === "desc" ? "descending" : "ascending") : "none"}
                      className="inline-flex w-full items-center justify-center gap-1.5"
                      title={selectedSortBy === "pendingApprovals" ? "Toggle pending approval sort" : "Sort by pending approvals"}
                    >
                      Pending Approvals
                      <SortIcon
                        active={selectedSortBy === "pendingApprovals"}
                        order={selectedSortBy === "pendingApprovals" ? selectedSortOrder : null}
                      />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleSort("tenure")}
                      aria-sort={selectedSortBy === "tenure" ? (selectedSortOrder === "desc" ? "descending" : "ascending") : "none"}
                      className="inline-flex w-full items-center gap-1.5"
                      title={selectedSortBy === "tenure" ? "Toggle tenure sort" : "Sort by tenure"}
                    >
                      Tenure
                      <SortIcon active={selectedSortBy === "tenure"} order={selectedSortBy === "tenure" ? selectedSortOrder : null} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">{renderTableBody()}</tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <Pagination
            currentPage={pageNo}
            pageSize={pageSize}
            totalPages={pageCount > 0 ? pageCount : Math.ceil(totalRecordsCount / pageSize)}
            totalItems={totalRecordsCount}
            onPageChange={(nextPage) => {
              setSearchParams(
                buildSearchParams(searchParams, {
                  [FILTER_KEYS.pageNo]: nextPage,
                  [FILTER_KEYS.pageSize]: pageSize,
                }),
                { replace: true },
              );
            }}
            onPageSizeChange={(nextPageSize) => {
              setSearchParams(
                buildSearchParams(searchParams, {
                  [FILTER_KEYS.pageNo]: 1,
                  [FILTER_KEYS.pageSize]: nextPageSize,
                }),
                { replace: true },
              );
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>

      {isOrderModalOpen ? (
        <OrderConfirmModal
          onCancel={() => setIsOrderModalOpen(false)}
          modalRef={orderModalRef}
          isLoading={isOrderModalLoading}
          items={orderItems}
          error={orderError}
          isSaving={isSavingOrder}
          onMoveItem={moveOrderItem}
          onSave={saveOrder}
        />
      ) : null}
    </section>
  );
}
