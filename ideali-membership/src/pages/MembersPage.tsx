import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MembersFilters, MembersPagination, MembersTable } from "../features/membership/components";
import { fetchMembershipMembers } from "../lib/membershipMembers";
import { getMembershipTypes } from "../lib/membershipWizard";
import type { MembershipMemberListItem, MembershipTypeListItem } from "../types/membership";

const approvalStatusOptions = [
  { label: "Approved", value: "Approved" },
  { label: "Pending Approval", value: "PendingApproval" },
  { label: "Rejected", value: "Rejected" },
];

const membershipStatusOptions = [
  { label: "Active", value: "Active" },
  { label: "Pending", value: "Pending" },
  { label: "Expired", value: "Expired" },
  { label: "Near Expiry", value: "NearExpiry" },
];

function getPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeUniqueIds(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort();
}

function areUniqueIdListsEqual(left: string[], right: string[]) {
  const normalizedLeft = normalizeUniqueIds(left);
  const normalizedRight = normalizeUniqueIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const selectedMembershipTypeUniqueIds = useMemo(() => {
    const nextUniqueIds = searchParams
      .getAll("membershipTypeUniqueIds")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (nextUniqueIds.length > 0) {
      return normalizeUniqueIds(nextUniqueIds);
    }

    const legacyUniqueId = searchParams.get("membershipTypeUniqueId")?.trim();
    return legacyUniqueId ? [legacyUniqueId] : [];
  }, [searchParamsKey]);
  const selectedMembershipTypeKey = useMemo(
    () => normalizeUniqueIds(selectedMembershipTypeUniqueIds).join("\u0000"),
    [selectedMembershipTypeUniqueIds],
  );
  const selectedSearchTerm = useMemo(
    () => searchParams.get("searchTerm")?.trim() ?? "",
    [searchParamsKey],
  );
  const selectedSearchTermKey = useMemo(
    () => selectedSearchTerm.toLowerCase(),
    [selectedSearchTerm],
  );
  const selectedApprovalStatuses = useMemo(
    () => normalizeUniqueIds(searchParams.getAll("approvalStatuses")),
    [searchParamsKey],
  );
  const selectedApprovalStatusesKey = useMemo(
    () => normalizeUniqueIds(selectedApprovalStatuses).join("\u0000"),
    [selectedApprovalStatuses],
  );
  const selectedMembershipStatuses = useMemo(
    () => normalizeUniqueIds(searchParams.getAll("membershipStatuses")),
    [searchParamsKey],
  );
  const selectedMembershipStatusesKey = useMemo(
    () => normalizeUniqueIds(selectedMembershipStatuses).join("\u0000"),
    [selectedMembershipStatuses],
  );
  const pageNo = getPositiveNumber(searchParams.get("pageNo"), 1);
  const pageSize = getPositiveNumber(searchParams.get("pageSize"), 25);

  const [members, setMembers] = useState<MembershipMemberListItem[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeListItem[]>([]);
  const [isMembershipTypesLoading, setIsMembershipTypesLoading] = useState(true);
  const [draftMembershipStatuses, setDraftMembershipStatuses] = useState(selectedMembershipStatuses);
  const [draftApprovalStatuses, setDraftApprovalStatuses] = useState(selectedApprovalStatuses);
  const [draftMembershipTypeUniqueIds, setDraftMembershipTypeUniqueIds] = useState<string[]>(
    selectedMembershipTypeUniqueIds,
  );
  const [draftSearchTerm, setDraftSearchTerm] = useState(selectedSearchTerm);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasPendingMembershipStatusChanges = useMemo(
    () => !areUniqueIdListsEqual(draftMembershipStatuses, selectedMembershipStatuses),
    [draftMembershipStatuses, selectedMembershipStatuses],
  );
  const hasPendingApprovalStatusChanges = useMemo(
    () => !areUniqueIdListsEqual(draftApprovalStatuses, selectedApprovalStatuses),
    [draftApprovalStatuses, selectedApprovalStatuses],
  );
  const hasPendingMembershipTypeChanges = useMemo(
    () => !areUniqueIdListsEqual(draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds),
    [draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds],
  );
  const hasPendingSearchTermChanges = useMemo(
    () => draftSearchTerm.trim().toLowerCase() !== selectedSearchTermKey,
    [draftSearchTerm, selectedSearchTermKey],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMembershipTypes() {
      setIsMembershipTypesLoading(true);

      try {
        const items = await getMembershipTypes();
        if (!cancelled) {
          setMembershipTypes(items.slice().sort((left, right) => left.displayOrder - right.displayOrder));
        }
      } catch {
        if (!cancelled) {
          setMembershipTypes([]);
        }
      } finally {
        if (!cancelled) {
          setIsMembershipTypesLoading(false);
        }
      }
    }

    void loadMembershipTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDraftMembershipStatuses(selectedMembershipStatuses);
  }, [selectedMembershipStatusesKey]);

  useEffect(() => {
    setDraftApprovalStatuses(selectedApprovalStatuses);
  }, [selectedApprovalStatusesKey]);

  useEffect(() => {
    setDraftMembershipTypeUniqueIds(selectedMembershipTypeUniqueIds);
  }, [selectedMembershipTypeKey]);

  useEffect(() => {
    setDraftSearchTerm(selectedSearchTerm);
  }, [selectedSearchTermKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchMembershipMembers(
          pageNo,
          pageSize,
          selectedMembershipStatuses,
          selectedApprovalStatuses,
          selectedMembershipTypeUniqueIds,
          selectedSearchTerm,
        );

        if (cancelled) {
          return;
        }

        setMembers(response.pageData);
        setTotalRecordsCount(response.totalRecordsCount);
        setPageCount(response.pageCount);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load members.",
          );
          setMembers([]);
          setTotalRecordsCount(0);
          setPageCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [
    pageNo,
    pageSize,
    selectedApprovalStatusesKey,
    selectedMembershipStatusesKey,
    selectedMembershipTypeKey,
    selectedSearchTermKey,
  ]);

  const membershipTypeOptions = useMemo(
    () =>
      membershipTypes.map((item) => ({
        label: item.text,
        value: item.value,
      })),
    [membershipTypes],
  );

  function updatePage(nextPageNo: number) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("pageNo", String(nextPageNo));
    nextParams.set("pageSize", String(pageSize));
    setSearchParams(nextParams, { replace: true });
  }

  function updatePageSize(nextPageSize: number) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("pageNo", "1");
    nextParams.set("pageSize", String(nextPageSize));
    setSearchParams(nextParams, { replace: true });
  }

  function applyFilters() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("pageNo", "1");
    nextParams.set("pageSize", String(pageSize));
    nextParams.delete("membershipStatuses");
    nextParams.delete("approvalStatuses");
    nextParams.delete("membershipTypeUniqueId");
    nextParams.delete("membershipTypeUniqueIds");
    nextParams.delete("searchTerm");

    draftMembershipStatuses.forEach((membershipStatus) => {
      nextParams.append("membershipStatuses", membershipStatus);
    });

    draftApprovalStatuses.forEach((approvalStatus) => {
      nextParams.append("approvalStatuses", approvalStatus);
    });

    draftMembershipTypeUniqueIds.forEach((membershipTypeUniqueId) => {
      nextParams.append("membershipTypeUniqueIds", membershipTypeUniqueId);
    });

    const normalizedSearchTerm = draftSearchTerm.trim();
    if (normalizedSearchTerm.length > 0) {
      nextParams.set("searchTerm", normalizedSearchTerm);
    }

    setSearchParams(nextParams, { replace: true });
  }

  function resetDraftFilters() {
    setDraftMembershipStatuses(selectedMembershipStatuses);
    setDraftApprovalStatuses(selectedApprovalStatuses);
    setDraftMembershipTypeUniqueIds(selectedMembershipTypeUniqueIds);
    setDraftSearchTerm(selectedSearchTerm);
  }

  function clearFilters() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("membershipStatuses");
    nextParams.delete("approvalStatuses");
    nextParams.delete("membershipTypeUniqueId");
    nextParams.delete("membershipTypeUniqueIds");
    nextParams.delete("searchTerm");
    nextParams.set("pageNo", "1");
    nextParams.set("pageSize", String(pageSize));
    setSearchParams(nextParams, { replace: true });
  }

  const hasPendingFilterChanges =
    hasPendingMembershipStatusChanges ||
    hasPendingApprovalStatusChanges || hasPendingMembershipTypeChanges || hasPendingSearchTermChanges;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Membership members
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Registered members
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Review enrolled members, their active membership, contact email,
              and expiry date in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembersFilters
          membershipStatusOptions={membershipStatusOptions}
          approvalStatusOptions={approvalStatusOptions}
          draftMembershipStatuses={draftMembershipStatuses}
          draftApprovalStatuses={draftApprovalStatuses}
          draftMembershipTypeUniqueIds={draftMembershipTypeUniqueIds}
          draftSearchTerm={draftSearchTerm}
          hasPendingFilterChanges={hasPendingFilterChanges}
          isMembershipTypesLoading={isMembershipTypesLoading}
          selectedMembershipStatuses={selectedMembershipStatuses}
          selectedApprovalStatuses={selectedApprovalStatuses}
          membershipTypeOptions={membershipTypeOptions}
          selectedMembershipTypeUniqueIds={selectedMembershipTypeUniqueIds}
          selectedSearchTerm={selectedSearchTerm}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onDraftMembershipStatusesChange={setDraftMembershipStatuses}
          onDraftApprovalStatusesChange={setDraftApprovalStatuses}
          onDraftMembershipTypeUniqueIdsChange={setDraftMembershipTypeUniqueIds}
          onDraftSearchTermChange={setDraftSearchTerm}
          onResetChanges={resetDraftFilters}
        />

        {isLoading ? (
          <div className="grid gap-4">
            <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <MembersTable members={members} />
            <MembersPagination
              currentPage={pageNo}
              pageSize={pageSize}
              totalPages={pageCount > 0 ? pageCount : Math.ceil(totalRecordsCount / pageSize)}
              totalRecordsCount={totalRecordsCount}
              onPageChange={updatePage}
              onPageSizeChange={updatePageSize}
            />
          </div>
        )}
      </div>
    </section>
  );
}
