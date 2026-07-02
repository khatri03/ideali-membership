import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  GripVertical,
  Loader2,
  Star,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useParams } from "react-router-dom";
import { formatUtcToLocalDateTime } from "../../../lib/dateTime";
import { showToast } from "../../../shared/components/toast/Toast";
import type {
  OrganizerPollDetail,
  OrganizerPollQuestion,
  OrganizerPollVoteAnswer,
  OrganizerPollVoteMatrixSelection,
} from "../../../types/polls";
import { fetchPublicPollDetail, submitPublicPollVote } from "../lib/pollsApi";
import { usesPollMatrix, usesPollOptionList } from "../lib/pollQuestionTypes";
import { getOrCreateAnonymousPollVoteKey } from "../lib/pollVoteIdentity";
import type { PollVoteRequest, PollVoteResponse } from "../../../types/pollsApi";

type QuestionVoteDraft = {
  selectedOptionIds: string[];
  textValue: string;
  numericValue: string;
  matrixSelections: Record<string, string>;
  rankedOptionIds: string[];
};

function createQuestionVoteDraft(question: OrganizerPollQuestion): QuestionVoteDraft {
  return {
    selectedOptionIds: [],
    textValue: "",
    numericValue: "",
    matrixSelections: {},
    rankedOptionIds: [],
  };
}

function buildVoteDraft(detail: OrganizerPollDetail) {
  return Object.fromEntries(
    detail.questions.map((question) => [
      question.uniqueId,
      question.questionType === "RankedChoice"
        ? {
            ...createQuestionVoteDraft(question),
            rankedOptionIds: [],
          }
        : createQuestionVoteDraft(question),
    ]),
  ) as Record<string, QuestionVoteDraft>;
}

function useVoteDraft(detail: OrganizerPollDetail | null) {
  const [draft, setDraft] = useState<Record<string, QuestionVoteDraft>>({});
  const hydratedPollIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!detail || hydratedPollIdRef.current === detail.uniqueId) {
      return;
    }

    hydratedPollIdRef.current = detail.uniqueId;
    setDraft(buildVoteDraft(detail));
  }, [detail]);

  return [draft, setDraft] as const;
}

function buildVoteRequest(detail: OrganizerPollDetail, draft: Record<string, QuestionVoteDraft>): PollVoteRequest {
  const answers: OrganizerPollVoteAnswer[] = [];

  for (const question of detail.questions) {
    const questionDraft = draft[question.uniqueId] ?? createQuestionVoteDraft(question);

    if (question.questionType === "OpenText") {
      const textValue = questionDraft.textValue.trim();
      if (textValue.length > 0) {
        answers.push({
          questionUniqueId: question.uniqueId,
          optionUniqueIds: [],
          textValue,
          numericValue: null,
          rankValue: null,
          matrixSelections: [],
        });
      }
      continue;
    }

    if (question.questionType === "StarRating" || question.questionType === "Nps") {
      const numericValue = questionDraft.numericValue.trim();
      if (numericValue.length > 0) {
        answers.push({
          questionUniqueId: question.uniqueId,
          optionUniqueIds: [],
          textValue: null,
          numericValue: Number(numericValue),
          rankValue: null,
          matrixSelections: [],
        });
      }
      continue;
    }

    if (question.questionType === "RankedChoice") {
      if (questionDraft.rankedOptionIds.length > 0) {
        answers.push({
          questionUniqueId: question.uniqueId,
          optionUniqueIds: [...questionDraft.rankedOptionIds],
          textValue: null,
          numericValue: null,
          rankValue: null,
          matrixSelections: [],
        });
      }
      continue;
    }

    if (question.questionType === "YesNo") {
      if (question.options.length > 0) {
        if (questionDraft.selectedOptionIds.length > 0) {
          answers.push({
            questionUniqueId: question.uniqueId,
            optionUniqueIds: [...questionDraft.selectedOptionIds],
            textValue: null,
            numericValue: null,
            rankValue: null,
            matrixSelections: [],
          });
        }
      } else if (questionDraft.textValue.trim().length > 0) {
        answers.push({
          questionUniqueId: question.uniqueId,
          optionUniqueIds: [],
          textValue: questionDraft.textValue.trim(),
          numericValue: null,
          rankValue: null,
          matrixSelections: [],
        });
      }
      continue;
    }

    if (usesPollMatrix(question.questionType)) {
      const matrixSelections: OrganizerPollVoteMatrixSelection[] = Object.entries(questionDraft.matrixSelections)
        .filter(([, columnUniqueId]) => Boolean(columnUniqueId))
        .map(([rowUniqueId, columnUniqueId]) => ({
          rowUniqueId,
          columnUniqueId,
        }));

      if (matrixSelections.length > 0) {
        answers.push({
          questionUniqueId: question.uniqueId,
          optionUniqueIds: [],
          textValue: null,
          numericValue: null,
          rankValue: null,
          matrixSelections,
        });
      }
      continue;
    }

    if (usesPollOptionList(question.questionType) || question.questionType === "YesNo") {
      if (questionDraft.selectedOptionIds.length > 0) {
        answers.push({
          questionUniqueId: question.uniqueId,
          optionUniqueIds: [...questionDraft.selectedOptionIds],
          textValue: null,
          numericValue: null,
          rankValue: null,
          matrixSelections: [],
        });
      }
    }
  }

  return {
    userUniqueId: null,
    anonymousVoteKeyHash: getOrCreateAnonymousPollVoteKey(detail.uniqueId),
    answers,
  };
}

