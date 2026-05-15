import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MultiSelectInput } from "../components/inputs/MultiSelectInput/MultiSelectInput";
import { MembersPagination, MembersTable } from "../features/membership/components";
import { fetchMembershipMembers } from "../lib/membershipMembers";
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
  const pageNo = getPositiveNumber(searchParams.get("pageNo"), 1);
  const pageSize = getPositiveNumber(searchParams.get("pageSize"), 25);

  const [members, setMembers] = useState<MembershipMemberListItem[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeListItem[]>([]);
  const [isMembershipTypesLoading, setIsMembershipTypesLoading] = useState(true);
  const [draftMembershipTypeUniqueIds, setDraftMembershipTypeUniqueIds] = useState<string[]>(
    selectedMembershipTypeUniqueIds,
  );
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasPendingMembershipTypeChanges = useMemo(
    () => !areUniqueIdListsEqual(draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds),
    [draftMembershipTypeUniqueIds, selectedMembershipTypeUniqueIds],
  );
  const canApplyMembershipTypes = hasPendingMembershipTypeChanges && draftMembershipTypeUniqueIds.length > 0;
  const pendingMembershipTypeCount = hasPendingMembershipTypeChanges
    ? draftMembershipTypeUniqueIds.length
    : 0;

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
    setDraftMembershipTypeUniqueIds(selectedMembershipTypeUniqueIds);
  }, [selectedMembershipTypeKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchMembershipMembers(
          pageNo,
          pageSize,
          selectedMembershipTypeUniqueIds,
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
  }, [pageNo, pageSize, selectedMembershipTypeKey]);

  const summaryLabel = useMemo(() => {
    if (isLoading) {
      return "Loading members...";
    }

    if (totalRecordsCount === 0) {
      return "No members found";
    }

    const startRecord = (pageNo - 1) * pageSize + 1;
    const endRecord = Math.min(pageNo * pageSize, totalRecordsCount);
    return `Showing ${startRecord}-${endRecord} of ${totalRecordsCount} member${totalRecordsCount === 1 ? "" : "s"}`;
  }, [isLoading, pageNo, pageSize, totalRecordsCount]);

  const selectedMembershipTypeItems = useMemo(
    () =>
      selectedMembershipTypeUniqueIds
        .map((value) => membershipTypes.find((item) => item.value === value))
        .filter((item): item is MembershipTypeListItem => Boolean(item)),
    [membershipTypes, selectedMembershipTypeUniqueIds],
  );

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

  function applyMembershipTypes(nextMembershipTypeUniqueIds: string[]) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("pageNo", "1");
    nextParams.set("pageSize", String(pageSize));
    nextParams.delete("membershipTypeUniqueId");
    nextParams.delete("membershipTypeUniqueIds");

    nextMembershipTypeUniqueIds.forEach((membershipTypeUniqueId) => {
      nextParams.append("membershipTypeUniqueIds", membershipTypeUniqueId);
    });

    setSearchParams(nextParams, { replace: true });
  }

  function applyDraftMembershipTypes() {
    applyMembershipTypes(draftMembershipTypeUniqueIds);
  }

  function resetDraftMembershipTypes() {
    setDraftMembershipTypeUniqueIds(selectedMembershipTypeUniqueIds);
  }

  function removeMembershipType(nextMembershipTypeUniqueId: string) {
    applyMembershipTypes(
      selectedMembershipTypeUniqueIds.filter((value) => value !== nextMembershipTypeUniqueId),
    );
  }

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
        <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Filter by Membership Types
            </label>
            <MultiSelectInput
              value={draftMembershipTypeUniqueIds}
              onChange={setDraftMembershipTypeUniqueIds}
              options={membershipTypeOptions}
              placeholder="All membership types"
              isDisabled={isMembershipTypesLoading}
              className="w-full"
              inputId="membership-type-filter"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={applyDraftMembershipTypes}
                disabled={!canApplyMembershipTypes}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                Apply filter
              </button>
              {hasPendingMembershipTypeChanges ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  {pendingMembershipTypeCount} pending
                </span>
              ) : null}
              {selectedMembershipTypeUniqueIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => applyMembershipTypes([])}
                  className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
                >
                  Clear filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetDraftMembershipTypes}
                disabled={!hasPendingMembershipTypeChanges}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset changes
              </button>
            </div>
          </div>
        </div>

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
