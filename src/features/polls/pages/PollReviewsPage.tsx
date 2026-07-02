import { useMemo, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
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
import type { OrganizerPollQuestion } from "../../../types/polls";
import type { PollVoteListItem } from "../../../types/pollsApi";
import { fetchOrganizerPollDetail, fetchOrganizerPollVotes, getPollAudienceCopy, getPollStatusTone } from "../lib";
import { getPollQuestionTypeChoice, usesPollMatrix, usesPollOptionList } from "../lib/pollQuestionTypes";

export function PollReviewsPage() {
  const { pollUniqueId } = useParams<{ pollUniqueId?: string }>();

  const detailQuery = useQuery({
    queryKey: ["polls", "organizer", "detail", pollUniqueId],
    queryFn: ({ signal }) => fetchOrganizerPollDetail(pollUniqueId ?? "", signal),
    enabled: Boolean(pollUniqueId),
    staleTime: 60 * 1000,
  });

  const votesQuery = useQuery({
    queryKey: ["polls", "organizer", "votes", pollUniqueId],
    queryFn: ({ signal }) => fetchOrganizerPollVotes(pollUniqueId ?? "", signal),
    enabled: Boolean(pollUniqueId),
    staleTime: 30 * 1000,
  });

  const detail = detailQuery.data ?? null;
  const votes = votesQuery.data ?? [];

  const reviewStats = useMemo(() => {
    const authenticated = votes.filter((vote) => vote.voteIdentity.voteIdentityType === "Authenticated").length;
    const anonymous = votes.filter((vote) => vote.voteIdentity.voteIdentityType === "Anonymous").length;
    return {
      total: votes.length,
      authenticated,
      anonymous,
      questions: detail?.questions.length ?? 0,
    };
  }, [detail?.questions.length, votes]);

  if (!pollUniqueId) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Missing poll</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Poll identifier required</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Open a poll review route with a valid ID.</p>
      </section>
    );
  }

  if (detailQuery.isLoading || votesQuery.isLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          Loading poll reviews...
        </div>
      </section>
    );
  }

  if (detailQuery.isError || !detail) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Unable to load poll</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Poll review not available</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {detailQuery.error instanceof Error ? detailQuery.error.message : "The backend did not return a poll record."}
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
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <Vote size={16} />
          Open live poll
        </Link>
      </div>

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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{detail.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Review submitted responses for this poll in a structured, read-only view.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{getPollAudienceCopy(detail.audienceType)}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{reviewStats.total} responses</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{reviewStats.questions} questions</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Opens {formatUtcToLocalDateTime(detail.startsAtUtc, { fallbackLabel: "not scheduled" })}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem] lg:flex-none">
            <SummaryCard icon={Vote} label="Total responses" value={`${reviewStats.total}`} tone="cyan" />
            <SummaryCard icon={Users} label="Authenticated" value={`${reviewStats.authenticated}`} tone="emerald" />
            <SummaryCard icon={CheckCircle2} label="Anonymous" value={`${reviewStats.anonymous}`} tone="slate" />
            <SummaryCard icon={CalendarClock} label="Questions" value={`${reviewStats.questions}`} tone="rose" />
          </div>
        </div>
      </div>

      {votes.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm">
          <EmptyReviewsState />
        </div>
      ) : (
        <div className="space-y-4">
          {votes.map((vote) => (
            <PollReviewCard key={vote.uniqueId} vote={vote} questions={detail.questions} />
          ))}
        </div>
      )}
    </section>
  );
}

function PollReviewCard({
  vote,
  questions,
}: {
  vote: PollVoteListItem;
  questions: OrganizerPollQuestion[];
}) {
  const questionMap = useMemo(() => new Map(questions.map((question) => [question.uniqueId, question] as const)), [questions]);

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Submitted vote</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {formatVoteIdentity(vote)}
          </h2>
          <p className="text-sm text-slate-500">
            Submitted {formatUtcToLocalDateTime(vote.votedAtUtc, { includeSeconds: true })}
          </p>
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

      <div className="mt-6 space-y-4">
        {vote.answers.map((answer) => {
          const question = questionMap.get(answer.questionUniqueId);
          if (!question) {
            return null;
          }

          return (
            <div key={answer.questionUniqueId} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{question.text}</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-900">
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
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
            {answer.textValue}
          </span>
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

function QuestionTypeIcon({ questionType }: { questionType: OrganizerPollQuestion["questionType"] }) {
  if (questionType === "OpenText") {
    return <MessageSquareText className="h-4 w-4" />;
  }

  if (questionType === "StarRating") {
    return <Star className="h-4 w-4" />;
  }

  if (questionType === "Nps") {
    return <Table2 className="h-4 w-4" />;
  }

  return <Vote className="h-4 w-4" />;
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
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Votes submitted against this poll will appear here once participants start responding.
        </p>
      </div>
    </div>
  );
}