function validateVoteDraft(detail: OrganizerPollDetail, draft: Record<string, QuestionVoteDraft>) {
  for (const [index, question] of detail.questions.entries()) {
    const questionDraft = draft[question.uniqueId] ?? createQuestionVoteDraft(question);
    const questionLabel = `Question ${index + 1}`;

    if (question.questionType === "OpenText") {
      if (question.isRequired && !questionDraft.textValue.trim()) {
        return `${questionLabel} requires an answer.`;
      }
      continue;
    }

    if (question.questionType === "StarRating" || question.questionType === "Nps") {
      if (question.isRequired && questionDraft.numericValue.trim().length === 0) {
        return `${questionLabel} requires a rating.`;
      }
      continue;
    }

    if (question.questionType === "RankedChoice") {
      if (question.isRequired && questionDraft.rankedOptionIds.length === 0) {
        return `${questionLabel} requires at least one ranked option.`;
      }
      continue;
    }

    if (question.questionType === "YesNo") {
      if (question.options.length > 0) {
        if (question.isRequired && questionDraft.selectedOptionIds.length === 0) {
          return `${questionLabel} requires a selection.`;
        }
      } else if (question.isRequired && !questionDraft.textValue.trim()) {
        return `${questionLabel} requires a selection.`;
      }
      continue;
    }

    if (usesPollMatrix(question.questionType)) {
      if (question.isRequired) {
        const hasMissingSelection = question.matrixRows.some((row) => !questionDraft.matrixSelections[row.uniqueId]);
        if (hasMissingSelection) {
          return `${questionLabel} requires a selection for each row.`;
        }
      }
      continue;
    }

    if ((usesPollOptionList(question.questionType) || question.questionType === "YesNo") && question.isRequired) {
      if (questionDraft.selectedOptionIds.length === 0) {
        return `${questionLabel} requires at least one choice.`;
      }
    }
  }

  return null;
}

function isQuestionAnswered(question: OrganizerPollQuestion, draft: QuestionVoteDraft) {
  if (question.questionType === "OpenText") {
    return draft.textValue.trim().length > 0;
  }

  if (question.questionType === "StarRating" || question.questionType === "Nps") {
    return draft.numericValue.trim().length > 0;
  }

    if (question.questionType === "RankedChoice") {
      return draft.rankedOptionIds.length > 0;
    }

    if (question.questionType === "YesNo") {
      if (question.options.length > 0) {
        return draft.selectedOptionIds.length > 0;
      }

      return draft.textValue.trim().length > 0;
    }

    if (usesPollMatrix(question.questionType)) {
      return question.matrixRows.every((row) => Boolean(draft.matrixSelections[row.uniqueId]));
    }

  if (usesPollOptionList(question.questionType) || question.questionType === "YesNo") {
    return draft.selectedOptionIds.length > 0;
  }

  return false;
}

