import { useDeferredValue, useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  EyeOff,
  Filter,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import { Link } from "react-router-dom";
import { APP_ROUTES, buildMembershipPollCreatePath } from "../../../app/router/routes";
import type { PollAudienceType, PollStatus } from "../../../types/polls";
import { POLL_API_ROUTES } from "../../../types/pollsApi";
import {
  buildSamplePolls,
  fetchOrganizerPolls,
  fetchOrganizerPollQuestionTypes,
  FALLBACK_POLL_QUESTION_TYPES,
  getPollAudienceCopy,
  getPollStatusTone,
  getPollQuestionTypeChoices,
  POLL_PAGE_ROUTE_SUMMARY,
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

function PollTypeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
      {label}
    </span>
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
  const samplePolls = buildSamplePolls();
  const [searchText, setSearchText] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<PollAudienceType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<PollStatus | "All">("All");
  const deferredSearchText = useDeferredValue(searchText);

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
  const questionTypesQuery = useQuery({
    queryKey: ["polls", "organizer", "question-types"],
    queryFn: ({ signal }) => fetchOrganizerPollQuestionTypes(signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const organizerPolls = organizerPollsQuery.data?.items ?? [];

  const summary = useMemo(() => {
    const total = organizerPollsQuery.data?.totalRecordsCount ?? organizerPolls.length;
    const published = organizerPolls.filter((poll) => poll.status === "Published").length;
    const membersOnly = organizerPolls.filter((poll) => poll.audienceType === "MembersOnly").length;

    return { total, published, membersOnly };
  }, [organizerPolls, organizerPollsQuery.data?.totalRecordsCount]);

  const pollTypeChoices = useMemo(
    () =>
      questionTypesQuery.data?.length
        ? getPollQuestionTypeChoices(questionTypesQuery.data)
        : questionTypesQuery.isError
          ? getPollQuestionTypeChoices(FALLBACK_POLL_QUESTION_TYPES)
          : [],
    [questionTypesQuery.data, questionTypesQuery.isError],
  );
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
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Polls MVP surface
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Polls belong to the organizer, can be public or members only, and stay hidden
                when the current user is not eligible. That keeps the experience clean and avoids
                revealing locked content.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                Phase 3/5
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Best-practice hardening
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Hidden-by-default access
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={buildMembershipPollCreatePath()}
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Create poll
            </Link>
            <Link
              to={APP_ROUTES.membershipDashboard}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              Back to dashboard
            </Link>
            <span className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white">
              Live route: {POLL_API_ROUTES.organizer.list}
            </span>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <EyeOff className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Access
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Render only when eligible</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Members-only polls are hidden from ineligible users. Public polls are visible to
            everyone, including anonymous visitors.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Eligibility
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Checked on read and vote</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            We check access when rendering the poll and again when the vote is submitted. That is
            the safer pattern for a membership product.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Filter className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Filters
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Searchable organizer list</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Search, audience, and status filters are wired to the backend contract so the list
            can grow without changing the page shape.
          </p>
        </div>
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

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Core types
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              First-wave poll formats
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">
              {POLL_PAGE_ROUTE_SUMMARY.organizerRouteCount} organizer routes
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {POLL_PAGE_ROUTE_SUMMARY.publicRouteCount} public routes
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {questionTypesQuery.isLoading && pollTypeChoices.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Loading question types from the backend...
            </div>
          ) : (
            pollTypeChoices.map((choice) => (
              <article
                key={choice.value}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-white"
              >
                <div className="space-y-2">
                  <PollTypeChip label={choice.label} />
                  <h3 className="text-lg font-semibold text-slate-900">{choice.label}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{choice.description}</p>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
            MVP preview
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Sample polls we are keeping around for design review
          </h2>

          <div className="mt-6 space-y-4">
            {samplePolls.map((poll) => (
              <div key={poll.uniqueId} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{poll.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{poll.description}</p>
                  </div>
                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      getPollStatusTone(poll.status),
                    ].join(" ")}
                  >
                    {poll.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    {getPollAudienceCopy(poll.audienceType)}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    {poll.questionCount} questions
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    {poll.voteCount} votes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
            Delivery rules
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            What the frontend is now enforcing
          </h2>

          <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
            <li className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
              Organizer polls stay in the organizer surface.
            </li>
            <li className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
              Public polls render only when the backend says they are eligible.
            </li>
            <li className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
              Members-only polls remain hidden for ineligible users instead of showing a locked shell.
            </li>
            <li className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
              Duplicate voting is treated as a product rule, not a UI convenience.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
