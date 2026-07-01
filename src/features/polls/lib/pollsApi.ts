import { getJson, postJson } from "../../../lib/api";
import type { PollAudienceType, PollStatus } from "../../../types/polls";
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
