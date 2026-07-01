import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, ChevronRight, Loader2, RotateCcw, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  buildMembershipPollCreatePath,
  buildMembershipPollDetailPath,
  buildMembershipPollEditPath,
} from "../../../app/router/routes";
import { showToast } from "../../../shared/components/toast/Toast";
import type { PollAudienceType, PollListSortBy, PollStatus } from "../../../types/polls";
import {
  fetchOrganizerPolls,
  getPollAudienceCopy,
  getPollStatusTone,
  updateOrganizerPollStatus,
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

type PollSortOrder = "asc" | "desc";

type PollTableColumn = {
  label: string;
  key: PollListSortBy;
  align?: "right";
};

const POLL_TABLE_COLUMNS: PollTableColumn[] = [
  { label: "Poll Name", key: "title" },
  { label: "Audience", key: "audienceType" },
  { label: "Status", key: "status" },
  { label: "Questions", key: "questionCount", align: "right" },
  { label: "Votes", key: "voteCount", align: "right" },
];

function formatPollScheduleDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(parsed);

  const lookup = new Map(parts.map((part) => [part.type, part.value] as const));
  const day = lookup.get("day");
  const month = lookup.get("month");
  const year = lookup.get("year");
  const hour = lookup.get("hour");
  const minute = lookup.get("minute");
  const dayPeriod = lookup.get("dayPeriod");

  if (!day || !month || !year || !hour || !minute || !dayPeriod) {
    return null;
  }

  return `${day}-${month}-${year} ${hour}:${minute} ${dayPeriod}`;
}

function getPollScheduleCopy(startsAtUtc: string | null, endsAtUtc: string | null) {
  if (!startsAtUtc) {
    return null;
  }

  const formattedStartsAt = formatPollScheduleDate(startsAtUtc);
  if (!formattedStartsAt) {
    return null;
  }

  if (!endsAtUtc) {
    return formattedStartsAt;
  }

  const formattedEndsAt = formatPollScheduleDate(endsAtUtc);
  if (!formattedEndsAt) {
    return formattedStartsAt;
  }

  return `${formattedStartsAt} - ${formattedEndsAt}`;
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order: PollSortOrder;
}) {
  if (!active) {
    return <ArrowUpDown size={14} className="text-slate-400" />;
  }

  return order === "asc" ? (
    <ArrowUp size={14} className="text-cyan-700" />
  ) : (
    <ArrowDown size={14} className="text-cyan-700" />
  );
}

type PollListStatusConfirmState = {
  nextStatus: "Draft" | "Published";
  pollTitle: string;
};

