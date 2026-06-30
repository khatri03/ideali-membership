import { getJson } from "../../../lib/api";
import type { PollAudienceType, PollStatus } from "../../../types/polls";
import { POLL_API_ROUTES } from "../../../types/pollsApi";
import type { PollListResponse, PollQuestionTypeOption, PollSaveRequest, PollSaveResponse } from "../../../types/pollsApi";
import { postJson } from "../../../lib/api";
import { readResponseData, readText } from "../../../lib/parseUtils";

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

export async function fetchPollQuestionTypes() {
  const payload = await getJson<unknown>(POLL_API_ROUTES.organizer.questionTypes);
  const responseData = readResponseData(payload);
  const items = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as { Data?: unknown } | null)?.Data)
      ? ((responseData as { Data?: unknown }).Data as unknown[])
      : Array.isArray((responseData as { PageData?: unknown } | null)?.PageData)
        ? ((responseData as { PageData?: unknown }).PageData as unknown[])
        : [];

  return items
    .map((item): PollQuestionTypeOption | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      return {
        text: readText(record.Text ?? record.text),
        value: readText(record.Value ?? record.value),
      };
    })
    .filter((item): item is PollQuestionTypeOption => Boolean(item?.text && item?.value));
}
