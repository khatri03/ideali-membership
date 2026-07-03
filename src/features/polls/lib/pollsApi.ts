import { getJson, postJson, putJson } from "../../../lib/api";
import { readResponseData } from "../../../lib/parseUtils";
import type { OrganizerPollDetail, PollAudienceType, PollListSortBy, PollStatus } from "../../../types/polls";
import type { PollQuestionType } from "../../../types/polls";
import { POLL_API_ROUTES } from "../../../types/pollsApi";
import { getOrCreateAnonymousPollVoteKey } from "./pollVoteIdentity";
import type {
  PollListResponse,
  PollVoteListResponse,
  PollSaveRequest,
  PollSaveResponse,
  PollStatusUpdateRequest,
  PollVoteRequest,
  PollVoteResponse,
} from "../../../types/pollsApi";

export interface PollListFilters {
  pageNo: number;
  pageSize: number;
  searchText: string;
  audienceType: PollAudienceType | null;
  status: PollStatus | null;
  sortBy?: PollListSortBy | null;
  sortOrder?: "asc" | "desc" | null;
}

export interface PollQuestionTypeListItem {
  value: PollQuestionType;
  text: string;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildPollVotesResponse(payload: unknown): PollVoteListResponse {
  const responseData = readResponseData(payload);
  const responseRecord = responseData && typeof responseData === "object" ? (responseData as Record<string, unknown>) : null;
  const voteData = readArray(
    responseRecord?.PageData ??
      responseRecord?.pageData ??
      responseRecord?.Items ??
      responseRecord?.items ??
      responseData,
  ) as Array<Record<string, unknown>>;

  return voteData.map((item) => {
    const voteIdentity = readRecord(item.VoteIdentity ?? item.voteIdentity);
    return {
      uniqueId: String(item.UniqueId ?? item.uniqueId ?? ""),
      pollUniqueId: String(item.PollUniqueId ?? item.pollUniqueId ?? ""),
      votedAtUtc: String(item.SubmittedAtUtc ?? item.submittedAtUtc ?? item.VotedAtUtc ?? item.votedAtUtc ?? ""),
      voteIdentity: {
        voteIdentityType: String(voteIdentity?.VoteIdentityType ?? voteIdentity?.voteIdentityType ?? "Anonymous") as "Authenticated" | "Anonymous",
        userUniqueId: (voteIdentity?.UserUniqueId ?? voteIdentity?.userUniqueId ?? null) as string | null,
        anonymousVoteKeyHash: (voteIdentity?.AnonymousVoteKeyHash ?? voteIdentity?.anonymousVoteKeyHash ?? null) as string | null,
      },
      answers: readArray(item.Answers ?? item.answers).map((answer) => {
        const answerRecord = readRecord(answer);
        return {
          questionUniqueId: String(answerRecord?.QuestionUniqueId ?? answerRecord?.questionUniqueId ?? ""),
          optionUniqueIds: readArray(answerRecord?.OptionUniqueIds ?? answerRecord?.optionUniqueIds).map((value) => String(value)),
          textValue: (answerRecord?.TextValue ?? answerRecord?.textValue ?? null) as string | null,
          numericValue: (answerRecord?.NumericValue ?? answerRecord?.numericValue ?? null) as number | null,
          rankValue: (answerRecord?.RankValue ?? answerRecord?.rankValue ?? null) as number | null,
          matrixSelections: readArray(answerRecord?.MatrixSelections ?? answerRecord?.matrixSelections).map((selection) => {
            const selectionRecord = readRecord(selection);
            return {
              rowUniqueId: String(selectionRecord?.RowUniqueId ?? selectionRecord?.rowUniqueId ?? ""),
              columnUniqueId: String(selectionRecord?.ColumnUniqueId ?? selectionRecord?.columnUniqueId ?? ""),
            };
          }),
        };
      }),
      canDelete: Boolean(item.CanDelete ?? item.canDelete),
    };
  });
}

function buildPollDetailResponse(payload: unknown): OrganizerPollDetail {
  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  if (!responseData) {
    throw new Error("Unable to load poll detail.");
  }

  const questions = readArray(responseData.Questions ?? responseData.questions).map((item) => {
    const record = readRecord(item);
    return {
      uniqueId: String(record?.UniqueId ?? record?.uniqueId ?? ""),
      questionType: String(record?.QuestionType ?? record?.questionType ?? "SingleChoice") as PollQuestionType,
      text: String(record?.Text ?? record?.text ?? ""),
      displayOrder: readNumber(record?.DisplayOrder ?? record?.displayOrder, 0),
      isRequired: Boolean(record?.IsRequired ?? record?.isRequired),
      options: readArray(record?.Options ?? record?.options).map((option) => {
        const optionRecord = readRecord(option);
        return {
          uniqueId: String(optionRecord?.UniqueId ?? optionRecord?.uniqueId ?? ""),
          label: String(optionRecord?.Label ?? optionRecord?.label ?? ""),
          value: (optionRecord?.Value ?? optionRecord?.value ?? null) as string | null,
          displayOrder: readNumber(optionRecord?.DisplayOrder ?? optionRecord?.displayOrder, 0),
        };
      }),
      matrixRows: readArray(record?.MatrixRows ?? record?.matrixRows).map((row) => {
        const rowRecord = readRecord(row);
        return {
          uniqueId: String(rowRecord?.UniqueId ?? rowRecord?.uniqueId ?? ""),
          label: String(rowRecord?.Label ?? rowRecord?.label ?? ""),
          displayOrder: readNumber(rowRecord?.DisplayOrder ?? rowRecord?.displayOrder, 0),
        };
      }),
      matrixColumns: readArray(record?.MatrixColumns ?? record?.matrixColumns).map((column) => {
        const columnRecord = readRecord(column);
        return {
          uniqueId: String(columnRecord?.UniqueId ?? columnRecord?.uniqueId ?? ""),
          label: String(columnRecord?.Label ?? columnRecord?.label ?? ""),
          value: (columnRecord?.Value ?? columnRecord?.value ?? null) as string | null,
          displayOrder: readNumber(columnRecord?.DisplayOrder ?? columnRecord?.displayOrder, 0),
        };
      }),
    };
  });

  return {
    uniqueId: String(responseData.UniqueId ?? responseData.uniqueId ?? ""),
    organizerUniqueId: String(responseData.OrganizerUniqueId ?? responseData.organizerUniqueId ?? ""),
    title: String(responseData.Title ?? responseData.title ?? ""),
    description: (responseData.Description ?? responseData.description ?? null) as string | null,
    audienceType: String(responseData.AudienceType ?? responseData.audienceType ?? "Public") as PollAudienceType,
    status: String(responseData.Status ?? responseData.status ?? "Draft") as PollStatus,
    allowOneVotePerPerson: Boolean(responseData.AllowOneVotePerPerson ?? responseData.allowOneVotePerPerson ?? true),
    requiredMembershipTypeUniqueIds: readArray(
      responseData.RequiredMembershipTypeUniqueIds ?? responseData.requiredMembershipTypeUniqueIds,
    ).map((item) => String(item)),
    startsAtUtc: (responseData.StartsAtUtc ?? responseData.startsAtUtc ?? null) as string | null,
    endsAtUtc: (responseData.EndsAtUtc ?? responseData.endsAtUtc ?? null) as string | null,
    questions: questions.map((question) => ({
      uniqueId: question.uniqueId,
      questionType: question.questionType,
      text: question.text,
      displayOrder: question.displayOrder,
      isRequired: question.isRequired,
      options: question.options,
      matrixRows: question.matrixRows,
      matrixColumns: question.matrixColumns,
    })),
    createdAtUtc: String(responseData.CreatedAtUtc ?? responseData.createdAtUtc ?? ""),
    updatedAtUtc: (responseData.UpdatedAtUtc ?? responseData.updatedAtUtc ?? null) as string | null,
    currentUserVote: (() => {
      const voteRecord = readRecord(responseData.CurrentUserVote ?? responseData.currentUserVote);
      if (!voteRecord) {
        return null;
      }

      const voteIdentity = readRecord(voteRecord.VoteIdentity ?? voteRecord.voteIdentity);
      return {
        uniqueId: String(voteRecord.UniqueId ?? voteRecord.uniqueId ?? ""),
        pollUniqueId: String(voteRecord.PollUniqueId ?? voteRecord.pollUniqueId ?? ""),
        votedAtUtc: String(voteRecord.SubmittedAtUtc ?? voteRecord.submittedAtUtc ?? voteRecord.VotedAtUtc ?? voteRecord.votedAtUtc ?? ""),
        voteIdentity: {
          voteIdentityType: String(voteIdentity?.VoteIdentityType ?? voteIdentity?.voteIdentityType ?? "Anonymous") as "Authenticated" | "Anonymous",
          userUniqueId: (voteIdentity?.UserUniqueId ?? voteIdentity?.userUniqueId ?? null) as string | null,
          anonymousVoteKeyHash: (voteIdentity?.AnonymousVoteKeyHash ?? voteIdentity?.anonymousVoteKeyHash ?? null) as string | null,
        },
        answers: readArray(voteRecord.Answers ?? voteRecord.answers).map((answer) => {
          const answerRecord = readRecord(answer);
          return {
            questionUniqueId: String(answerRecord?.QuestionUniqueId ?? answerRecord?.questionUniqueId ?? ""),
            optionUniqueIds: readArray(answerRecord?.OptionUniqueIds ?? answerRecord?.optionUniqueIds).map((value) => String(value)),
            textValue: (answerRecord?.TextValue ?? answerRecord?.textValue ?? null) as string | null,
            numericValue: (answerRecord?.NumericValue ?? answerRecord?.numericValue ?? null) as number | null,
            rankValue: (answerRecord?.RankValue ?? answerRecord?.rankValue ?? null) as number | null,
            matrixSelections: readArray(answerRecord?.MatrixSelections ?? answerRecord?.matrixSelections).map((selection) => {
              const selectionRecord = readRecord(selection);
              return {
                rowUniqueId: String(selectionRecord?.RowUniqueId ?? selectionRecord?.rowUniqueId ?? ""),
                columnUniqueId: String(selectionRecord?.ColumnUniqueId ?? selectionRecord?.columnUniqueId ?? ""),
              };
            }),
          };
        }),
        canDelete: Boolean(voteRecord.CanDelete ?? voteRecord.canDelete),
      };
    })(),
  };
}

function buildPollListResponse(payload: unknown): PollListResponse {
  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  const pageData = readArray(
    responseData?.PageData ?? 
      responseData?.pageData ?? 
      responseData?.Items ??
      responseData?.items ??
      responseData?.Data ??
      responseData?.data,
  ) as Array<Record<string, unknown>>;

  return {
    items: pageData.map((item) => ({
      uniqueId: String(item.UniqueId ?? item.uniqueId ?? ""),
      organizerUniqueId: String(item.OrganizerUniqueId ?? item.organizerUniqueId ?? ""),
      title: String(item.Title ?? item.title ?? ""),
      description: (item.Description ?? item.description ?? null) as string | null,
      audienceType: String(item.AudienceType ?? item.audienceType ?? "Public") as PollAudienceType,
      status: String(item.Status ?? item.status ?? "Draft") as PollStatus,
      allowOneVotePerPerson: Boolean(item.AllowOneVotePerPerson ?? item.allowOneVotePerPerson ?? true),
      requiredMembershipTypeUniqueIds: readArray(item.RequiredMembershipTypeUniqueIds ?? item.requiredMembershipTypeUniqueIds).map(
        (membershipTypeUniqueId) => String(membershipTypeUniqueId),
      ),
      startsAtUtc: (item.StartsAtUtc ?? item.startsAtUtc ?? null) as string | null,
      endsAtUtc: (item.EndsAtUtc ?? item.endsAtUtc ?? null) as string | null,
      questionCount: readNumber(item.QuestionCount ?? item.questionCount, 0),
      voteCount: readNumber(item.VoteCount ?? item.voteCount, 0),
      createdAtUtc: String(item.CreatedAtUtc ?? item.createdAtUtc ?? ""),
      updatedAtUtc: (item.UpdatedAtUtc ?? item.updatedAtUtc ?? null) as string | null,
    })),
    pageNo: readNumber(responseData?.PageNo ?? responseData?.pageNo, 1),
    pageSize: readNumber(responseData?.PageSize ?? responseData?.pageSize, 0),
    pageCount: readNumber(responseData?.PageCount ?? responseData?.pageCount, 0),
    totalRecordsCount: readNumber(responseData?.TotalRecordsCount ?? responseData?.totalRecordsCount, 0),
  };
}

export function buildPollListQuery(filters: PollListFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set("pageNo", String(filters.pageNo));
  searchParams.set("pageSize", String(filters.pageSize));

  if (filters.searchText.trim()) {
    searchParams.set("searchText", filters.searchText.trim());
  }

  if (filters.audienceType) {
    searchParams.set("audienceType", filters.audienceType);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.sortBy) {
    searchParams.set("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    searchParams.set("sortOrder", filters.sortOrder);
  }

  return searchParams.toString();
}

export async function fetchOrganizerPolls(filters: PollListFilters, signal?: AbortSignal) {
  const query = buildPollListQuery(filters);
  const path = query ? `${POLL_API_ROUTES.organizer.list}?${query}` : POLL_API_ROUTES.organizer.list;
  const payload = await getJson<unknown>(path, { signal });
  return buildPollListResponse(payload);
}

export async function createOrganizerPoll(request: PollSaveRequest) {
  return postJson<PollSaveResponse>(POLL_API_ROUTES.organizer.create, request);
}

export async function createAndPublishOrganizerPoll(request: PollSaveRequest) {
  return postJson<PollSaveResponse>(POLL_API_ROUTES.organizer.createAndPublish, request);
}

export async function updateOrganizerPoll(pollUniqueId: string, request: PollSaveRequest) {
  return putJson<PollSaveResponse>(POLL_API_ROUTES.organizer.update(pollUniqueId), request);
}

export async function updateOrganizerPollStatus(pollUniqueId: string, status: PollStatus) {
  const request: PollStatusUpdateRequest = { status };
  return postJson<unknown>(POLL_API_ROUTES.organizer.status(pollUniqueId), request);
}

export async function publishOrganizerPoll(pollUniqueId: string) {
  return postJson<unknown>(POLL_API_ROUTES.organizer.publish(pollUniqueId), undefined);
}

export async function revertOrganizerPollToDraft(pollUniqueId: string) {
  return postJson<unknown>(POLL_API_ROUTES.organizer.revertToDraft(pollUniqueId), undefined);
}

export async function fetchOrganizerPollDetail(pollUniqueId: string, signal?: AbortSignal) {
  const payload = await getJson<unknown>(POLL_API_ROUTES.organizer.detail(pollUniqueId), { signal });
  const detail = buildPollDetailResponse(payload);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  return {
    ...detail,
    isEligibleToVote: Boolean(responseData?.IsEligibleToVote ?? responseData?.isEligibleToVote),
    eligibilityMessage: (responseData?.EligibilityMessage ?? responseData?.eligibilityMessage ?? null) as string | null,
    currentUserVoteCount: readNumber(responseData?.CurrentUserVoteCount ?? responseData?.currentUserVoteCount, 0),
  };
}

export async function fetchPublicPollDetail(pollUniqueId: string, signal?: AbortSignal) {
  const anonymousVoteKeyHash = getOrCreateAnonymousPollVoteKey(pollUniqueId);
  const path = anonymousVoteKeyHash
    ? `${POLL_API_ROUTES.public.detail(pollUniqueId)}?anonymousVoteKeyHash=${encodeURIComponent(anonymousVoteKeyHash)}`
    : POLL_API_ROUTES.public.detail(pollUniqueId);
  const payload = await getJson<unknown>(path, { signal });
  const detail = buildPollDetailResponse(payload);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  return {
    ...detail,
    isEligibleToVote: Boolean(responseData?.IsEligibleToVote ?? responseData?.isEligibleToVote),
    eligibilityMessage: (responseData?.EligibilityMessage ?? responseData?.eligibilityMessage ?? null) as string | null,
    currentUserVoteCount: readNumber(responseData?.CurrentUserVoteCount ?? responseData?.currentUserVoteCount, 0),
  };
}

export async function submitPublicPollVote(pollUniqueId: string, request: PollVoteRequest) {
  return postJson<PollVoteResponse>(POLL_API_ROUTES.public.vote(pollUniqueId), request);
}

export async function fetchOrganizerPollVotes(pollUniqueId: string, signal?: AbortSignal) {
  const payload = await getJson<unknown>(POLL_API_ROUTES.organizer.votes(pollUniqueId), { signal });
  return buildPollVotesResponse(payload);
}

export async function fetchOrganizerPollReviewSummary(pollUniqueId: string, signal?: AbortSignal) {
  const payload = await getJson<unknown>(POLL_API_ROUTES.organizer.reviewSummary(pollUniqueId), { signal });
  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  if (!responseData) {
    throw new Error("Unable to load poll review summary.");
  }

  return {
    pollUniqueId: String(responseData.PollUniqueId ?? responseData.pollUniqueId ?? ""),
    totalResponses: readNumber(responseData.TotalResponses ?? responseData.totalResponses, 0),
    authenticatedResponses: readNumber(responseData.AuthenticatedResponses ?? responseData.authenticatedResponses, 0),
    anonymousResponses: readNumber(responseData.AnonymousResponses ?? responseData.anonymousResponses, 0),
    questionCount: readNumber(responseData.QuestionCount ?? responseData.questionCount, 0),
    requiredQuestionCount: readNumber(responseData.RequiredQuestionCount ?? responseData.requiredQuestionCount, 0),
    optionalQuestionCount: readNumber(responseData.OptionalQuestionCount ?? responseData.optionalQuestionCount, 0),
    firstSubmittedAtUtc: (responseData.FirstSubmittedAtUtc ?? responseData.firstSubmittedAtUtc ?? null) as string | null,
    lastSubmittedAtUtc: (responseData.LastSubmittedAtUtc ?? responseData.lastSubmittedAtUtc ?? null) as string | null,
    questions: readArray(responseData.Questions ?? responseData.questions).map((item) => {
      const question = readRecord(item);
      return {
        questionUniqueId: String(question?.QuestionUniqueId ?? question?.questionUniqueId ?? ""),
        text: String(question?.Text ?? question?.text ?? ""),
        questionType: String(question?.QuestionType ?? question?.questionType ?? "SingleChoice") as PollQuestionType,
        displayOrder: readNumber(question?.DisplayOrder ?? question?.displayOrder, 0),
        isRequired: Boolean(question?.IsRequired ?? question?.isRequired),
        totalSelections: readNumber(question?.TotalSelections ?? question?.totalSelections, 0),
        responseCount: readNumber(question?.ResponseCount ?? question?.responseCount, 0),
        completionRatePercentage: readNumber(question?.CompletionRatePercentage ?? question?.completionRatePercentage, 0),
        averageNumericValue: (question?.AverageNumericValue ?? question?.averageNumericValue ?? null) as number | null,
        minimumNumericValue: (question?.MinimumNumericValue ?? question?.minimumNumericValue ?? null) as number | null,
        maximumNumericValue: (question?.MaximumNumericValue ?? question?.maximumNumericValue ?? null) as number | null,
        averageRankValue: (question?.AverageRankValue ?? question?.averageRankValue ?? null) as number | null,
        firstPlaceVotes: readNumber(question?.FirstPlaceVotes ?? question?.firstPlaceVotes, 0),
        npsPromoterCount: readNumber(question?.NpsPromoterCount ?? question?.npsPromoterCount, 0),
        npsPassiveCount: readNumber(question?.NpsPassiveCount ?? question?.npsPassiveCount, 0),
        npsDetractorCount: readNumber(question?.NpsDetractorCount ?? question?.npsDetractorCount, 0),
        npsScore: (question?.NpsScore ?? question?.npsScore ?? null) as number | null,
        optionSummaries: readArray(question?.OptionSummaries ?? question?.optionSummaries).map((option) => {
          const optionRecord = readRecord(option);
          return {
            optionUniqueId: (optionRecord?.OptionUniqueId ?? optionRecord?.optionUniqueId ?? null) as string | null,
            label: String(optionRecord?.Label ?? optionRecord?.label ?? ""),
            count: readNumber(optionRecord?.Count ?? optionRecord?.count, 0),
            percentage: readNumber(optionRecord?.Percentage ?? optionRecord?.percentage, 0),
            averageRankValue: (optionRecord?.AverageRankValue ?? optionRecord?.averageRankValue ?? null) as number | null,
            firstPlaceVotes: readNumber(optionRecord?.FirstPlaceVotes ?? optionRecord?.firstPlaceVotes, 0),
          };
        }),
        matrixCellSummaries: readArray(question?.MatrixCellSummaries ?? question?.matrixCellSummaries).map((cell) => {
          const cellRecord = readRecord(cell);
          return {
            rowUniqueId: String(cellRecord?.RowUniqueId ?? cellRecord?.rowUniqueId ?? ""),
            rowLabel: String(cellRecord?.RowLabel ?? cellRecord?.rowLabel ?? ""),
            columnUniqueId: String(cellRecord?.ColumnUniqueId ?? cellRecord?.columnUniqueId ?? ""),
            columnLabel: String(cellRecord?.ColumnLabel ?? cellRecord?.columnLabel ?? ""),
            count: readNumber(cellRecord?.Count ?? cellRecord?.count, 0),
            percentage: readNumber(cellRecord?.Percentage ?? cellRecord?.percentage, 0),
          };
        }),
        textSamples: readArray(question?.TextSamples ?? question?.textSamples).map((sample) => {
          const sampleRecord = readRecord(sample);
          return {
            value: String(sampleRecord?.Value ?? sampleRecord?.value ?? ""),
            submittedAtUtc: String(sampleRecord?.SubmittedAtUtc ?? sampleRecord?.submittedAtUtc ?? ""),
          };
        }),
      };
    }),
  };
}

export async function fetchOrganizerPollQuestionTypes(signal?: AbortSignal) {
  const payload = await getJson<unknown>(POLL_API_ROUTES.organizer.questionTypes, { signal });
  const data = readResponseData(payload);

  if (!Array.isArray(data)) {
    return [] as PollQuestionTypeListItem[];
  }

  return data
    .map((item) => {
      const candidate = item as Record<string, unknown>;
      const value = candidate.Value ?? candidate.value;
      const text = candidate.Text ?? candidate.text;
      if (typeof value !== "string" || typeof text !== "string") {
        return null;
      }

      return {
        value,
        text,
      };
    })
    .filter((item): item is PollQuestionTypeListItem => item !== null && item.value.length > 0 && item.text.length > 0);
}