function PollRowActions({
  pollUniqueId,
  pollTitle,
  status,
}: {
  pollUniqueId: string;
  pollTitle: string;
  status: PollStatus;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<PollListStatusConfirmState | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const statusCloseTimerRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: (nextStatus: "Draft" | "Published") => updateOrganizerPollStatus(pollUniqueId, nextStatus),
    onSuccess: async (_, nextStatus) => {
      showToast(nextStatus === "Published" ? "Poll published." : "Poll reverted to draft.", "success");
      await queryClient.invalidateQueries({ queryKey: ["polls", "organizer"] });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Unable to update poll status.", "error");
    },
  });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target) ||
        statusRef.current?.contains(target) ||
        statusMenuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
      setIsStatusOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsStatusOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function clearStatusCloseTimer() {
    if (statusCloseTimerRef.current !== null) {
      window.clearTimeout(statusCloseTimerRef.current);
      statusCloseTimerRef.current = null;
    }
  }

  function scheduleStatusClose() {
    clearStatusCloseTimer();
    statusCloseTimerRef.current = window.setTimeout(() => {
      setIsStatusOpen(false);
    }, 120);
  }

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
    setIsStatusOpen(false);
  }

  const canChangeStatus = status === "Draft" || status === "Published";

  function openStatusMenu(targetElement: HTMLDivElement | null) {
    if (!targetElement) {
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const submenuWidth = 180;
    const submenuHeight = 96;
    const gap = 8;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    const openLeft = spaceRight < submenuWidth + gap && spaceLeft > submenuWidth + gap;

    setStatusMenuPosition({
      top: Math.max(gap, Math.min(rect.top, window.innerHeight - submenuHeight - gap)),
      left: openLeft ? rect.left - submenuWidth - gap : rect.right + gap,
    });
    setIsStatusOpen(true);
    clearStatusCloseTimer();
  }

  function requestStatusChange(nextStatus: "Draft" | "Published") {
    setIsStatusOpen(false);
    setIsOpen(false);
    setConfirmState({
      nextStatus,
      pollTitle,
    });
  }

  return (
    <>
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
                className="fixed z-[1200] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10"
                style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
              >
                <Link
                  to={status === "Published" ? buildMembershipPollDetailPath(pollUniqueId) : buildMembershipPollEditPath(pollUniqueId)}
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {status === "Published" ? "Detail" : "Edit"}
                </Link>
                {canChangeStatus ? (
                  <>
                    <div className="my-1 border-t border-slate-200" />
                    <div
                      ref={statusRef}
                      className="relative"
                      onMouseEnter={() => {
                        clearStatusCloseTimer();
                        openStatusMenu(statusRef.current);
                      }}
                      onMouseLeave={scheduleStatusClose}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-haspopup="menu"
                        aria-expanded={isStatusOpen}
                      >
                        <span className="flex items-center gap-2">Status</span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </>
                ) : null}
              </div>,
              document.body,
            )
          : null}

        {isStatusOpen && statusMenuPosition
          ? createPortal(
              <div
                ref={statusMenuRef}
                className="fixed z-[1201] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                style={{
                  top: `${statusMenuPosition.top}px`,
                  left: `${statusMenuPosition.left}px`,
                }}
                onMouseEnter={clearStatusCloseTimer}
                onMouseLeave={scheduleStatusClose}
              >
                <button
                  type="button"
                  disabled={status === "Published" || statusMutation.isPending}
                  onClick={() => {
                    if (status === "Published") {
                      return;
                    }

                    requestStatusChange("Published");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className={status === "Published" ? "text-cyan-700" : "invisible"}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  Published
                </button>

                <button
                  type="button"
                  disabled={status === "Draft" || statusMutation.isPending}
                  onClick={() => {
                    if (status === "Draft") {
                      return;
                    }

                    requestStatusChange("Draft");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className={status === "Draft" ? "text-slate-500" : "invisible"}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  Draft
                </button>
              </div>,
              document.body,
            )
          : null}
      </div>

      {confirmState ? (
        <PollListStatusConfirmDialog
          isBusy={statusMutation.isPending}
          nextStatus={confirmState.nextStatus}
          pollTitle={confirmState.pollTitle}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => {
            void statusMutation.mutateAsync(confirmState.nextStatus, {
              onSettled: () => {
                setConfirmState(null);
              },
            });
          }}
        />
      ) : null}
    </>
  );
}

