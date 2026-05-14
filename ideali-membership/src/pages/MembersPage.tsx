import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DataTable } from "../components/shared/DataTable";
import type { Column } from "../components/shared/DataTable";
import { fetchMembershipMembers } from "../lib/membershipMembers";
import type { MembershipMemberListItem } from "../types/membership";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 5000];

function formatExpiry(value: string | null) {
  if (!value) {
    return "No expiry";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

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
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchMembershipMembers(pageNo, pageSize, membershipTypeUniqueId);
        if (cancelled) {
          return;
        }

        setMembers(response.pageData);
        setTotalRecordsCount(response.totalRecordsCount);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load members.");
          setMembers([]);
          setTotalRecordsCount(0);
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

  const columns: Column<MembershipMemberListItem>[] = useMemo(
    () => [
      {
        header: "Member full name",
        accessor: "memberFullName",
        headerAlign: "center",
        cellAlign: "left",
      },
      {
        header: "Active membership",
        accessor: "activeMembershipName",
        headerAlign: "center",
        cellAlign: "left",
      },
      {
        header: "Email",
        accessor: "email",
        headerAlign: "center",
        cellAlign: "left",
      },
      {
        header: "Membership expiry",
        accessor: (item) => formatExpiry(item.membershipExpiryUtc),
        headerAlign: "center",
        cellAlign: "left",
      },
    ],
    [],
  );

  const canGoPrevious = pageNo > 1 && !isLoading;
  const canGoNext = !isLoading && pageNo * pageSize < totalRecordsCount;

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
                Active member list
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Review enrolled members, their active membership, contact email, and expiry date in one place.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">{summaryLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {membershipTypeUniqueId ? (
              <span className="inline-flex items-center rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Filter applied
              </span>
            ) : null}
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
          <DataTable
            data={members}
            columns={columns}
            totalItems={totalRecordsCount}
            currentPage={pageNo}
            pageSize={pageSize}
            onPageChange={updatePage}
            onPageSizeChange={updatePageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            keyExtractor={(item) => item.uniqueId || `${item.memberFullName}-${item.email}-${item.membershipExpiryUtc ?? ""}`}
          />
        )}
      </div>
    </section>
  );
}
