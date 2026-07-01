import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Search,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buildMembershipPollCreatePath, buildMembershipPollEditPath } from "../../../app/router/routes";
import type { PollAudienceType, PollStatus } from "../../../types/polls";
import {
  fetchOrganizerPolls,
  getPollAudienceCopy,
  getPollStatusTone,
} from "../lib";

const PAGE_SIZE = 8;

const AUDIENCE_FILTERS: Array<{ label: string; value: PollAudienceType | "All" }> = [
  { label: "All audiences", value: "All" },
  { label: "Public", value: "Public" },
  { label: "Members only", value: "MembersOnly" },
];

const STATUS_FILTERS: Array<{ label: string; value: PollStatus | "All" }> = [
  { label: "All statuses", value: "All" },
  { label: "Draft", value: "Draft" },
  { label: "Published", value: "Published" },
  { label: "Closed", value: "Closed" },
  { label: "Archived", value: "Archived" },
];

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function PollRowActions({ pollUniqueId }: { pollUniqueId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      setIsOpen(true);
      return;
    }

    const gap = 8;
    const menuWidth = 176;
    const menuHeight = 52;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + gap && spaceAbove > menuHeight + gap;

    setMenuPosition({
      top: openUpward ? Math.max(gap, rect.top - menuHeight - gap) : rect.bottom + gap,
      left: Math.max(gap, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - gap)),
    });
    setIsOpen(true);
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={openMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open actions for poll ${pollUniqueId}`}
        title="Actions"
      >
        <DotsIcon />
      </button>

      {isOpen && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[1200] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <Link
                to={buildMembershipPollEditPath(pollUniqueId)}
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Edit
              </Link>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </div>
  );
}

export function PollsPage() {
  const [searchText, setSearchText] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<PollAudienceType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<PollStatus | "All">("All");
  const deferredSearchText = searchText;

  const organizerPollsQuery = useQuery({
    queryKey: ["polls", "organizer", deferredSearchText, audienceFilter, statusFilter],
    queryFn: ({ signal }) =>
      fetchOrganizerPolls(
        {
          pageNo: 1,
          pageSize: PAGE_SIZE,
          searchText: deferredSearchText,
          audienceType: audienceFilter === "All" ? null : audienceFilter,
          status: statusFilter === "All" ? null : statusFilter,
        },
        signal,
      ),
  });
  const organizerPolls = organizerPollsQuery.data?.items ?? [];

  const summary = useMemo(() => {
    const total = organizerPollsQuery.data?.totalRecordsCount ?? organizerPolls.length;
    const published = organizerPolls.filter((poll) => poll.status === "Published").length;
    const membersOnly = organizerPolls.filter((poll) => poll.audienceType === "MembersOnly").length;

    return { total, published, membersOnly };
  }, [organizerPolls, organizerPollsQuery.data?.totalRecordsCount]);

  const hasFilters = searchText.trim().length > 0 || audienceFilter !== "All" || statusFilter !== "All";
  const isEmptyState = !organizerPollsQuery.isLoading && organizerPolls.length === 0;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Organizer polls
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={buildMembershipPollCreatePath()}
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Create poll
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BarChart3}
          label="Total polls"
          value={String(summary.total)}
          hint="Organizer-owned polls returned from the live endpoint."
        />
        <MetricCard
          icon={Sparkles}
          label="Published"
          value={String(summary.published)}
          hint="Only published polls are eligible for public rendering."
        />
        <MetricCard
          icon={Users}
          label="Members only"
          value={String(summary.membersOnly)}
          hint="These remain hidden unless the current user is eligible."
        />
        <MetricCard
          icon={Vote}
          label="Vote integrity"
          value="1 vote"
          hint="Authenticated or anonymous identity, but never more than once."
        />
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Organizer list
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Polls currently returned by the API
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:min-w-[44rem]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search polls"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="sr-only">Audience filter</span>
              <select
                value={audienceFilter}
                onChange={(event) => setAudienceFilter(event.target.value as PollAudienceType | "All")}
                className="w-full bg-transparent text-sm text-slate-900 outline-none"
              >
                {AUDIENCE_FILTERS.map((filter) => (
                  <option key={filter.label} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="sr-only">Status filter</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as PollStatus | "All")}
                className="w-full bg-transparent text-sm text-slate-900 outline-none"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.label} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
          {organizerPollsQuery.isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              Loading polls from the backend...
            </div>
          ) : organizerPollsQuery.isError ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-rose-700">Unable to load polls.</p>
              <p className="mt-2 text-sm text-slate-600">
                The frontend is wired to the live contract. Check the API connection and reload.
              </p>
            </div>
          ) : isEmptyState ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-slate-900">No polls found.</p>
              <p className="mt-2 text-sm text-slate-600">
                {hasFilters
                  ? "Try clearing filters to see the full organizer list."
                  : "Create the first poll from the organizer create screen."}
              </p>
              <div className="mt-5">
                <Link
                  to={buildMembershipPollCreatePath()}
                  className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  Create poll
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Actions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Poll
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Audience
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Questions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Votes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Access rule
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {organizerPolls.map((poll) => (
                    <tr key={poll.uniqueId}>
                      <td className="px-4 py-4 align-top">
                        <PollRowActions pollUniqueId={poll.uniqueId} />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-900">{poll.title}</p>
                          <p className="max-w-xl text-sm leading-6 text-slate-500">
                            {poll.description || "No description provided yet."}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                              {poll.requiredMembershipTypeUniqueIds.length > 0
                                ? `${poll.requiredMembershipTypeUniqueIds.length} membership${poll.requiredMembershipTypeUniqueIds.length > 1 ? "s" : ""} mapped`
                                : "Public open"}
                            </span>
                            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                              {poll.startsAtUtc ? "Scheduled" : "No start window"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {getPollAudienceCopy(poll.audienceType)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {poll.requiredMembershipTypeUniqueIds.length > 0
                              ? "Visible only to eligible members"
                              : "Visible to everyone"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            getPollStatusTone(poll.status),
                          ].join(" ")}
                        >
                          {poll.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">
                        {poll.questionCount}
                      </td>
                      <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">
                        {poll.voteCount}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm text-slate-600">
                          {poll.audienceType === "MembersOnly"
                            ? "Hidden if the current user is not eligible."
                            : "Shown to all visitors, but still protected from duplicate votes."}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
