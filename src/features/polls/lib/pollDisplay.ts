import type { OrganizerPollSummary, PollAudienceType, PollStatus } from "../../../types/polls";
import { FALLBACK_POLL_QUESTION_TYPES, POLL_QUESTION_TYPE_CATALOG } from "./pollQuestionTypes";

export const POLL_TYPE_COPY = Object.fromEntries(
  FALLBACK_POLL_QUESTION_TYPES.map((questionType) => [
    questionType,
    {
      label: POLL_QUESTION_TYPE_CATALOG[questionType].label,
      description: POLL_QUESTION_TYPE_CATALOG[questionType].description,
    },
  ]),
) as Record<
  (typeof FALLBACK_POLL_QUESTION_TYPES)[number],
  {
    label: string;
    description: string;
  }
>;

export const POLL_PAGE_ROUTE_SUMMARY = {
  organizerRouteCount: 7,
  publicRouteCount: 4,
} as const;

export function getPollAudienceCopy(audienceType: PollAudienceType) {
  return audienceType === "Public" ? "Visible to everyone" : "Members only";
}

export function getPollStatusTone(status: PollStatus) {
  if (status === "Published") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "Draft") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-700";
}

export function buildSamplePolls(): OrganizerPollSummary[] {
  return [
    {
      uniqueId: "poll-001",
      organizerUniqueId: "org-001",
      title: "Community lunch preference",
      description: "Public poll for attendees and members.",
      audienceType: "Public",
      status: "Published",
      allowOneVotePerPerson: true,
      requiredMembershipTypeUniqueIds: [],
      startsAtUtc: "2026-07-01T08:00:00Z",
      endsAtUtc: "2026-07-15T18:00:00Z",
      questionCount: 1,
      voteCount: 124,
      createdAtUtc: "2026-06-29T11:30:00Z",
      updatedAtUtc: "2026-06-30T09:15:00Z",
    },
    {
      uniqueId: "poll-002",
      organizerUniqueId: "org-001",
      title: "Premium member feature vote",
      description: "Only active members of the mapped plan can see it.",
      audienceType: "MembersOnly",
      status: "Draft",
      allowOneVotePerPerson: true,
      requiredMembershipTypeUniqueIds: ["membership-premium"],
      startsAtUtc: null,
      endsAtUtc: null,
      questionCount: 3,
      voteCount: 0,
      createdAtUtc: "2026-06-30T14:05:00Z",
      updatedAtUtc: null,
    },
  ];
}