export function PollVotePage() {
  const { pollUniqueId } = useParams<{ pollUniqueId?: string }>();
  const pollQuery = useQuery({
    queryKey: ["polls", "public", pollUniqueId],
    queryFn: ({ signal }) => fetchPublicPollDetail(pollUniqueId ?? "", signal),
    enabled: Boolean(pollUniqueId),
    staleTime: 30 * 1000,
  });

  const detail = pollQuery.data ?? null;
  const [draft, setDraft] = useVoteDraft(detail);
  const [rankedConfirmedByQuestion, setRankedConfirmedByQuestion] = useState<Record<string, boolean>>({});
  const [rankedNeedsReconfirmByQuestion, setRankedNeedsReconfirmByQuestion] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedVote, setSubmittedVote] = useState<PollVoteResponse | null>(null);

  useEffect(() => {
    setFormError(null);
    setSubmittedVote(null);
    setRankedConfirmedByQuestion({});
    setRankedNeedsReconfirmByQuestion({});
  }, [detail?.uniqueId]);

  const submitVoteMutation = useMutation({
    mutationFn: (request: PollVoteRequest) => submitPublicPollVote(pollUniqueId ?? "", request),
    onSuccess: (result) => {
      setSubmittedVote(result);
      setFormError(null);
      showToast("Your vote was submitted.", "success");
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Unable to submit your vote.");
    },
  });

  const isLocked = detail ? !detail.isEligibleToVote : false;
  const blockedMessage = detail?.eligibilityMessage || "This poll is currently not available for voting.";
  const rankedDragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const voteProgress = useMemo(() => {
    if (!detail) {
      return {
        requiredAnswered: 0,
        requiredTotal: 0,
        optionalAnswered: 0,
        optionalTotal: 0,
      };
    }

    let requiredAnswered = 0;
    let optionalAnswered = 0;
    let requiredTotal = 0;
    let optionalTotal = 0;

    for (const question of detail.questions) {
      const questionDraft = draft[question.uniqueId] ?? createQuestionVoteDraft(question);
      const complete =
        isQuestionAnswered(question, questionDraft) &&
        (question.questionType !== "RankedChoice" || !questionDraft.rankedOptionIds.length || rankedConfirmedByQuestion[question.uniqueId]);

      if (question.isRequired) {
        requiredTotal += 1;
        if (complete) {
          requiredAnswered += 1;
        }
      } else {
        optionalTotal += 1;
        if (complete) {
          optionalAnswered += 1;
        }
      }
    }

    return {
      requiredAnswered,
      requiredTotal,
      optionalAnswered,
      optionalTotal,
    };
  }, [detail, draft, rankedConfirmedByQuestion]);
  const canSubmit = !isLocked && !submittedVote;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) {
      return;
    }

    const validationError = validateVoteDraft(detail, draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const pendingRankedQuestion = detail.questions.find(
      (question) =>
        question.questionType === "RankedChoice" &&
        (draft[question.uniqueId] ?? createQuestionVoteDraft(question)).rankedOptionIds.length > 0 &&
        !rankedConfirmedByQuestion[question.uniqueId],
    );
    if (pendingRankedQuestion) {
      setFormError(`Question ${detail.questions.findIndex((question) => question.uniqueId === pendingRankedQuestion.uniqueId) + 1} requires confirmation for the ranking.`);
      return;
    }

    setFormError(null);
    const request = buildVoteRequest(detail, draft);
    await submitVoteMutation.mutateAsync(request);
  }

  if (!pollUniqueId) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Missing poll</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Poll identifier required</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Open a public poll link with a valid poll ID to vote.
        </p>
      </section>
    );
  }

  if (pollQuery.isLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          Loading poll...
        </div>
      </section>
    );
  }

  if (pollQuery.isError || !detail) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Unable to load poll</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Public poll not available</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {pollQuery.error instanceof Error ? pollQuery.error.message : "The backend did not return a poll record."}
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-6 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{detail.title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                {detail.description || "Vote on the items below. Your submission will be recorded once you confirm it."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[22rem] lg:flex-none">
              <SummaryCard label="Questions" value={`${detail.questions.length}`} />
              <SummaryCard label="Your votes" value={`${detail.currentUserVoteCount}`} />
              <SummaryCard label="Eligibility" value={detail.isEligibleToVote ? "Eligible" : "Locked"} tone={detail.isEligibleToVote ? "emerald" : "rose"} />
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Vote progress</p>
            <div className="mt-4 space-y-4">
              {voteProgress.requiredTotal > 0 ? (
                <ProgressTrack
                  label="Required questions"
                  description={`${voteProgress.requiredAnswered} of ${voteProgress.requiredTotal} complete`}
                  value={voteProgress.requiredAnswered}
                  total={voteProgress.requiredTotal}
                  tone="cyan"
                />
              ) : null}

              {voteProgress.optionalTotal > 0 ? (
                <ProgressTrack
                  label="Optional questions"
                  description={`${voteProgress.optionalAnswered} of ${voteProgress.optionalTotal} complete`}
                  value={voteProgress.optionalAnswered}
                  total={voteProgress.optionalTotal}
                  tone="slate"
                />
              ) : null}
            </div>
          </div>
        </div>

        {isLocked ? (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Voting blocked</p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">You cannot vote on this poll yet</h2>
                <p className="text-sm leading-6 text-slate-700">{blockedMessage}</p>
              </div>
            </div>
          </div>
        ) : submittedVote ? (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Vote submitted</p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your response has been saved</h2>
                <p className="text-sm leading-6 text-slate-700">
                  Submitted at {formatUtcToLocalDateTime(submittedVote.submittedAtUtc, { includeSeconds: true })}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 xl:max-h-[calc(100vh-20rem)] xl:overflow-y-auto xl:pr-2">
              {detail.questions.map((question, index) => (
                <PollVoteQuestionCard
                  key={question.uniqueId}
                  question={question}
                  index={index}
                  draft={draft[question.uniqueId] ?? createQuestionVoteDraft(question)}
                  isRankedConfirmed={Boolean(rankedConfirmedByQuestion[question.uniqueId])}
                  needsRankedReconfirm={Boolean(rankedNeedsReconfirmByQuestion[question.uniqueId])}
                  onChange={(nextDraft) => {
                    setDraft((current) => ({
                      ...current,
                      [question.uniqueId]: nextDraft,
                    }));

                    if (question.questionType === "RankedChoice") {
                      if (rankedConfirmedByQuestion[question.uniqueId]) {
                        setRankedNeedsReconfirmByQuestion((currentNeeds) => ({
                          ...currentNeeds,
                          [question.uniqueId]: true,
                        }));
                      }

                      setRankedConfirmedByQuestion((currentConfirmed) => ({
                        ...currentConfirmed,
                        [question.uniqueId]: false,
                      }));
                    }
                  }}
                  onConfirmRanked={() => {
                    setRankedConfirmedByQuestion((current) => ({
                      ...current,
                      [question.uniqueId]: true,
                    }));
                    setRankedNeedsReconfirmByQuestion((current) => ({
                      ...current,
                      [question.uniqueId]: false,
                    }));
                  }}
                  rankedDragSensors={rankedDragSensors}
                />
              ))}
            </div>

            {formError ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700" aria-live="polite">
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={submitVoteMutation.isPending || !canSubmit}
                className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
              >
                {submitVoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit vote
              </button>
            </div>
          </form>
        )}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">How to vote</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
              Answer every required question before submitting.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
              Your progress updates as you go.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
              Ranked choices and matrix questions support drag and click selection.
            </li>
          </ul>
        </div>
      </aside>
    </section>
  );
}

function PollVoteQuestionCard({
  question,
  index,
  draft,
  isRankedConfirmed,
  needsRankedReconfirm,
  onChange,
  onConfirmRanked,
  rankedDragSensors,
}: {
  question: OrganizerPollQuestion;
  index: number;
  draft: QuestionVoteDraft;
  isRankedConfirmed: boolean;
  needsRankedReconfirm: boolean;
  onChange: (nextDraft: QuestionVoteDraft) => void;
  onConfirmRanked: () => void;
  rankedDragSensors: ReturnType<typeof useSensors>;
}) {
  const isOptionListQuestion = usesPollOptionList(question.questionType);
  const isAnswered = isQuestionAnswered(question, draft);

  return (
    <article
      className={[
        "rounded-[2rem] border p-5 shadow-sm transition-colors",
        isAnswered ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
            Question {index + 1}
            {question.isRequired ? <span className="ml-1 text-rose-500">*</span> : null}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{question.text}</h2>
          <p className="text-sm text-slate-500">
            {question.isRequired ? "Required question" : "Optional question"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {question.questionType === "OpenText" ? (
          <textarea
            value={draft.textValue}
            onChange={(event) => onChange({ ...draft, textValue: event.target.value })}
            rows={5}
            className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            placeholder="Type your answer here..."
          />
        ) : question.questionType === "StarRating" ? (
          <StarRatingControl
            value={draft.numericValue ? Number(draft.numericValue) : null}
            onChange={(value) => onChange({ ...draft, numericValue: value == null ? "" : String(value) })}
          />
        ) : question.questionType === "Nps" ? (
          <RatingScale
            max={10}
            min={0}
            value={draft.numericValue ? Number(draft.numericValue) : null}
            onChange={(value) => onChange({ ...draft, numericValue: value == null ? "" : String(value) })}
            labels={["0", "10"]}
          />
        ) : question.questionType === "RankedChoice" ? (
          <RankedChoiceControl
            question={question}
            value={draft.rankedOptionIds}
            isConfirmed={isRankedConfirmed}
            needsReconfirm={needsRankedReconfirm}
            onChange={(nextValue) => onChange({ ...draft, rankedOptionIds: nextValue })}
            onConfirm={() => onConfirmRanked()}
            sensors={rankedDragSensors}
          />
        ) : usesPollMatrix(question.questionType) ? (
          <MatrixVoteGrid
            question={question}
            value={draft.matrixSelections}
            onChange={(rowUniqueId, columnUniqueId) =>
              onChange({
                ...draft,
                matrixSelections: {
                  ...draft.matrixSelections,
                  [rowUniqueId]: columnUniqueId,
                },
              })
            }
          />
        ) : question.questionType === "YesNo" ? (
          <YesNoVoteControl
            question={question}
            draft={draft}
            onChange={onChange}
          />
        ) : isOptionListQuestion ? (
          <OptionVoteList
            question={question}
            value={draft.selectedOptionIds}
            multiple={question.questionType === "MultipleChoice"}
            onChange={(nextValue) => onChange({ ...draft, selectedOptionIds: nextValue })}
          />
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span>{question.isRequired ? "Required" : "Optional"}</span>
        <span className={isAnswered ? "text-emerald-700" : "text-amber-700"}>{isAnswered ? "Answered" : "Pending"}</span>
      </div>
    </article>
  );
}

function OptionVoteList({
  question,
  value,
  multiple,
  onChange,
}: {
  question: OrganizerPollQuestion;
  value: string[];
  multiple: boolean;
  onChange: (nextValue: string[]) => void;
}) {
  const selected = new Set(value);

  return (
    <div className="space-y-2">
      {question.options.map((option) => {
        const isSelected = selected.has(option.uniqueId);

        return (
          <button
            key={option.uniqueId}
            type="button"
            onClick={() => {
              if (multiple) {
                onChange(isSelected ? value.filter((item) => item !== option.uniqueId) : [...value, option.uniqueId]);
                return;
              }

              onChange([option.uniqueId]);
            }}
            className={[
              "flex w-full items-center gap-3 rounded-[1.15rem] border px-4 py-3 text-left text-sm transition",
              isSelected
                ? "border-cyan-300 bg-cyan-50 text-slate-900 shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:bg-white",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex h-5 w-5 items-center justify-center border transition",
                multiple
                  ? "rounded-md"
                  : "rounded-full",
                isSelected ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-white",
              ].join(" ")}
            >
              {multiple ? (
                <Check className={["h-3.5 w-3.5", isSelected ? "text-white" : "text-transparent"].join(" ")} />
              ) : (
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full bg-cyan-500 transition",
                    isSelected ? "scale-100" : "scale-0",
                  ].join(" ")}
                />
              )}
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function YesNoVoteControl({
  question,
  draft,
  onChange,
}: {
  question: OrganizerPollQuestion;
  draft: QuestionVoteDraft;
  onChange: (nextDraft: QuestionVoteDraft) => void;
}) {
  const yesOptionId = question.options[0]?.uniqueId ?? null;
  const noOptionId = question.options[1]?.uniqueId ?? null;
  const yesSelected = yesOptionId ? draft.selectedOptionIds.includes(yesOptionId) : draft.textValue === "Yes";
  const noSelected = noOptionId ? draft.selectedOptionIds.includes(noOptionId) : draft.textValue === "No";

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => {
          if (yesOptionId) {
            onChange({ ...draft, selectedOptionIds: [yesOptionId], textValue: "" });
            return;
          }

          onChange({ ...draft, textValue: "Yes", selectedOptionIds: [] });
        }}
        className={[
          "flex items-center justify-center gap-2 rounded-[1.15rem] border px-4 py-4 text-sm font-semibold transition",
          yesSelected
            ? "border-cyan-300 bg-cyan-50 text-slate-900 shadow-sm"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:bg-white",
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex h-5 w-5 items-center justify-center border",
            "rounded-full",
            yesSelected ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-white",
          ].join(" ")}
        >
          <span className={["h-2.5 w-2.5 rounded-full bg-cyan-500 transition", yesSelected ? "scale-100" : "scale-0"].join(" ")} />
        </span>
        Yes
      </button>
      <button
        type="button"
        onClick={() => {
          if (noOptionId) {
            onChange({ ...draft, selectedOptionIds: [noOptionId], textValue: "" });
            return;
          }

          onChange({ ...draft, textValue: "No", selectedOptionIds: [] });
        }}
        className={[
          "flex items-center justify-center gap-2 rounded-[1.15rem] border px-4 py-4 text-sm font-semibold transition",
          noSelected
            ? "border-cyan-300 bg-cyan-50 text-slate-900 shadow-sm"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:bg-white",
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex h-5 w-5 items-center justify-center border",
            "rounded-full",
            noSelected ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-white",
          ].join(" ")}
        >
          <span className={["h-2.5 w-2.5 rounded-full bg-cyan-500 transition", noSelected ? "scale-100" : "scale-0"].join(" ")} />
        </span>
        No
      </button>
    </div>
  );
}

function MatrixVoteGrid({
  question,
  value,
  onChange,
}: {
  question: OrganizerPollQuestion;
  value: Record<string, string>;
  onChange: (rowUniqueId: string, columnUniqueId: string) => void;
}) {
  const matrixColumns = question.matrixColumns;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
      <div
        className="grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
        style={{ gridTemplateColumns: `minmax(0, 1.25fr) repeat(${Math.max(matrixColumns.length, 1)}, minmax(0, 1fr))` }}
      >
        <div className="px-4 py-3">Row</div>
        {matrixColumns.map((column) => (
          <div key={column.uniqueId} className="px-4 py-3 text-center">
            {column.label}
          </div>
        ))}
      </div>

      <div className="divide-y divide-slate-200">
        {question.matrixRows.map((row) => (
          <div
            key={row.uniqueId}
            className="grid"
            style={{ gridTemplateColumns: `minmax(0, 1.25fr) repeat(${Math.max(matrixColumns.length, 1)}, minmax(0, 1fr))` }}
          >
            <div className="px-4 py-4 text-sm font-medium text-slate-700">{row.label}</div>
            {matrixColumns.map((column) => {
              const isSelected = value[row.uniqueId] === column.uniqueId;

              return (
                <button
                  key={column.uniqueId}
                  type="button"
                  onClick={() => onChange(row.uniqueId, column.uniqueId)}
                  className={[
                    "flex items-center justify-center px-4 py-4 transition",
                    isSelected ? "bg-cyan-50" : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                  aria-label={`${row.label} - ${column.label}`}
                >
                  <span
                    className={[
                      "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                      isSelected ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-300 bg-white text-transparent",
                    ].join(" ")}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingScale({
  max,
  min = 1,
  value,
  onChange,
  labels,
}: {
  max: number;
  min?: number;
  value: number | null;
  onChange: (value: number | null) => void;
  labels?: [string, string];
}) {
  const options = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={[
                "flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition",
                isSelected
                  ? "border-cyan-500 bg-cyan-500 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        <span>{labels?.[0] ?? (max === 5 ? "Low" : "Not likely")}</span>
        <span>{labels?.[1] ?? (max === 5 ? "High" : "Very likely")}</span>
      </div>
    </div>
  );
}

function StarRatingControl({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => index + 1).map((option) => {
          const isSelected = value !== null && option <= value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={[
                "inline-flex h-12 w-12 items-center justify-center rounded-xl border transition",
                isSelected
                  ? "border-amber-300 bg-amber-400 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-400",
              ].join(" ")}
              aria-label={`${option} star${option === 1 ? "" : "s"}`}
            >
              <Star className={["h-5 w-5", isSelected ? "fill-current" : ""].join(" ")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RankedChoiceControl({
  question,
  value,
  isConfirmed,
  needsReconfirm,
  onChange,
  onConfirm,
  sensors,
}: {
  question: OrganizerPollQuestion;
  value: string[];
  isConfirmed: boolean;
  needsReconfirm: boolean;
  onChange: (nextValue: string[]) => void;
  onConfirm: () => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const orderedOptions = useMemo(() => {
    const byId = new Map(question.options.map((option) => [option.uniqueId, option] as const));
    const nextOptions = value.map((optionUniqueId) => byId.get(optionUniqueId)).filter(Boolean) as OrganizerPollQuestion["options"];
    const remaining = question.options.filter((option) => !value.includes(option.uniqueId));
    return [...nextOptions, ...remaining];
  }, [question.options, value]);

  const activeOption = activeOptionId ? question.options.find((option) => option.uniqueId === activeOptionId) ?? null : null;
  const restrictToContainerBounds: Modifier = ({ transform, activeNodeRect, containerNodeRect }) => {
    if (!activeNodeRect || !containerNodeRect) {
      return transform;
    }

    const minY = containerNodeRect.top - activeNodeRect.top;
    const maxY = containerNodeRect.bottom - activeNodeRect.bottom;

    return {
      ...transform,
      x: 0,
      y: Math.min(Math.max(transform.y, minY), maxY),
    };
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveOptionId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveOptionId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedOptions.findIndex((option) => option.uniqueId === active.id);
    const newIndex = orderedOptions.findIndex((option) => option.uniqueId === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange(arrayMove(orderedOptions, oldIndex, newIndex).map((option) => option.uniqueId));
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToContainerBounds]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedOptions.map((option) => option.uniqueId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedOptions.map((option, index) => (
              <SortableRankedOption key={option.uniqueId} option={option} index={index} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeOption ? (
            <div className="flex items-center gap-3 rounded-[1.15rem] border border-cyan-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-2xl shadow-slate-900/20 ring-4 ring-cyan-100">
              <GripVertical className="h-4 w-4 text-cyan-700" />
              {activeOption.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex justify-end">
        <div className="space-y-2 text-right">
          {needsReconfirm ? (
            <p className="text-xs font-semibold text-amber-700">Ranking changed. Please confirm again.</p>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
              isConfirmed
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "bg-cyan-600 text-white hover:bg-cyan-700",
            ].join(" ")}
          >
            {isConfirmed ? <Check className="mr-2 h-4 w-4" /> : null}
            {isConfirmed ? "Ranking confirmed" : "Confirm ranking"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableRankedOption({ option, index }: { option: OrganizerPollQuestion["options"][number]; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.uniqueId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "flex items-center gap-3 rounded-[1.15rem] border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900",
        isDragging ? "border-cyan-300 bg-cyan-50 opacity-50" : "border-slate-200",
      ].join(" ")}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700">
        {index + 1}
      </span>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-cyan-700 active:cursor-grabbing"
        aria-label={`Drag ${option.label} to reorder`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "cyan" | "emerald" | "rose";
}) {
  const toneClasses = {
    slate: "border-slate-200 bg-white text-slate-900",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

function ProgressTrack({
  label,
  description,
  value,
  total,
  tone,
}: {
  label: string;
  description: string;
  value: number;
  total: number;
  tone: "cyan" | "slate";
}) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
  const barClassName = tone === "cyan" ? "from-cyan-500 to-blue-500" : "from-slate-400 to-slate-500";
  const chipClassName = tone === "cyan" ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${chipClassName}`}>{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${barClassName} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
