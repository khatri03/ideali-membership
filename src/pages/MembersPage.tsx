import {
  MembersFilters,
  MembersPagination,
  MembersTable,
} from "../features/membership/components";
import { useMembersPage } from "./MembersPage.hooks";

export function MembersPage() {
  const {
    members,
    totalRecordsCount,
    pageCount,
    pageNo,
    pageSize,
    isLoading,
    error,
    membershipTypeOptions,
    membershipStatusOptions,
    isMembershipTypesLoading,
    isMembershipStatusesLoading,
    selectedMembershipStatuses,
    selectedMembershipTypeUniqueIds,
    selectedSearchTerm,
    selectedSortBy,
    selectedSortOrder,
    draftMembershipStatuses,
    draftMembershipTypeUniqueIds,
    draftSearchTerm,
    hasPendingFilterChanges,
    setDraftMembershipStatuses,
    setDraftMembershipTypeUniqueIds,
    setDraftSearchTerm,
    updatePage,
    updatePageSize,
    applyFilters,
    clearFilters,
    clearSort,
    handleSort,
  } = useMembersPage();

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
            <MembersTable
              members={members}
              membershipStatusOptions={membershipStatusOptions}
              sortBy={selectedSortBy}
              sortOrder={selectedSortOrder}
              onSort={handleSort}
              onClearSort={clearSort}
            />
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
