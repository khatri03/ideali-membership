import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MembersFilters,
  MembersPagination,
  MembersTable,
  type MembersFilterOption,
} from "../features/membership/components";
import { fetchMembershipMembers, fetchMembershipStatusOptions } from "../lib/membershipMembers";
import { getMembershipTypes } from "../lib/membershipWizard";
import type { MembershipMemberListItem, MembershipTypeListItem } from "../types/membership";

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

  const [members, setMembers] = useState<MembershipMemberListItem[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeListItem[]>([]);
  const [isMembershipTypesLoading, setIsMembershipTypesLoading] = useState(true);
  const [membershipStatusOptions, setMembershipStatusOptions] = useState<MembersFilterOption[]>([]);
  const [isMembershipStatusesLoading, setIsMembershipStatusesLoading] = useState(true);
  const [draftMembershipStatuses, setDraftMembershipStatuses] = useState(selectedMembershipStatuses);
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

    async function loadFilterOptions() {
      setIsMembershipTypesLoading(true);
      setIsMembershipStatusesLoading(true);

      const [membershipTypesResult, membershipStatusOptionsResult] = await Promise.allSettled([
        getMembershipTypes(),
        fetchMembershipStatusOptions(),
      ]);

      if (cancelled) {
        return;
      }

      if (membershipTypesResult.status === "fulfilled") {
        setMembershipTypes(
          membershipTypesResult.value.slice().sort((left, right) => left.displayOrder - right.displayOrder),
        );
      } else {
        setMembershipTypes([]);
      }

      if (membershipStatusOptionsResult.status === "fulfilled") {
        setMembershipStatusOptions(
          membershipStatusOptionsResult.value
            .slice()
            .sort((left, right) => left.label.localeCompare(right.label)),
        );
      } else {
        setMembershipStatusOptions([]);
      }

      setIsMembershipTypesLoading(false);
      setIsMembershipStatusesLoading(false);
    }

    void loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDraftMembershipStatuses(selectedMembershipStatuses);
  }, [selectedMembershipStatusesKey]);

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