function PollListStatusConfirmDialog({
  isBusy,
  nextStatus,
  pollTitle,
  onCancel,
  onConfirm,
}: {
  isBusy: boolean;
  nextStatus: "Draft" | "Published";
  pollTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDraftMode = nextStatus === "Draft";

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-cyan-950/20 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-6 shadow-2xl shadow-cyan-950/10">
        <div className="flex items-start gap-4">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              isDraftMode ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700",
            ].join(" ")}
          >
            {isDraftMode ? <RotateCcw className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div className="space-y-2">
            <p
              className={[
                "text-xs font-semibold uppercase tracking-[0.24em]",
                isDraftMode ? "text-amber-700" : "text-cyan-700",
              ].join(" ")}
            >
              {isDraftMode ? "Confirm draft" : "Confirm publish"}
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {isDraftMode ? "Move poll to draft?" : "Publish poll?"}
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              {isDraftMode ? "This will move " : "This will publish "}
              <span className="font-semibold text-slate-900">{pollTitle}</span>
              {isDraftMode
                ? " back to draft so it can be edited again."
                : " and make it visible to eligible voters."}
            </p>
          </div>
        </div>

        <div
          className={[
            "mt-6 rounded-[1.25rem] border px-4 py-3 text-sm",
            isDraftMode
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-cyan-200 bg-cyan-50 text-cyan-900",
          ].join(" ")}
        >
          {isDraftMode
            ? "If votes already exist, the backend may block the draft change."
            : "Only use publish when the poll is fully ready for live participation."}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={[
              "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
              isDraftMode
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                : "bg-cyan-600 text-white hover:bg-cyan-700",
            ].join(" ")}
          >
            {isBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isDraftMode ? (
              <RotateCcw className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isDraftMode ? "Revert to draft" : "Publish poll"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PollsPage() {
  const [searchText, setSearchText] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<PollAudienceType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<PollStatus | "All">("All");
  const [sortBy, setSortBy] = useState<PollListSortBy | null>(null);
  const [sortOrder, setSortOrder] = useState<PollSortOrder | null>(null);
  const deferredSearchText = searchText;

  const organizerPollsQuery = useQuery({
    queryKey: ["polls", "organizer", deferredSearchText, audienceFilter, statusFilter, sortBy, sortOrder],
    queryFn: ({ signal }) =>
      fetchOrganizerPolls(
        {
          pageNo: 1,
          pageSize: PAGE_SIZE,
          searchText: deferredSearchText,
          audienceType: audienceFilter === "All" ? null : audienceFilter,
          status: statusFilter === "All" ? null : statusFilter,
          sortBy,
          sortOrder,
        },
        signal,
      ),
  });
  const organizerPolls = organizerPollsQuery.data?.items ?? [];

  const hasFilters = searchText.trim().length > 0 || audienceFilter !== "All" || statusFilter !== "All";
  const isEmptyState = !organizerPollsQuery.isLoading && organizerPolls.length === 0;

  function handleSort(nextSortBy: PollListSortBy) {
    const isSameSort = sortBy === nextSortBy;
    setSortBy(nextSortBy);
    setSortOrder(isSameSort && sortOrder === "asc" ? "desc" : "asc");
  }

  function clearSort() {
    setSortBy(null);
    setSortOrder(null);
  }

  function getSortTooltip(columnSortBy: PollListSortBy, label: string) {
    if (sortBy !== columnSortBy) {
      return `Sort by ${label}`;
    }

    if (sortOrder === "asc") {
      return `Sort by ${label} descending`;
    }

    return `Clear sort by ${label}`;
  }

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

        <div className="mt-6 space-y-3">
          {sortBy ? (
            <div className="flex items-center justify-end">
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

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
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
                    {POLL_TABLE_COLUMNS.map((column) => {
                      const isActive = sortBy === column.key;
                      const ariaSort = isActive ? (sortOrder === "desc" ? "descending" : "ascending") : "none";

                      return (
                        <th
                          key={column.key}
                          aria-sort={ariaSort}
                          className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 ${column.align === "right" ? "text-right" : "text-left"}`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(column.key)}
                            title={getSortTooltip(column.key, column.label)}
                            className={`inline-flex w-full items-center gap-1.5 ${column.align === "right" ? "justify-end" : "justify-start"}`}
                          >
                            {column.label}
                            <SortIcon active={isActive} order={sortOrder ?? "asc"} />
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {organizerPolls.map((poll) => {
                    const scheduleCopy = getPollScheduleCopy(poll.startsAtUtc, poll.endsAtUtc);

                    return (
                    <tr key={poll.uniqueId}>
                      <td className="px-4 py-4 align-top">
                        <PollRowActions pollUniqueId={poll.uniqueId} pollTitle={poll.title} status={poll.status} />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-900">{poll.title}</p>
                          {scheduleCopy ? <small className="text-slate-500">{scheduleCopy}</small> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {getPollAudienceCopy(poll.audienceType)}
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
                      <td className="px-4 py-4 align-top text-right text-sm font-medium text-slate-700">
                        {poll.questionCount}
                      </td>
                      <td className="px-4 py-4 align-top text-right text-sm font-medium text-slate-700">
                        {poll.voteCount}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>

    </section>
  );
}
