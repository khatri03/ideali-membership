import { getJson, postJson, putJson } from "../../../lib/api";
import { readResponseData } from "../../../lib/parseUtils";
import type { PollAudienceType, PollStatus } from "../../../types/polls";
import type { PollQuestionType } from "../../../types/polls";
import { POLL_API_ROUTES } from "../../../types/pollsApi";
import type { PollDetailResponse, PollListResponse, PollSaveRequest, PollSaveResponse } from "../../../types/pollsApi";

export interface PollListFilters {
  pageNo: number;
  pageSize: number;
  searchText: string;
  audienceType: PollAudienceType | null;
  status: PollStatus | null;
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

export async function publishOrganizerPoll(pollUniqueId: string) {
  return postJson<unknown>(POLL_API_ROUTES.organizer.publish(pollUniqueId), undefined);
}

export async function revertOrganizerPollToDraft(pollUniqueId: string) {
  return postJson<unknown>(POLL_API_ROUTES.organizer.revertToDraft(pollUniqueId), undefined);
}

export async function fetchOrganizerPollDetail(pollUniqueId: string, signal?: AbortSignal) {
  const payload = await getJson<unknown>(POLL_API_ROUTES.organizer.detail(pollUniqueId), { signal });
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

  const detail: PollDetailResponse = {
    uniqueId: String(responseData.UniqueId ?? responseData.uniqueId ?? ""),
    organizerUniqueId: String(responseData.OrganizerUniqueId ?? responseData.organizerUniqueId ?? ""),
    title: String(responseData.Title ?? responseData.title ?? ""),
    description: (responseData.Description ?? responseData.description ?? null) as string | null,
    audienceType: String(responseData.AudienceType ?? responseData.audienceType ?? "Public") as PollAudienceType,
    status: String(responseData.Status ?? responseData.status ?? "Draft") as PollStatus,
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
    isEligibleToVote: Boolean(responseData.IsEligibleToVote ?? responseData.isEligibleToVote),
    eligibilityMessage: (responseData.EligibilityMessage ?? responseData.eligibilityMessage ?? null) as string | null,
    currentUserVoteCount: readNumber(responseData.CurrentUserVoteCount ?? responseData.currentUserVoteCount, 0),
  };

  return detail;
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
