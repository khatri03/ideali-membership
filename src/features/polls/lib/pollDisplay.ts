import type { OrganizerPollSummary, PollAudienceType, PollStatus, PollQuestionType } from "../../../types/polls";

export const POLL_TYPE_COPY: Record<PollQuestionType, { label: string; description: string; status: "Core" | "Deferred" }> = {
  SingleChoice: {
    label: "Single choice",
    description: "Best default when one answer is required.",
    status: "Core",
  },
  MultipleChoice: {
    label: "Multiple choice",
    description: "Use when more than one answer is valid.",
    status: "Core",
  },
  YesNo: {
    label: "Yes / No",
    description: "Fast binary decision with minimal friction.",
    status: "Core",
  },
  OpenText: {
    label: "Open-ended",
    description: "Best for feedback, suggestions, and comments.",
    status: "Core",
  },
  StarRating: {
    label: "Star rating",
    description: "Good for quick sentiment scoring.",
    status: "Core",
  },
  Nps: {
    label: "NPS",
    description: "Simple loyalty scoring on a 0-10 scale.",
    status: "Core",
  },
  RankedChoice: {
    label: "Ranked choice",
    description: "Useful when prioritization matters.",
    status: "Core",
  },
  Matrix: {
    label: "Matrix / Grid",
    description: "Deferred until the basic flow is stable.",
    status: "Deferred",
  },
  DateTimeAvailability: {
    label: "Date / Time availability",
    description: "Deferred. This behaves more like scheduling.",
    status: "Deferred",
  },
};

export const POLL_PAGE_ROUTE_SUMMARY = {
  organizerRouteCount: 5,
  publicRouteCount: 3,
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
      requiredMembershipTypeUniqueId: null,
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
      requiredMembershipTypeUniqueId: "membership-premium",
      startsAtUtc: null,
      endsAtUtc: null,
      questionCount: 3,
      voteCount: 0,
      createdAtUtc: "2026-06-30T14:05:00Z",
      updatedAtUtc: null,
    },
  ];
}
