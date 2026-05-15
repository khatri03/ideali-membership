import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MembersPagination, MembersTable } from "../features/membership/components";
import { fetchMembershipMembers } from "../lib/membershipMembers";
import { getMembershipTypes } from "../lib/membershipWizard";
import type { MembershipMemberListItem, MembershipTypeListItem } from "../types/membership";

function getPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const membershipTypeUniqueId = searchParams.get("membershipTypeUniqueId");
  const pageNo = getPositiveNumber(searchParams.get("pageNo"), 1);
  const pageSize = getPositiveNumber(searchParams.get("pageSize"), 25);

  const [members, setMembers] = useState<MembershipMemberListItem[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeListItem[]>([]);
  const [isMembershipTypesLoading, setIsMembershipTypesLoading] = useState(true);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    let cancelled = false;

    async function loadMembers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchMembershipMembers(
          pageNo,
          pageSize,
          membershipTypeUniqueId,
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
  }, [membershipTypeUniqueId, pageNo, pageSize]);

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

  const selectedMembershipTypeLabel = useMemo(() => {
    if (!membershipTypeUniqueId) {
      return "All membership types";
    }

    return (
      membershipTypes.find((item) => item.value === membershipTypeUniqueId)?.text ??
      membershipTypeUniqueId
    );
  }, [membershipTypeUniqueId, membershipTypes]);

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

  function updateMembershipType(nextMembershipTypeUniqueId: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("pageNo", "1");
    nextParams.set("pageSize", String(pageSize));

    if (nextMembershipTypeUniqueId) {
      nextParams.set("membershipTypeUniqueId", nextMembershipTypeUniqueId);
    } else {
      nextParams.delete("membershipTypeUniqueId");
    }

    setSearchParams(nextParams, { replace: true });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
            <p className="text-sm font-medium text-slate-500">{summaryLabel}</p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-md">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Filter by Membership Type
            </label>
            <select
              value={membershipTypeUniqueId ?? ""}
              onChange={(event) => updateMembershipType(event.target.value)}
              disabled={isMembershipTypesLoading}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              aria-label="Filter by membership type"
            >
              <option value="">All membership types</option>
              {membershipTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.text}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                {selectedMembershipTypeLabel}
              </span>
              {membershipTypeUniqueId ? (
                <button
                  type="button"
                  onClick={() => updateMembershipType("")}
                  className="text-sm font-medium text-cyan-700 underline-offset-4 hover:underline"
                >
                  Clear filter
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
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
