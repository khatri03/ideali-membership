import type {
  OrganizerPollDraft,
  OrganizerPollDetail,
  OrganizerPollQuestionDraft,
  OrganizerPollSummary,
  OrganizerPollVote,
  OrganizerPollVoteAnswer,
  PollAudienceType,
  PollStatus,
  PollVoteIdentityType,
} from "./polls";

export const POLL_API_ROUTES = {
  organizer: {
    list: "/api/organizer/polls",
    create: "/api/organizer/polls",
    createAndPublish: "/api/organizer/polls/create-and-publish",
    questionTypes: "/api/organizer/polls/question-types",
    detail: (pollUniqueId: string) => `/api/organizer/polls/${encodeURIComponent(pollUniqueId)}`,
    update: (pollUniqueId: string) => `/api/organizer/polls/${encodeURIComponent(pollUniqueId)}`,
    publish: (pollUniqueId: string) => `/api/organizer/polls/${encodeURIComponent(pollUniqueId)}/publish`,
    revertToDraft: (pollUniqueId: string) => `/api/organizer/polls/${encodeURIComponent(pollUniqueId)}/revert-to-draft`,
    close: (pollUniqueId: string) => `/api/organizer/polls/${encodeURIComponent(pollUniqueId)}/close`,
    votes: (pollUniqueId: string) => `/api/organizer/polls/${encodeURIComponent(pollUniqueId)}/votes`,
  },
  public: {
    list: "/api/public/polls",
    detail: (pollUniqueId: string) => `/api/public/polls/${encodeURIComponent(pollUniqueId)}`,
    vote: (pollUniqueId: string) => `/api/public/polls/${encodeURIComponent(pollUniqueId)}/vote`,
    eligibility: (pollUniqueId: string) => `/api/public/polls/${encodeURIComponent(pollUniqueId)}/eligibility`,
  },
} as const;

export interface PollListRequest {
  pageNo: number;
  pageSize: number;
  searchText: string | null;
  audienceType: PollAudienceType | null;
  status: PollStatus | null;
}

export interface PollListResponse {
  items: OrganizerPollSummary[];
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
}

export interface PollDetailResponse extends OrganizerPollDetail {
  isEligibleToVote: boolean;
  eligibilityMessage: string | null;
  currentUserVoteCount: number;
}

export interface PollSaveRequest extends OrganizerPollDraft {
  questions: OrganizerPollQuestionDraft[];
}

export interface PollSaveResponse {
  uniqueId: string;
}

export interface PollEligibilityRequest {
  pollUniqueId: string;
}

export interface PollEligibilityResponse {
  pollUniqueId: string;
  isEligible: boolean;
  eligibilityMessage: string | null;
  identityType: PollVoteIdentityType;
}

export interface PollVoteRequest {
  voteIdentityType: PollVoteIdentityType;
  userUniqueId: string | null;
  anonymousVoteKeyHash: string | null;
  answers: OrganizerPollVoteAnswer[];
}

export interface PollVoteResponse {
  uniqueId: string;
  pollUniqueId: string;
  submittedAtUtc: string;
  voteIdentityType: PollVoteIdentityType;
}

export interface PollVoteListItem extends OrganizerPollVote {
  canDelete: boolean;
}
