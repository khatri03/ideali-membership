import { getJson, postJson } from "../../../lib/api";
import { readResponseData } from "../../../lib/parseUtils";
import type { PollAudienceType, PollStatus } from "../../../types/polls";
import type { PollQuestionType } from "../../../types/polls";
import { POLL_API_ROUTES } from "../../../types/pollsApi";
import type { PollListResponse, PollSaveRequest, PollSaveResponse } from "../../../types/pollsApi";

export interface PollListFilters {
  pageNo: number;
  pageSize: number;
  searchText: string;
  audienceType: PollAudienceType | null;
  status: PollStatus | null;
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
  return getJson<PollListResponse>(path, { signal });
}

export async function createOrganizerPoll(request: PollSaveRequest) {
  return postJson<PollSaveResponse>(POLL_API_ROUTES.organizer.create, request);
}

export async function fetchOrganizerPollQuestionTypes(signal?: AbortSignal) {
  const payload = await getJson<unknown>(POLL_API_ROUTES.organizer.questionTypes, { signal });
  const data = readResponseData(payload);

  if (!Array.isArray(data)) {
    return [] as PollQuestionType[];
  }

  return data
    .map((item) => {
      const candidate = item as Record<string, unknown>;
      const value = candidate.Value ?? candidate.value;
      return typeof value === "string" ? value : "";
    })
    .filter((item): item is PollQuestionType => item.length > 0);
}
