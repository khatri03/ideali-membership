import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquareText,
  Star,
  Table2,
  Users,
  Vote,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { buildMembershipPollDetailPath, buildPublicPollPath } from "../../../app/router/routes";
import { formatUtcToLocalDateTime } from "../../../lib/dateTime";
import type {
  OrganizerPollDetail,
  OrganizerPollQuestion,
  OrganizerPollQuestionReviewSummary,
  OrganizerPollReviewSummary,
  OrganizerPollReviewTextSample,
  PollQuestionType,
} from "../../../types/polls";
import type { PollVoteListItem } from "../../../types/pollsApi";
import {
  fetchOrganizerPollDetail,
  fetchOrganizerPollReviewSummary,
  fetchOrganizerPollVotes,
  getPollAudienceCopy,
  getPollStatusTone,
} from "../lib";
import { getPollQuestionTypeChoice, usesPollMatrix, usesPollOptionList } from "../lib/pollQuestionTypes";

export function PollReviewsPage() {
  const { pollUniqueId } = useParams<{ pollUniqueId?: string }>();
  const [isResponsesOpen, setIsResponsesOpen] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<PollQuestionType | "All">("All");

  const detailQuery = useQuery({
    queryKey: ["polls", "organizer", "detail", pollUniqueId],
    queryFn: ({ signal }) => fetchOrganizerPollDetail(pollUniqueId ?? "", signal),
    enabled: Boolean(pollUniqueId),
    staleTime: 60 * 1000,
  });

  const summaryQuery = useQuery({
    queryKey: ["polls", "organizer", "review-summary", pollUniqueId],
    queryFn: ({ signal }) => fetchOrganizerPollReviewSummary(pollUniqueId ?? "", signal),
    enabled: Boolean(pollUniqueId),
    staleTime: 30 * 1000,
  });

  const votesQuery = useQuery({
    queryKey: ["polls", "organizer", "votes", pollUniqueId],
    queryFn: ({ signal }) => fetchOrganizerPollVotes(pollUniqueId ?? "", signal),
    enabled: Boolean(pollUniqueId) && isResponsesOpen,
    staleTime: 30 * 1000,
  });

  const detail = detailQuery.data ?? null;
  const summary = summaryQuery.data ?? null;
  const votes = votesQuery.data ?? [];

  const questionMap = useMemo(() => {
    return new Map((detail?.questions ?? []).map((question) => [question.uniqueId, question] as const));
  }, [detail?.questions]);

  const availableQuestionTypes = useMemo(() => {
    const seen = new Set<PollQuestionType>();
    return (summary?.questions ?? [])
      .map((question) => question.questionType)
      .filter((questionType) => {
        if (seen.has(questionType)) {
          return false;
        }
        seen.add(questionType);
        return true;
      });
  }, [summary?.questions]);

  const filteredQuestions = useMemo(() => {
    if (!summary) {
      return [];
    }

    if (selectedQuestionType === "All") {
      return summary.questions;
    }

    return summary.questions.filter((question) => question.questionType === selectedQuestionType);
  }, [selectedQuestionType, summary]);

  if (!pollUniqueId) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Missing poll</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Poll identifier required</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Open a poll review route with a valid ID.</p>
      </section>
    );
  }

  if (detailQuery.isLoading || summaryQuery.isLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          Loading poll review...
        </div>
      </section>
    );
  }

  if (detailQuery.isError || summaryQuery.isError || !detail || !summary) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Unable to load poll</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Poll review not available</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : summaryQuery.error instanceof Error
              ? summaryQuery.error.message
              : "The backend did not return a poll review record."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={buildMembershipPollDetailPath(detail.uniqueId)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <ArrowLeft size={16} />
          Back to poll
        </Link>

        <Link
          to={buildPublicPollPath(detail.uniqueId)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <Vote size={16} />
          Open live poll
        </Link>
      </div>

      <PollReviewHero detail={detail} summary={summary} />

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Question insights</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Review by question</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              The summary view keeps the page readable while still exposing completion, distribution, and response shape at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{summary.requiredQuestionCount} required</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{summary.optionalQuestionCount} optional</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{summary.totalResponses} responses</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedQuestionType("All")}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
              selectedQuestionType === "All"
                ? "border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700",
            ].join(" ")}
            aria-pressed={selectedQuestionType === "All"}
          >
            <span>All types</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{summary.questionCount}</span>
          </button>

          {availableQuestionTypes.map((questionType) => {
            const choice = getPollQuestionTypeChoice(questionType);
            const isActive = selectedQuestionType === questionType;
            const questionCount = summary.questions.filter((question) => question.questionType === questionType).length;

            return (
              <button
                key={questionType}
                type="button"
                onClick={() => setSelectedQuestionType(questionType)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <QuestionTypeIcon questionType={questionType} className="h-4 w-4" />
                <span>{choice.label}</span>
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{questionCount}</span>
              </button>
            );
          })}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="mt-6">
            <EmptyReviewsState />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredQuestions.map((question) => (
              <QuestionSummaryCard key={question.questionUniqueId} question={question} totalResponses={summary.totalResponses} />
            ))}
          </div>
        )}
      </section>

      <details
        className="group rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm"
        onToggle={(event) => setIsResponsesOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Audit trail</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Individual submissions</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Keep this collapsed unless you need to inspect individual answers, moderation details, or edge-case feedback.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            {votesQuery.isLoading ? "Loading..." : `${summary.totalResponses} responses`}
          </span>
        </summary>

        <div className="mt-6 space-y-4">
          {votesQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
              Loading submissions...
            </div>
          ) : votesQuery.isError ? (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              Unable to load individual submissions.
            </div>
          ) : votes.length === 0 ? (
            <EmptyReviewsState />
          ) : (
            votes.map((vote) => (
              <PollResponseCard
                key={vote.uniqueId}
                vote={vote}
                questionMap={questionMap}
                selectedQuestionType={selectedQuestionType}
              />
            ))
          )}
        </div>
      </details>
    </section>
  );
}

