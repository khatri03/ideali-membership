import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  MembersFilters,
  MembersPagination,
  MembersTable,
  type MembersFilterOption,
} from "../features/membership/components";
import {
  fetchMembershipMembers,
  fetchMembershipStatusOptions,
  fetchMembershipTypeOptions,
} from "../lib/membershipMembers";
import type { MembershipMemberListItem } from "../types/membership";

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

const defaultMembershipStatuses = ["Active"];

const MEMBERS_QUERY_KEYS = {
  members: "membership-members",
  membershipTypeOptions: "membership-type-options",
  membershipStatusOptions: "membership-status-options",
} as const;

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
  const selectedMembershipStatuses = useMemo(
    () => {
      const nextMembershipStatuses = normalizeUniqueIds(searchParams.getAll("membershipStatuses"));
      return nextMembershipStatuses.length > 0 ? nextMembershipStatuses : defaultMembershipStatuses;
    },
    [searchParamsKey],
  );
  const selectedMembershipStatusesKey = useMemo(
    () => normalizeUniqueIds(selectedMembershipStatuses).join("\u0000"),
    [selectedMembershipStatuses],
  );
  const pageNo = getPositiveNumber(searchParams.get("pageNo"), 1);
  const pageSize = getPositiveNumber(searchParams.get("pageSize"), 25);

  const [draftMembershipStatuses, setDraftMembershipStatuses] = useState(selectedMembershipStatuses);
  const [draftMembershipTypeUniqueIds, setDraftMembershipTypeUniqueIds] = useState<string[]>(
    selectedMembershipTypeUniqueIds,
  );
  const [draftSearchTerm, setDraftSearchTerm] = useState(selectedSearchTerm);
  const hasPendingMembershipStatusChanges = useMemo(
    () => !areUniqueIdListsEqual(draftMembershipStatuses, selectedMembershipStatuses),
    [draftMembershipStatuses, selectedMembershipStatuses],
  );
  const hasPendingMembershipTypeChanges = useMemo(
    () => !areUniqueIdListsEqual(draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds),
    [draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds],
  );
  const hasPendingSearchTermChanges = useMemo(
    () => draftSearchTerm.trim().toLowerCase() !== selectedSearchTermKey,
    [draftSearchTerm, selectedSearchTermKey],
  );

  const membershipTypeOptionsQuery = useQuery({
    queryKey: [MEMBERS_QUERY_KEYS.membershipTypeOptions],
    queryFn: fetchMembershipTypeOptions,
    staleTime: 5 * 60 * 1000,
  });

  const membershipStatusOptionsQuery = useQuery({
    queryKey: [MEMBERS_QUERY_KEYS.membershipStatusOptions],
    queryFn: fetchMembershipStatusOptions,
    staleTime: 5 * 60 * 1000,
  });

  const membersQuery = useQuery({
    queryKey: [
      MEMBERS_QUERY_KEYS.members,
      pageNo,
      pageSize,
      selectedMembershipStatusesKey,
      selectedMembershipTypeKey,
      selectedSearchTermKey,
    ],
    queryFn: () =>
      fetchMembershipMembers(
        pageNo,
        pageSize,
        selectedMembershipStatuses,
        selectedMembershipTypeUniqueIds,
        selectedSearchTerm,
      ),
    placeholderData: keepPreviousData,
  });

  const members = membersQuery.data?.pageData ?? [];
  const totalRecordsCount = membersQuery.data?.totalRecordsCount ?? 0;
  const pageCount = membersQuery.data?.pageCount ?? 0;
  const isLoading = membersQuery.isPending || membersQuery.isFetching;
  const error = membersQuery.error instanceof Error ? membersQuery.error.message : null;
  const membershipTypeOptions = membershipTypeOptionsQuery.data ?? [];
  const membershipStatusOptions = (membershipStatusOptionsQuery.data ?? []).slice().sort((left, right) => left.label.localeCompare(right.label));
  const isMembershipTypesLoading = membershipTypeOptionsQuery.isPending;
  const isMembershipStatusesLoading = membershipStatusOptionsQuery.isPending;

  useEffect(() => {
    setDraftMembershipStatuses(selectedMembershipStatuses);
  }, [selectedMembershipStatusesKey, selectedMembershipStatuses]);

  useEffect(() => {
    setDraftMembershipTypeUniqueIds(selectedMembershipTypeUniqueIds);
  }, [selectedMembershipTypeKey, selectedMembershipTypeUniqueIds]);

  useEffect(() => {
    setDraftSearchTerm(selectedSearchTerm);
  }, [selectedSearchTermKey, selectedSearchTerm]);

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
    nextParams.delete("membershipTypeUniqueId");
    nextParams.delete("membershipTypeUniqueIds");
    nextParams.delete("searchTerm");

    draftMembershipStatuses.forEach((membershipStatus) => {
      nextParams.append("membershipStatuses", membershipStatus);
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
    setDraftMembershipTypeUniqueIds(selectedMembershipTypeUniqueIds);
    setDraftSearchTerm(selectedSearchTerm);
  }

  function clearFilters() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("membershipStatuses");
    nextParams.delete("membershipTypeUniqueId");
    nextParams.delete("membershipTypeUniqueIds");
    nextParams.delete("searchTerm");
    nextParams.set("pageNo", "1");
    nextParams.set("pageSize", String(pageSize));
    setSearchParams(nextParams, { replace: true });
  }

  const hasPendingFilterChanges =
    hasPendingMembershipStatusChanges || hasPendingMembershipTypeChanges || hasPendingSearchTermChanges;

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
          draftMembershipStatuses={draftMembershipStatuses}
          draftMembershipTypeUniqueIds={draftMembershipTypeUniqueIds}
          draftSearchTerm={draftSearchTerm}
          hasPendingFilterChanges={hasPendingFilterChanges}
          isMembersFetching={isLoading}
          isMembershipTypesLoading={isMembershipTypesLoading}
          isMembershipStatusesLoading={isMembershipStatusesLoading}
          selectedMembershipStatuses={selectedMembershipStatuses}
          membershipTypeOptions={membershipTypeOptions}
          selectedMembershipTypeUniqueIds={selectedMembershipTypeUniqueIds}
          selectedSearchTerm={selectedSearchTerm}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onDraftMembershipStatusesChange={setDraftMembershipStatuses}
          onDraftMembershipTypeUniqueIdsChange={setDraftMembershipTypeUniqueIds}
          onDraftSearchTermChange={setDraftSearchTerm}
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
            <MembersTable members={members} membershipStatusOptions={membershipStatusOptions} />
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
