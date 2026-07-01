import { useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Star,
  Users,
  Vote,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipPollEditPath } from "../../../app/router/routes";
import { formatUtcToLocalDateTime } from "../../../lib/dateTime";
import type { OrganizerPollDetail, OrganizerPollQuestion, PollQuestionType } from "../../../types/polls";
import { fetchOrganizerPollDetail, getPollAudienceCopy, getPollStatusTone, revertOrganizerPollToDraft } from "../lib";
import {
  getPollQuestionTypeChoice,
  usesPollMatrix,
  usesPollOptionList,
} from "../lib/pollQuestionTypes";

function QuestionTypeIcon({ questionType, className }: { questionType: PollQuestionType; className?: string }) {
  const choice = getPollQuestionTypeChoice(questionType);
  const Icon = choice.icon;
  return <Icon className={className} />;
}

function PollQuestionCard({ question }: { question: OrganizerPollQuestion }) {
  const questionTypeChoice = getPollQuestionTypeChoice(question.questionType);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Question {question.displayOrder}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">{question.text}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <QuestionTypeIcon questionType={question.questionType} className="h-4 w-4 text-cyan-700" />
              {questionTypeChoice.label}
            </span>
            {question.isRequired ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Required
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                Optional
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {question.questionType === "YesNo" ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
              Yes
            </div>
            <div className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
              No
            </div>
          </div>
        ) : usesPollMatrix(question.questionType) ? (
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
            <div
              className="grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
              style={{ gridTemplateColumns: `minmax(0, 1.2fr) repeat(${Math.max(question.matrixColumns.length, 1)}, minmax(0, 1fr))` }}
            >
              <div className="px-3 py-3">Row</div>
              {question.matrixColumns.map((column) => (
                <div key={column.uniqueId} className="px-3 py-3 text-center">
                  {column.label}
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-200">
              {question.matrixRows.map((row) => (
                <div
                  key={row.uniqueId}
                  className="grid"
                  style={{ gridTemplateColumns: `minmax(0, 1.2fr) repeat(${Math.max(question.matrixColumns.length, 1)}, minmax(0, 1fr))` }}
                >
                  <div className="px-3 py-3 text-sm font-medium text-slate-700">{row.label}</div>
                  {question.matrixColumns.map((column) => (
                    <div key={`${row.uniqueId}-${column.uniqueId}`} className="flex items-center justify-center px-3 py-3">
                      <span className="h-4 w-4 rounded-full border border-slate-300" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : usesPollOptionList(question.questionType) ? (
          <div className="space-y-2">
            {question.options.map((option) => (
              <div key={option.uniqueId} className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                <span className="h-4 w-4 rounded-full border border-slate-300" />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        ) : question.questionType === "StarRating" ? (
          <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-sm text-slate-500">Rate this question using a 1 to 5 star scale.</p>
          </div>
        ) : question.questionType === "Nps" ? (
          <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  {index}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">NPS scale from 0 to 10.</p>
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
            {question.questionType === "OpenText" ? (
              <MessageSquareText className="mb-2 h-5 w-5 text-cyan-700" />
            ) : null}
            Free-form response.
          </div>
        )}
      </div>
    </article>
  );
}

export function PollDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pollUniqueId } = useParams<{ pollUniqueId?: string }>();

  const pollDetailQuery = useQuery({
    queryKey: ["polls", "organizer", "detail", pollUniqueId],
    queryFn: ({ signal }) => fetchOrganizerPollDetail(pollUniqueId ?? "", signal),
    enabled: Boolean(pollUniqueId),
    staleTime: 60 * 1000,
  });

  const detail = pollDetailQuery.data ?? null;
  const revertPollMutation = useMutation({
    mutationFn: (targetPollUniqueId: string) => revertOrganizerPollToDraft(targetPollUniqueId),
  });
  const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);
  const summaryLabels = useMemo(
    () => ({
      audience: detail ? getPollAudienceCopy(detail.audienceType) : "Unknown",
      status: detail?.status ?? "Draft",
      questions: detail?.questions.length ?? 0,
    }),
    [detail],
  );

  async function handleRevertToDraft() {
    if (!detail?.uniqueId) {
      return;
    }

    try {
      await revertPollMutation.mutateAsync(detail.uniqueId);
      setIsRevertConfirmOpen(false);
      setRevertError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["polls", "organizer"] }),
        queryClient.invalidateQueries({ queryKey: ["polls", "organizer", "detail", detail.uniqueId] }),
      ]);
      navigate(buildMembershipPollEditPath(detail.uniqueId));
    } catch (error) {
      setRevertError(error instanceof Error ? error.message : "Unable to revert the poll to draft.");
    }
  }

  if (pollDetailQuery.isLoading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          Loading poll detail...
        </div>
      </section>
    );
  }

  if (pollDetailQuery.isError || !detail) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Unable to load poll</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Poll detail failed</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          The backend did not return a poll detail record.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.membershipPolls)}
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Back to polls
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-6 text-slate-900 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Poll detail
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                {detail.status}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{detail.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Read-only organizer detail for the published poll.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{summaryLabels.audience}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{summaryLabels.questions} questions</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Read only</span>
            </div>
            {detail.status === "Published" ? (
              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Published poll</p>
                  <p className="text-sm leading-6 text-amber-900">
                    Revert to draft only if you need to reopen editing and the poll has no votes yet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRevertError(null);
                    setIsRevertConfirmOpen(true);
                  }}
                  disabled={revertPollMutation.isPending}
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {revertPollMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                  Revert to draft
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-none">
            <Link
              to={APP_ROUTES.membershipPolls}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to polls
            </Link>
            {detail.status === "Draft" ? (
              <Link
                to={buildMembershipPollEditPath(detail.uniqueId)}
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit poll
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailStatCard icon={Users} label="Audience" value={summaryLabels.audience} />
        <DetailStatCard icon={Vote} label="Status" value={detail.status} tone={getPollStatusTone(detail.status)} />
        <DetailStatCard
          icon={CalendarClock}
          label="Opens on"
          value={formatUtcToLocalDateTime(detail.startsAtUtc, { fallbackLabel: "Not scheduled" })}
        />
        <DetailStatCard
          icon={CalendarClock}
          label="Closes on"
          value={formatUtcToLocalDateTime(detail.endsAtUtc, { fallbackLabel: "No closing time" })}
        />
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Description" value={detail.description || "No description provided."} />
          <InfoRow label="Required memberships" value={detail.requiredMembershipTypeUniqueIds.length > 0 ? String(detail.requiredMembershipTypeUniqueIds.length) : "None"} />
          <InfoRow label="Created" value={formatUtcToLocalDateTime(detail.createdAtUtc, { includeSeconds: true })} />
          <InfoRow label="Updated" value={formatUtcToLocalDateTime(detail.updatedAtUtc, { fallbackLabel: "Never", includeSeconds: true })} />
        </div>
        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Eligibility</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {detail.isEligibleToVote
              ? "The current viewer is eligible to vote on this poll."
              : detail.eligibilityMessage || "The current viewer is not eligible to vote on this poll."}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Questions</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Poll structure</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {detail.questions.length} items
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {detail.questions.map((question) => (
            <PollQuestionCard key={question.uniqueId} question={question} />
          ))}
        </div>
      </div>
      </section>
      {isRevertConfirmOpen ? (
        <RevertPollConfirmDialog
          isBusy={revertPollMutation.isPending}
          errorMessage={revertError}
          pollTitle={detail.title}
          onCancel={() => {
            setIsRevertConfirmOpen(false);
            setRevertError(null);
          }}
          onConfirm={() => void handleRevertToDraft()}
        />
      ) : null}
    </>
  );
}

function DetailStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={["inline-flex h-11 w-11 items-center justify-center rounded-2xl", tone ?? "bg-cyan-50 text-cyan-700"].join(" ")}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function RevertPollConfirmDialog({
  isBusy,
  errorMessage,
  pollTitle,
  onCancel,
  onConfirm,
}: {
  isBusy: boolean;
  errorMessage: string | null;
  pollTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyan-950/20 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-6 shadow-2xl shadow-cyan-950/10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Confirm revert</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">Revert poll to draft?</h3>
            <p className="text-sm leading-6 text-slate-600">
              This will move <span className="font-semibold text-slate-900">{pollTitle}</span> back to draft so you can edit it again.
              If votes already exist, the backend will block the change.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Reverting a published poll is a state change. Use it only when you really need to reopen the poll for editing.
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Revert to draft
          </button>
        </div>
      </div>
    </div>
  );
}