function PollReviewHero({
  detail,
  summary,
}: {
  detail: OrganizerPollDetail;
  summary: OrganizerPollReviewSummary;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-6 shadow-xl shadow-slate-200/50">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Poll reviews
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${getPollStatusTone(detail.status)}`}>
              {detail.status}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{detail.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Enterprise review surface for submitted responses. Summary first, question analytics second, individual responses last.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{getPollAudienceCopy(detail.audienceType)}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{summary.totalResponses} responses</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{summary.questionCount} questions</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Opens {formatUtcToLocalDateTime(detail.startsAtUtc, { fallbackLabel: "not scheduled" })}
            </span>
            {detail.endsAtUtc ? (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Closes {formatUtcToLocalDateTime(detail.endsAtUtc, { fallbackLabel: "not scheduled" })}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem] lg:flex-none">
          <SummaryCard icon={Vote} label="Total responses" value={`${summary.totalResponses}`} tone="cyan" />
          <SummaryCard icon={Users} label="Authenticated" value={`${summary.authenticatedResponses}`} tone="emerald" />
          <SummaryCard icon={CheckCircle2} label="Anonymous" value={`${summary.anonymousResponses}`} tone="slate" />
          <SummaryCard icon={CalendarClock} label="Questions" value={`${summary.questionCount}`} tone="rose" />
        </div>
      </div>
    </div>
  );
}

function QuestionSummaryCard({
  question,
  totalResponses,
}: {
  question: OrganizerPollQuestionReviewSummary;
  totalResponses: number;
}) {
  const questionTypeChoice = getPollQuestionTypeChoice(question.questionType);

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">Question {question.displayOrder}</p>
          <h3 className="text-lg font-semibold text-slate-900">{question.text}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <QuestionTypeIcon questionType={question.questionType} className="h-4 w-4 text-cyan-700" />
              {questionTypeChoice.label}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${question.isRequired ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-500"}`}>
              {question.isRequired ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              {question.isRequired ? "Required" : "Optional"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:w-52">
          <StatPill label="Responses" value={`${question.responseCount}`} />
          <StatPill label="Completion" value={`${question.completionRatePercentage}%`} />
          {question.questionType === "RankedChoice" ? (
            <StatPill label="Selections" value={`${question.totalSelections}`} />
          ) : question.questionType === "Nps" ? (
            <StatPill label="NPS score" value={question.npsScore !== null ? String(question.npsScore) : "No data"} />
          ) : question.averageNumericValue !== null ? (
            <StatPill label="Average" value={`${question.averageNumericValue}`} />
          ) : (
            <StatPill label="Total selections" value={`${question.totalSelections || totalResponses}`} />
          )}
          {question.questionType === "RankedChoice" ? (
            <StatPill label="Top votes" value={`${question.optionSummaries[0]?.firstPlaceVotes ?? 0}`} />
          ) : question.questionType === "Nps" ? (
            <StatPill label="Detractors" value={`${question.npsDetractorCount}`} />
          ) : question.minimumNumericValue !== null && question.maximumNumericValue !== null ? (
            <StatPill label="Range" value={`${question.minimumNumericValue} - ${question.maximumNumericValue}`} />
          ) : (
            <StatPill label="Type" value={questionTypeChoice.label} />
          )}
        </div>
      </div>

      <div className="mt-5">
        {question.questionType === "OpenText" ? (
          <TextSamplesPanel samples={question.textSamples} />
        ) : question.questionType === "StarRating" || question.questionType === "Nps" ? (
          question.questionType === "Nps" ? <NpsSummaryPanel question={question} /> : <NumericSummaryPanel question={question} />
        ) : question.questionType === "RankedChoice" ? (
          <RankedSummaryPanel question={question} />
        ) : usesPollMatrix(question.questionType) ? (
          <MatrixSummaryPanel question={question} />
        ) : usesPollOptionList(question.questionType) || question.questionType === "YesNo" ? (
          <OptionSummaryPanel options={question.optionSummaries} />
        ) : (
          <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">No summary available.</div>
        )}
      </div>
    </article>
  );
}

function OptionSummaryPanel({
  options,
}: {
  options: OrganizerPollQuestionReviewSummary["optionSummaries"];
}) {
  if (options.length === 0) {
    return <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">No options answered yet.</div>;
  }

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.optionUniqueId ?? option.label} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{option.label}</p>
              <p className="text-xs text-slate-500">{option.count} response(s)</p>
            </div>
            <span className="text-sm font-semibold text-slate-700">{option.percentage}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${option.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MatrixSummaryPanel({
  question,
}: {
  question: OrganizerPollQuestionReviewSummary;
}) {
  if (question.matrixCellSummaries.length === 0) {
    return <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">No matrix selections captured.</div>;
  }

  const rowEntries = Array.from(
    question.matrixCellSummaries.reduce((map, cell) => {
      if (!map.has(cell.rowUniqueId)) {
        map.set(cell.rowUniqueId, cell.rowLabel);
      }
      return map;
    }, new Map<string, string>()),
  );
  const columnEntries = Array.from(
    question.matrixCellSummaries.reduce((map, cell) => {
      if (!map.has(cell.columnUniqueId)) {
        map.set(cell.columnUniqueId, cell.columnLabel);
      }
      return map;
    }, new Map<string, string>()),
  );
  const cellLookup = new Map(question.matrixCellSummaries.map((cell) => [`${cell.rowUniqueId}:${cell.columnUniqueId}`, cell] as const));

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[32rem] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
          style={{ gridTemplateColumns: `minmax(0, 1.2fr) repeat(${Math.max(columnEntries.length, 1)}, minmax(0, 1fr))` }}
        >
          <div className="px-4 py-3">Row / Column</div>
          {columnEntries.map(([columnId, columnLabel]) => (
            <div key={columnId} className="px-4 py-3 text-center">
              {columnLabel}
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-200">
          {rowEntries.map(([rowId, rowLabel]) => (
            <div
              key={rowId}
              className="grid min-w-[32rem]"
              style={{ gridTemplateColumns: `minmax(0, 1.2fr) repeat(${Math.max(columnEntries.length, 1)}, minmax(0, 1fr))` }}
            >
              <div className="px-4 py-3 text-sm font-medium text-slate-700">{rowLabel}</div>
              {columnEntries.map(([columnId]) => {
                const cell = cellLookup.get(`${rowId}:${columnId}`);
                return (
                  <div key={`${rowId}:${columnId}`} className="flex items-center justify-center px-4 py-3">
                    <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700">
                      {cell?.count ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NumericSummaryPanel({
  question,
}: {
  question: OrganizerPollQuestionReviewSummary;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <NumericPill label="Average" value={question.averageNumericValue !== null ? String(question.averageNumericValue) : "No data"} />
      <NumericPill label="Minimum" value={question.minimumNumericValue !== null ? String(question.minimumNumericValue) : "No data"} />
      <NumericPill label="Maximum" value={question.maximumNumericValue !== null ? String(question.maximumNumericValue) : "No data"} />
    </div>
  );
}

function NpsSummaryPanel({
  question,
}: {
  question: OrganizerPollQuestionReviewSummary;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <NumericPill label="NPS score" value={question.npsScore !== null ? String(question.npsScore) : "No data"} />
      <NumericPill label="Promoters" value={`${question.npsPromoterCount}`} />
      <NumericPill label="Passives" value={`${question.npsPassiveCount}`} />
      <NumericPill label="Detractors" value={`${question.npsDetractorCount}`} />
    </div>
  );
}

function RankedSummaryPanel({
  question,
}: {
  question: OrganizerPollQuestionReviewSummary;
}) {
  if (question.optionSummaries.length === 0) {
    return <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">No ranked selections captured.</div>;
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <th className="px-4 py-3">Option</th>
              <th className="px-4 py-3 text-center">Avg rank</th>
              <th className="px-4 py-3 text-center">First-place</th>
              <th className="px-4 py-3 text-right">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {question.optionSummaries.map((option, index) => (
              <tr key={option.optionUniqueId ?? option.label} className={index === 0 ? "bg-cyan-50/40" : "bg-white"}>
                <td className="px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${option.percentage}%` }} />
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                  {option.averageRankValue !== null ? option.averageRankValue : "—"}
                </td>
                <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">{option.firstPlaceVotes}</td>
                <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">{option.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TextSamplesPanel({
  samples,
}: {
  samples: OrganizerPollReviewTextSample[];
}) {
  if (samples.length === 0) {
    return <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">No text responses captured yet.</div>;
  }

  return (
    <div className="space-y-3">
      {samples.map((sample) => (
        <div key={`${sample.submittedAtUtc}-${sample.value}`} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
          <p className="text-sm leading-6 text-slate-700">{sample.value}</p>
          <p className="mt-2 text-xs text-slate-500">{formatUtcToLocalDateTime(sample.submittedAtUtc, { includeSeconds: true })}</p>
        </div>
      ))}
    </div>
  );
}

function PollResponseCard({
  vote,
  questionMap,
  selectedQuestionType,
}: {
  vote: PollVoteListItem;
  questionMap: Map<string, OrganizerPollQuestion>;
  selectedQuestionType: PollQuestionType | "All";
}) {
  const visibleAnswers = vote.answers.filter((answer) => {
    if (selectedQuestionType === "All") {
      return true;
    }

    const question = questionMap.get(answer.questionUniqueId);
    return question?.questionType === selectedQuestionType;
  });

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Submitted vote</p>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">{formatVoteIdentity(vote)}</h3>
          <p className="text-sm text-slate-500">Submitted {formatUtcToLocalDateTime(vote.votedAtUtc, { includeSeconds: true })}</p>
        </div>
        <span
          className={[
            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
            vote.voteIdentity.voteIdentityType === "Authenticated"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {vote.voteIdentity.voteIdentityType}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {visibleAnswers.map((answer) => {
          const question = questionMap.get(answer.questionUniqueId);
          if (!question) {
            return null;
          }

          return (
            <div key={answer.questionUniqueId} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{question.text}</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <QuestionTypeIcon questionType={question.questionType} />
                  {getPollQuestionTypeChoice(question.questionType).label}
                </span>
              </div>
              <div className="mt-3">
                <VoteAnswerDisplay question={question} answer={answer} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function VoteAnswerDisplay({
  question,
  answer,
}: {
  question: OrganizerPollQuestion;
  answer: PollVoteListItem["answers"][number];
}) {
  if (question.questionType === "OpenText") {
    return <p className="text-sm leading-6 text-slate-700">{answer.textValue || "No answer provided."}</p>;
  }

  if (question.questionType === "StarRating" || question.questionType === "Nps") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-900">
          <BarChart3 className="h-4 w-4 text-cyan-700" />
          {answer.numericValue ?? "—"}
        </div>
        <p className="text-sm text-slate-500">{question.questionType === "StarRating" ? "Star rating" : "NPS score"}</p>
      </div>
    );
  }

  if (question.questionType === "RankedChoice") {
    const optionLabelById = new Map(question.options.map((option) => [option.uniqueId, option.label] as const));
    return (
      <div className="space-y-2">
        {answer.optionUniqueIds.length > 0 ? (
          answer.optionUniqueIds.map((optionUniqueId, index) => (
            <div key={optionUniqueId} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700">
                {index + 1}
              </span>
              <span>{optionLabelById.get(optionUniqueId) ?? optionUniqueId}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No ranking captured.</p>
        )}
      </div>
    );
  }

  if (usesPollMatrix(question.questionType)) {
    const rowLabelById = new Map(question.matrixRows.map((row) => [row.uniqueId, row.label] as const));
    const columnLabelById = new Map(question.matrixColumns.map((column) => [column.uniqueId, column.label] as const));

    return (
      <div className="space-y-2">
        {answer.matrixSelections.length > 0 ? (
          answer.matrixSelections.map((selection) => (
            <div key={`${selection.rowUniqueId}-${selection.columnUniqueId}`} className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{rowLabelById.get(selection.rowUniqueId) ?? selection.rowUniqueId}</span>
              <span className="mx-2 text-slate-400">-</span>
              <span>{columnLabelById.get(selection.columnUniqueId) ?? selection.columnUniqueId}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No matrix selections captured.</p>
        )}
      </div>
    );
  }

  if (usesPollOptionList(question.questionType) || question.questionType === "YesNo") {
    const optionLabelById = new Map(question.options.map((option) => [option.uniqueId, option.label] as const));
    return (
      <div className="flex flex-wrap gap-2">
        {answer.optionUniqueIds.length > 0 ? (
          answer.optionUniqueIds.map((optionUniqueId) => (
            <span key={optionUniqueId} className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
              {optionLabelById.get(optionUniqueId) ?? optionUniqueId}
            </span>
          ))
        ) : question.questionType === "YesNo" && answer.textValue ? (
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">{answer.textValue}</span>
        ) : (
          <p className="text-sm text-slate-500">No answer captured.</p>
        )}
      </div>
    );
  }

  return <p className="text-sm text-slate-500">No answer captured.</p>;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "slate" | "cyan" | "emerald" | "rose";
}) {
  const toneClassName = {
    slate: "border-slate-200 bg-white text-slate-900",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${toneClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">{label}</p>
          <p className="mt-2 text-lg font-bold tracking-tight">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function NumericPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function QuestionTypeIcon({ questionType, className }: { questionType: OrganizerPollQuestion["questionType"]; className?: string }) {
  if (questionType === "OpenText") {
    return <MessageSquareText className={className ?? "h-4 w-4"} />;
  }

  if (questionType === "StarRating") {
    return <Star className={className ?? "h-4 w-4"} />;
  }

  if (questionType === "Nps") {
    return <Table2 className={className ?? "h-4 w-4"} />;
  }

  return <Vote className={className ?? "h-4 w-4"} />;
}

function formatVoteIdentity(vote: PollVoteListItem) {
  if (vote.voteIdentity.voteIdentityType === "Authenticated") {
    return "Authenticated response";
  }

  return "Anonymous response";
}

function EmptyReviewsState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">No reviews yet</h2>
        <p className="max-w-xl text-sm leading-6 text-slate-600">Votes submitted against this poll will appear here once participants start responding.</p>
      </div>
    </div>
  );
}
